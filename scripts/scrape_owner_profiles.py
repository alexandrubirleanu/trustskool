#!/usr/bin/env python3
"""
Enriches community records with owner-level public data: Skool's own MRR status
badge (rendered as plain emoji server-side right after "By <Name>" on every
community's /about page) and the real per-community affiliate commission
percentage (currentGroup.metadata.aflPercent, also present on /about).

One request per community (the /about page) covers both — no separate
/@handle profile visit needed for the core badge+affiliate data. The
/@handle profile page is only fetched (--with-portfolio) when we also want
the owner's full list of OTHER owned communities, for founder-hub pages.

Badge emoji -> meaning (confirmed against real profiles):
  🐐 goated       reserved for the single top earner on all of Skool
  ♦️ red_diamond  $300k+ MRR
  💎 diamond      $100k+ MRR
  👑 crown        $30k+ MRR
  🚀 rocket       $10k+ MRR
  🍀 clover       $3k+ MRR
  🔥 (not MRR)    30-day activity streak
  ⭐ (not MRR)    separate "notable creator" style badge, unrelated to revenue

Respects the same politeness pattern as scrape_skool_discovery.py.
"""
import json
import re
import sys
import os
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "skool_data")
OWNERS_PATH = os.path.join(DATA_DIR, "owner_badges.jsonl")
PORTFOLIO_PATH = os.path.join(DATA_DIR, "owner_profiles.jsonl")

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 TrustSkoolResearchBot/0.1"
SLEEP_SECONDS = 4.0
MAX_RETRIES = 4
COOLDOWN_ON_BLOCK = 90

NEXT_DATA_RE = re.compile(r'__NEXT_DATA__" type="application/json">(.*?)</script>', re.S)
PROFILE_LINK_RE = re.compile(r'href="/(@[a-zA-Z0-9_-]+)"')
# "By <span>First<!-- --> <!-- -->Last</span>" then N sibling divs each holding one badge emoji
OWNER_BLOCK_RE = re.compile(
    r'By <span>(.*?)</span></span></div></a></div>((?:<div class="sc-2d567713-0 [a-zA-Z]+">.*?</div>)*)',
    re.S,
)
BADGE_DIV_RE = re.compile(r'<div class="sc-2d567713-0 [a-zA-Z]+">(.*?)</div>')

MRR_EMOJI = {
    "🐐": "goated",
    "♦️": "red_diamond",
    "💎": "diamond",
    "👑": "crown",
    "🚀": "rocket",
    "🍀": "clover",
}
STREAK_EMOJI = {"🔥": "active_30d"}


def fetch_html(url):
    for attempt in range(1, MAX_RETRIES + 1):
        req = Request(url, headers={"User-Agent": UA, "Accept-Language": "en"})
        try:
            with urlopen(req, timeout=25) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except HTTPError as e:
            if e.code in (403, 429):
                wait = COOLDOWN_ON_BLOCK * attempt
                print(f"  ! {e.code} for {url} (attempt {attempt}/{MAX_RETRIES}), cooling down {wait}s", file=sys.stderr)
                time.sleep(wait)
                continue
            print(f"  ! request error for {url}: {e}", file=sys.stderr)
            return None
        except URLError as e:
            print(f"  ! request error for {url}: {e}", file=sys.stderr)
            time.sleep(10 * attempt)
            continue
    print(f"  ! giving up on {url} after {MAX_RETRIES} attempts", file=sys.stderr)
    return None


def parse_about_page(slug, html):
    result = {
        "slug": slug,
        "owner_handle": None,
        "owner_name": None,
        "afl_percent": None,
        "mrr_status": None,
        "active_30d_streak": False,
        "other_badges_raw": [],
    }

    handle_match = PROFILE_LINK_RE.search(html)
    if handle_match:
        result["owner_handle"] = handle_match.group(1).lstrip("@")

    owner_match = OWNER_BLOCK_RE.search(html)
    if owner_match:
        name_html = owner_match.group(1)
        result["owner_name"] = re.sub(r"<!--.*?-->", " ", name_html).replace("  ", " ").strip()
        badges = BADGE_DIV_RE.findall(owner_match.group(2))
        for b in badges:
            if b in MRR_EMOJI:
                result["mrr_status"] = MRR_EMOJI[b]
            elif b in STREAK_EMOJI:
                result["active_30d_streak"] = True
            else:
                result["other_badges_raw"].append(b)

    m = NEXT_DATA_RE.search(html)
    if m:
        try:
            data = json.loads(m.group(1))
            cg = data.get("props", {}).get("pageProps", {}).get("currentGroup", {})
            result["afl_percent"] = cg.get("metadata", {}).get("aflPercent")
        except json.JSONDecodeError:
            pass

    return result


def get_owner_profile(handle):
    html = fetch_html(f"https://www.skool.com/@{handle}")
    time.sleep(SLEEP_SECONDS)
    if not html:
        return None
    m = NEXT_DATA_RE.search(html)
    if not m:
        return None
    try:
        data = json.loads(m.group(1))
    except json.JSONDecodeError:
        return None
    user = data.get("props", {}).get("pageProps", {}).get("currentUser")
    if not user:
        return None
    owned = user.get("profileData", {}).get("groupsCreatedByUser") or []
    owned_communities = [
        {
            "slug": g.get("name"),
            "display_name": g.get("metadata", {}).get("displayName"),
            "total_members": g.get("metadata", {}).get("totalMembers"),
            "afl_percent": g.get("metadata", {}).get("aflPercent"),
        }
        for g in owned
    ]
    return {
        "handle": handle,
        "first_name": user.get("firstName"),
        "last_name": user.get("lastName"),
        "total_followers": user.get("profileData", {}).get("totalFollowers"),
        "owned_communities": owned_communities,
    }


def load_done_slugs(path, key="slug"):
    if not os.path.exists(path):
        return {}
    done = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            rec = json.loads(line)
            done[rec[key]] = rec
    return done


def main():
    args = sys.argv[1:]
    with_portfolio = "--with-portfolio" in args
    slugs = [a for a in args if a != "--with-portfolio"]
    if not slugs:
        print("Usage: scrape_owner_profiles.py <community-slug> [<community-slug> ...] [--with-portfolio]")
        return

    already_done = load_done_slugs(OWNERS_PATH)
    todo = [s for s in slugs if s not in already_done]
    print(f"{len(todo)} of {len(slugs)} communities need badge scraping (rest already done)")

    new_badge_records = []
    handles_seen = set()
    for slug in todo:
        html = fetch_html(f"https://www.skool.com/{slug}/about")
        time.sleep(SLEEP_SECONDS)
        if not html:
            print(f"[{slug}] fetch failed")
            continue
        info = parse_about_page(slug, html)
        print(f"[{slug}] owner={info['owner_name']} (@{info['owner_handle']}) mrr_status={info['mrr_status']} "
              f"afl_percent={info['afl_percent']} 30d_streak={info['active_30d_streak']}")
        new_badge_records.append(info)
        if info["owner_handle"]:
            handles_seen.add(info["owner_handle"])

    with open(OWNERS_PATH, "a", encoding="utf-8") as f:
        for rec in new_badge_records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    print(f"\nAppended {len(new_badge_records)} records to {OWNERS_PATH}")

    if with_portfolio:
        known_portfolios = load_done_slugs(PORTFOLIO_PATH, key="handle")
        new_handles = sorted(handles_seen - set(known_portfolios.keys()))
        print(f"Fetching {len(new_handles)} new owner portfolio pages...")
        portfolio_records = []
        for handle in new_handles:
            profile = get_owner_profile(handle)
            if profile:
                print(f"  [@{handle}] owns {len(profile['owned_communities'])} communities")
                portfolio_records.append(profile)
        with open(PORTFOLIO_PATH, "a", encoding="utf-8") as f:
            for rec in portfolio_records:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
        print(f"Appended {len(portfolio_records)} portfolio records to {PORTFOLIO_PATH}")


if __name__ == "__main__":
    main()
