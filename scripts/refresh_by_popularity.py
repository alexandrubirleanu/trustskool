#!/usr/bin/env python3
"""
Targeted per-community refresh, tiered by popularity (total_members), instead of
re-paginating whole-language discovery listings. One request per community (its
/about page), which also captures the owner MRR badge + real affiliate percentage
in the same pass (see scrape_owner_profiles.py for the parsing this reuses).

Tiers (thresholds originally calibrated from the distribution across 8,154
communities; slice sizes are updated as the dataset grows):
  Tier A  >= 2,000 members   refresh every 24-48h    ~330 communities today
  Tier B  200-1,999 members  refresh every 7-14 days  ~2,140 communities today
  Tier C  < 200 members      refresh every 30-45 days ~5,680 communities today

Execution model: never refresh a whole tier in one run. Each run refreshes
Tier A in full (small, fits comfortably in a daily budget) plus a ROTATING
SLICE of Tier B (so the full tier cycles every ~10 days) and Tier C (cycles
every ~35 days). New communities discovered by scrape_skool_discovery.py's
--expand mode automatically enter Tier C on their first appearance in
communities.json and get promoted as their member count grows.

Capacity check: after tiering, this script estimates whether the current
per-tier slice sizes can realistically keep pace with the target refresh
windows (given SLEEP_SECONDS request pacing) and emails an alert via Resend
if not, instead of silently falling behind. This needs RESEND_API_KEY and
ALERT_EMAIL as env vars (GitHub Actions secrets) to actually send; without
them it just prints the warning.
"""
import json
import re
import sys
import os
import time
import datetime
import urllib.request
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "skool_data")
HISTORY_DIR = os.path.join(DATA_DIR, "history")
COMMUNITIES_JSON = os.path.join(os.path.dirname(SCRIPT_DIR), "data", "communities.json")
BADGES_PATH = os.path.join(DATA_DIR, "owner_badges.jsonl")
ROTATION_STATE_PATH = os.path.join(DATA_DIR, "rotation_state.json")

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 TrustSkoolResearchBot/0.1"
SLEEP_SECONDS = 4.0
MAX_RETRIES = 4
COOLDOWN_ON_BLOCK = 90

# Tier thresholds (member count) and target full-cycle windows in days
TIER_A_MIN_MEMBERS = 2000
TIER_B_MIN_MEMBERS = 200
TIER_A_CYCLE_DAYS = 1     # refresh every run (~24-48h depending on run cadence)
TIER_B_CYCLE_DAYS = 10    # full tier refreshed once every ~10 days (within the 7-14 day ask)
TIER_C_CYCLE_DAYS = 35    # full tier refreshed once every ~35 days (within the 30-45 day ask)

NEXT_DATA_RE = re.compile(r'__NEXT_DATA__" type="application/json">(.*?)</script>', re.S)
PROFILE_LINK_RE = re.compile(r'href="/(@[a-zA-Z0-9_-]+)"')
OWNER_BLOCK_RE = re.compile(
    r'By <span>(.*?)</span></span></div></a></div>((?:<div class="sc-2d567713-0 [a-zA-Z]+">.*?</div>)*)',
    re.S,
)
BADGE_DIV_RE = re.compile(r'<div class="sc-2d567713-0 [a-zA-Z]+">(.*?)</div>')
MRR_EMOJI = {"🐐": "goated", "♦️": "red_diamond", "💎": "diamond", "👑": "crown", "🚀": "rocket", "🍀": "clover"}
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
            print(f"  ! HTTP error for {url}: {e}", file=sys.stderr)
            return None
        except (URLError, OSError, TimeoutError) as e:
            # broadened from the original scraper: bare socket.timeout/OSError during a slow
            # read is NOT wrapped as URLError and was crashing the whole process unhandled
            # (root cause of the French expansion run dying mid-way on 2026-07-18).
            print(f"  ! network error for {url}: {e}", file=sys.stderr)
            time.sleep(10 * attempt)
            continue
    print(f"  ! giving up on {url} after {MAX_RETRIES} attempts", file=sys.stderr)
    return None


def parse_about_page(slug, html):
    """Single-request extraction: current member/price/description stats AND owner badge/affiliate%."""
    result = {
        "slug": slug, "total_members": None, "price_amount_cents": None,
        "price_currency": None, "price_interval": None, "description": None,
        "owner_handle": None, "owner_name": None, "afl_percent": None,
        "mrr_status": None, "active_30d_streak": False,
    }
    owner_match = OWNER_BLOCK_RE.search(html)
    if owner_match:
        result["owner_name"] = re.sub(r"<!--.*?-->", " ", owner_match.group(1)).replace("  ", " ").strip()
        for b in BADGE_DIV_RE.findall(owner_match.group(2)):
            if b in MRR_EMOJI:
                result["mrr_status"] = MRR_EMOJI[b]
            elif b in STREAK_EMOJI:
                result["active_30d_streak"] = True
    handle_match = PROFILE_LINK_RE.search(html)
    if handle_match:
        result["owner_handle"] = handle_match.group(1).lstrip("@")

    m = NEXT_DATA_RE.search(html)
    if m:
        try:
            data = json.loads(m.group(1))
            cg = data.get("props", {}).get("pageProps", {}).get("currentGroup", {})
            meta = cg.get("metadata", {})
            result["afl_percent"] = meta.get("aflPercent")
            result["total_members"] = meta.get("totalMembers")
            result["description"] = meta.get("description")
            try:
                dp = json.loads(meta.get("displayPrice") or "null")
                if dp:
                    result["price_amount_cents"] = dp.get("amount")
                    result["price_currency"] = dp.get("currency")
                    result["price_interval"] = dp.get("recurring_interval")
            except (json.JSONDecodeError, TypeError):
                pass
        except json.JSONDecodeError:
            pass
    return result


def load_communities():
    with open(COMMUNITIES_JSON, encoding="utf-8") as f:
        return json.load(f)


def classify(communities):
    tier_a, tier_b, tier_c = [], [], []
    for c in communities:
        m = c.get("total_members") or 0
        if m >= TIER_A_MIN_MEMBERS:
            tier_a.append(c)
        elif m >= TIER_B_MIN_MEMBERS:
            tier_b.append(c)
        else:
            tier_c.append(c)
    return tier_a, tier_b, tier_c


def load_rotation_state():
    if os.path.exists(ROTATION_STATE_PATH):
        return json.load(open(ROTATION_STATE_PATH, encoding="utf-8"))
    return {"tier_b_cursor": 0, "tier_c_cursor": 0}


def save_rotation_state(state):
    with open(ROTATION_STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


def send_capacity_alert(subject, body_text):
    api_key = os.environ.get("RESEND_API_KEY")
    to_email = os.environ.get("ALERT_EMAIL")
    if not api_key or not to_email:
        print(f"[ALERT - not sent, missing RESEND_API_KEY/ALERT_EMAIL] {subject}\n{body_text}")
        return
    payload = json.dumps({
        "from": os.environ.get("EMAIL_FROM", "alerts@trustskool.com"),
        "to": [to_email],
        "subject": subject,
        "text": body_text,
    }).encode("utf-8")
    req = Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        urlopen(req, timeout=15)
        print(f"[ALERT sent] {subject}")
    except Exception as e:
        print(f"[ALERT send FAILED] {subject}: {e}", file=sys.stderr)


def check_capacity(tier_name, tier_size, slice_size, cycle_days):
    """If the slice size can't cycle the whole tier within cycle_days, or the daily time
    budget across all tiers is getting too close to a GH Actions job's practical runtime,
    flag it instead of silently falling behind."""
    if slice_size == 0:
        return None
    actual_cycle_days = tier_size / slice_size
    if actual_cycle_days > cycle_days * 1.25:  # 25% over target = worth flagging, not just 1% over
        return (
            f"{tier_name}: {tier_size} communities at {slice_size}/run will take "
            f"{actual_cycle_days:.1f} days to fully cycle (target: {cycle_days} days). "
            f"The dataset has grown faster than the refresh slice size."
        )
    return None


def refresh_slice(communities_slice, snapshot_date):
    os.makedirs(HISTORY_DIR, exist_ok=True)
    history_entries = []
    badge_entries = []
    for c in communities_slice:
        slug = c["slug"]
        html = fetch_html(f"https://www.skool.com/{slug}/about")
        time.sleep(SLEEP_SECONDS)
        if not html:
            print(f"[{slug}] fetch failed, skipping this cycle")
            continue
        info = parse_about_page(slug, html)
        history_entries.append({
            # full schema-compatible record (matches scrape_skool_discovery.py's normalize_group
            # shape) so build_communities_dataset.py never has to special-case this source or
            # blindly overwrite fields (like description) with None when this source lacks them.
            "id": c["id"], "slug": slug, "url": c.get("url"),
            "display_name": c.get("display_name"),
            "language": c.get("language"),
            "total_members": info["total_members"] if info["total_members"] is not None else c.get("total_members"),
            "price_amount_cents": info["price_amount_cents"] if info["price_amount_cents"] is not None else c.get("price_amount_cents"),
            "price_currency": info["price_currency"] or c.get("price_currency"),
            "price_interval": info["price_interval"] or c.get("price_interval"),
            "description": info["description"] or c.get("description"),
            "discovery_rank": None,  # not available from /about, only from /discovery
            "scraped_at": snapshot_date,
        })
        badge_entries.append({"slug": slug, **{k: v for k, v in info.items() if k != "slug"}})
        print(f"[{slug}] members={info['total_members']} mrr={info['mrr_status']} afl={info['afl_percent']}")

    lang_groups = {}
    for e in history_entries:
        lang_groups.setdefault("all", []).append(e)
    with open(os.path.join(HISTORY_DIR, "popularity_refresh.jsonl"), "a", encoding="utf-8") as f:
        for e in history_entries:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")
    with open(BADGES_PATH, "a", encoding="utf-8") as f:
        for e in badge_entries:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")
    return len(history_entries)


def main():
    args = sys.argv[1:]
    tier_b_slice_size = int(os.environ.get("TIER_B_SLICE_SIZE", "700"))
    tier_c_slice_size = int(os.environ.get("TIER_C_SLICE_SIZE", "800"))

    communities = load_communities()
    tier_a, tier_b, tier_c = classify(communities)
    print(f"Tiers: A(>= {TIER_A_MIN_MEMBERS} members)={len(tier_a)}  "
          f"B({TIER_B_MIN_MEMBERS}-{TIER_A_MIN_MEMBERS - 1})={len(tier_b)}  C(< {TIER_B_MIN_MEMBERS})={len(tier_c)}")

    warnings = []
    warnings.append(check_capacity("Tier A", len(tier_a), len(tier_a), TIER_A_CYCLE_DAYS))
    warnings.append(check_capacity("Tier B", len(tier_b), tier_b_slice_size, TIER_B_CYCLE_DAYS))
    warnings.append(check_capacity("Tier C", len(tier_c), tier_c_slice_size, TIER_C_CYCLE_DAYS))
    warnings = [w for w in warnings if w]

    total_requests_today = len(tier_a) + tier_b_slice_size + tier_c_slice_size
    estimated_minutes = total_requests_today * SLEEP_SECONDS / 60
    if estimated_minutes > 180:  # 3 hours: comfortably under GH Actions' default 6h job timeout, but worth a heads-up
        warnings.append(
            f"Estimated daily runtime is {estimated_minutes:.0f} minutes ({total_requests_today} requests "
            f"at {SLEEP_SECONDS}s each) — approaching a range where a single GH Actions job could time out "
            f"or overrun its window. Consider splitting into parallel jobs or a heavier concurrent scraper."
        )

    if warnings:
        body = "TrustSkool refresh pipeline can't keep pace with the target cadences:\n\n" + "\n\n".join(warnings) + \
               "\n\nThis needs either a heavier/more parallel routine, or the target windows relaxed. " \
               "-- automated capacity check, scripts/refresh_by_popularity.py"
        send_capacity_alert("⚠️ TrustSkool data refresh is falling behind schedule", body)
        for w in warnings:
            print(f"[CAPACITY WARNING] {w}")

    snapshot_date = datetime.date.today().isoformat()
    only = args[0] if args else "all"
    total_attempted, total_succeeded = 0, 0

    if only in ("all", "a"):
        n = refresh_slice(tier_a, snapshot_date)
        print(f"Tier A: refreshed {n}/{len(tier_a)}")
        total_attempted += len(tier_a); total_succeeded += n

    if only in ("all", "b"):
        state = load_rotation_state()
        cursor = state["tier_b_cursor"]
        chosen = [tier_b[i % len(tier_b)] for i in range(cursor, cursor + tier_b_slice_size)] if tier_b else []
        n = refresh_slice(chosen, snapshot_date)
        state["tier_b_cursor"] = (cursor + tier_b_slice_size) % max(len(tier_b), 1)
        save_rotation_state(state)
        print(f"Tier B: refreshed {n}/{len(chosen)} (cursor now {state['tier_b_cursor']}/{len(tier_b)})")
        total_attempted += len(chosen); total_succeeded += n

    if only in ("all", "c"):
        state = load_rotation_state()
        cursor = state["tier_c_cursor"]
        chosen = [tier_c[i % len(tier_c)] for i in range(cursor, cursor + tier_c_slice_size)] if tier_c else []
        n = refresh_slice(chosen, snapshot_date)
        state["tier_c_cursor"] = (cursor + tier_c_slice_size) % max(len(tier_c), 1)
        total_attempted += len(chosen); total_succeeded += n
        save_rotation_state(state)
        print(f"Tier C: refreshed {n}/{len(chosen)} (cursor now {state['tier_c_cursor']}/{len(tier_c)})")

    # A silent total failure (e.g. Skool blocking this IP) must show as a red X in GitHub
    # Actions, not a green checkmark identical to a clean run — this was a confirmed gap.
    if total_attempted and (total_attempted - total_succeeded) / total_attempted > 0.3:
        print(f"FATAL: only {total_succeeded}/{total_attempted} communities refreshed this run (>30% failed) "
              f"— exiting non-zero so CI flags it", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
