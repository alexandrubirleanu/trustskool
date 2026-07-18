#!/usr/bin/env python3
"""
Scraper for Skool's public /discovery listing, across all 48 language filters.
Data source: server-rendered __NEXT_DATA__ JSON embedded in the discovery page HTML.
Respects robots.txt (Allow: / ; only /*/--/* disallowed, unrelated to /discovery).
"""
import json
import re
import time
import sys
import os
import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(OUT_DIR, "skool_data")
os.makedirs(DATA_DIR, exist_ok=True)

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 TrustSkoolResearchBot/0.1"
SLEEP_SECONDS = 4.0
PAGE_SIZE = 30
MAX_RETRIES = 4
COOLDOWN_ON_BLOCK = 90

LANGUAGES = [
    "english", "german", "spanish", "french", "chinese", "italian", "dutch",
    "vietnamese", "arabic", "hebrew", "danish", "romanian", "turkish", "polish",
    "czech", "hungarian", "swedish", "portuguese", "bulgarian", "norwegian",
    "finnish", "croatian", "latvian", "slovak", "serbian", "mongolian", "haitian",
    "thai", "slovenian", "russian", "lithuanian", "amharic", "malay", "estonian",
    "greek", "ukrainian", "swahili", "japanese", "filipino", "persian", "welsh",
    "korean", "cantonese", "indonesian", "latin", "bengali", "catalan", "hindi",
]

# Category param is "c" (verified by clicking a category tab live and reading the resulting URL,
# NOT "cat" as first guessed). Combining category + language surfaces largely disjoint result sets
# beyond the ~1000-per-language cap on the plain trending query (verified: 0 overlap across 9
# categories' first pages for English).
CATEGORIES = {
    "hobbies": "8a7678583d3246a1a1a0a4a994321146",
    "music": "f08071afbd9746b6adb83522451cd280",
    "money": "2830789533b448d8812e7d5d661d776c",
    "spirituality": "ce77e1a8d5824d8497921368a9328dc0",
    "tech": "b1dae7402dda47a0b7aa51334474a158",
    "health": "e85018a1df484d5ea09c43c8b2764586",
    "sports": "ca063c42092041d5a8f48dd1903a1f3b",
    "selfimprovement": "5c00cc7aee1048588759b5504380917a",
    "relationships": "fd915e5fee4a496db1c82c527a33ef09",
}

NEXT_DATA_RE = re.compile(r'__NEXT_DATA__" type="application/json">(.*?)</script>', re.S)


def fetch_page(lang, page, category_id=None):
    url = f"https://www.skool.com/discovery?lang={lang}&srt=trending&p={page}"
    if category_id:
        url += f"&c={category_id}"
    for attempt in range(1, MAX_RETRIES + 1):
        req = Request(url, headers={"User-Agent": UA, "Accept-Language": "en"})
        try:
            with urlopen(req, timeout=25) as resp:
                html = resp.read().decode("utf-8", errors="replace")
        except HTTPError as e:
            if e.code in (403, 429):
                wait = COOLDOWN_ON_BLOCK * attempt
                print(f"  ! {e.code} for {lang} p={page} (attempt {attempt}/{MAX_RETRIES}), cooling down {wait}s", file=sys.stderr)
                time.sleep(wait)
                continue
            print(f"  ! request error for {lang} p={page}: {e}", file=sys.stderr)
            return "error"
        except (URLError, OSError, TimeoutError) as e:
            # broadened from URLError-only: a bare socket.timeout/OSError mid-read is NOT
            # wrapped as URLError and was crashing the whole process unhandled (root cause
            # of the French expansion run dying mid-way on 2026-07-18).
            print(f"  ! network error for {lang} p={page}: {e}", file=sys.stderr)
            wait = 10 * attempt
            time.sleep(wait)
            continue
        m = NEXT_DATA_RE.search(html)
        if not m:
            print(f"  ! no __NEXT_DATA__ for {lang} p={page}", file=sys.stderr)
            return "error"
        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError as e:
            print(f"  ! JSON decode error for {lang} p={page}: {e}", file=sys.stderr)
            return "error"
        return data.get("props", {}).get("pageProps", {})
    print(f"  ! giving up on {lang} p={page} after {MAX_RETRIES} attempts (blocked)", file=sys.stderr)
    return "blocked"


def parse_price(display_price_raw):
    if not display_price_raw:
        return None, None, None
    try:
        dp = json.loads(display_price_raw)
        return dp.get("amount"), dp.get("currency"), dp.get("recurring_interval")
    except (json.JSONDecodeError, TypeError):
        return None, None, None


def normalize_group(entry, lang):
    g = entry.get("group", {})
    meta = g.get("metadata", {})
    amount, currency, interval = parse_price(meta.get("displayPrice"))
    slug = g.get("name")
    return {
        "id": g.get("id"),
        "slug": slug,
        "url": f"https://www.skool.com/{slug}" if slug else None,
        "display_name": meta.get("displayName"),
        "description": meta.get("description"),
        "total_members": meta.get("totalMembers"),
        "price_amount_cents": amount,
        "price_currency": currency,
        "price_interval": interval,
        "logo_url": meta.get("logoUrl"),
        "cover_url": meta.get("coverSmallUrl"),
        "membership_model": meta.get("membershipModel"),
        "created_at": g.get("createdAt"),
        "updated_at": g.get("updatedAt"),
        "language": lang,
        "discovery_rank": entry.get("rank"),
    }


def fetch_all_groups(lang, category_id=None, label=None):
    """Paginate a language (+ optional category) discovery listing to the natural end.
    Returns (records, reached_natural_end)."""
    tag = label or lang
    seen_ids = set()
    records = []
    page = 1
    total_declared = None
    reached_natural_end = False
    while True:
        pp = fetch_page(lang, page, category_id=category_id)
        time.sleep(SLEEP_SECONDS)
        if pp in ("error", "blocked"):
            print(f"[{tag}] stopping early at page {page} due to fetch error/block ({pp})")
            break
        groups = pp.get("groups") or []
        if total_declared is None:
            total_declared = pp.get("numGroups")
            print(f"[{tag}] declared total: {total_declared}")
        if not groups:
            reached_natural_end = True
            break
        for entry in groups:
            gid = entry.get("group", {}).get("id")
            if gid and gid not in seen_ids:
                seen_ids.add(gid)
                records.append(normalize_group(entry, lang))
        print(f"[{tag}] page {page}: +{len(groups)} groups (total collected: {len(records)}/{total_declared})")
        if len(groups) < PAGE_SIZE:
            reached_natural_end = True
            break
        page += 1
        if page > 200:  # sanity guard against infinite loop
            reached_natural_end = True
            print(f"[{tag}] hit safety page cap (200), stopping")
            break
    return records, reached_natural_end


def expand_language(lang):
    """Break past the ~1000-per-language cap by also paginating through every category
    filter combined with this language, then merging (union by id) with whatever is
    already in <lang>.jsonl. Overwrites <lang>.jsonl with the expanded superset."""
    out_path = os.path.join(DATA_DIR, f"{lang}.jsonl")
    merged = {}
    for rec in load_jsonl_helper(out_path):
        merged[rec["id"]] = rec

    plain_records, _ = fetch_all_groups(lang, label=f"{lang}/plain")
    for r in plain_records:
        merged[r["id"]] = r

    for cat_name, cat_id in CATEGORIES.items():
        cat_records, _ = fetch_all_groups(lang, category_id=cat_id, label=f"{lang}/{cat_name}")
        for r in cat_records:
            merged[r["id"]] = r

    with open(out_path, "w", encoding="utf-8") as f:
        for r in merged.values():
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    with open(os.path.join(DATA_DIR, f"{lang}.done"), "w") as f:
        f.write(str(len(merged)))
    print(f"[{lang}] EXPANDED: {len(merged)} total communities (plain + {len(CATEGORIES)} categories, deduped)")


def load_jsonl_helper(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def scrape_language(lang):
    """One-time backfill mode: resume-safe via .done markers, overwrites the per-language latest snapshot."""
    out_path = os.path.join(DATA_DIR, f"{lang}.jsonl")
    done_marker = os.path.join(DATA_DIR, f"{lang}.done")
    if os.path.exists(done_marker):
        print(f"[{lang}] already done, skipping")
        return

    records, reached_natural_end = fetch_all_groups(lang)

    with open(out_path, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    if reached_natural_end:
        with open(done_marker, "w") as f:
            f.write(str(len(records)))
        print(f"[{lang}] DONE: {len(records)} communities saved to {out_path}")
    else:
        print(f"[{lang}] INCOMPLETE: {len(records)} saved to {out_path} (no .done marker, will retry next run)")


HISTORY_DIR = os.path.join(DATA_DIR, "history")


def refresh_language(lang, snapshot_date):
    """Recurring mode: always re-scrapes (ignores .done markers), appends a timestamped
    snapshot to history/<lang>.jsonl instead of overwriting the backfill file."""
    os.makedirs(HISTORY_DIR, exist_ok=True)
    records, reached_natural_end = fetch_all_groups(lang)
    if not reached_natural_end:
        print(f"[{lang}] refresh INCOMPLETE, discarding partial snapshot (will retry next scheduled run)")
        return False
    history_path = os.path.join(HISTORY_DIR, f"{lang}.jsonl")
    with open(history_path, "a", encoding="utf-8") as f:
        for r in records:
            r["scraped_at"] = snapshot_date
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"[{lang}] refresh DONE: {len(records)} communities appended to {history_path} (snapshot {snapshot_date})")
    return True


TIER_A_MIN_COMMUNITIES = 500


def classify_tiers():
    """Tier A = language segments large enough to matter daily. Tier B = the rest.
    Classification is dynamic, based on the last known count per language (from .done markers),
    so it self-adjusts as the dataset grows without needing a hardcoded language list."""
    tier_a, tier_b = [], []
    for lang in LANGUAGES:
        marker = os.path.join(DATA_DIR, f"{lang}.done")
        count = int(open(marker).read().strip()) if os.path.exists(marker) else 0
        (tier_a if count >= TIER_A_MIN_COMMUNITIES else tier_b).append(lang)
    return tier_a, tier_b


def main():
    args = sys.argv[1:]

    if args and args[0] == "--expand":
        targets = args[1:] or ["english"]
        print(f"Expand mode (plain + all {len(CATEGORIES)} categories), languages: {targets}")
        for lang in targets:
            expand_language(lang)
        # refresh the consumable dataset for the app after expanding
        os.system(f"{sys.executable} {os.path.join(OUT_DIR, 'build_communities_dataset.py')}")
        return

    refresh_mode = "--refresh" in args
    if refresh_mode:
        args = [a for a in args if a != "--refresh"]

    if args and args[0] == "--tier-a":
        only, _ = classify_tiers()
        print(f"Tier A languages ({len(only)}): {only}")
    elif args and args[0] == "--tier-b-bucket":
        bucket = int(args[1])
        num_buckets = int(args[3]) if len(args) > 3 and args[2] == "--tier-b-buckets" else 3
        _, tier_b = classify_tiers()
        only = [lang for i, lang in enumerate(tier_b) if i % num_buckets == bucket]
        print(f"Tier B bucket {bucket}/{num_buckets} ({len(only)} languages): {only}")
    elif args:
        only = args
    else:
        only = LANGUAGES

    if refresh_mode:
        snapshot_date = datetime.date.today().isoformat()
        print(f"Refresh mode, snapshot date {snapshot_date}, languages: {only}")
        failures = sum(1 for lang in only if not refresh_language(lang, snapshot_date))
        # A silent total failure (e.g. Skool blocking this IP) must show as a red X in GitHub
        # Actions, not a green checkmark identical to a clean run — this was a confirmed gap.
        if only and failures / len(only) > 0.3:
            print(f"FATAL: {failures}/{len(only)} languages failed this run (>30%) — exiting non-zero so CI flags it", file=sys.stderr)
            sys.exit(1)
        return  # refresh mode doesn't touch the backfill files or the combined snapshot

    for lang in only:
        scrape_language(lang)

    # consolidate
    combined_path = os.path.join(DATA_DIR, "_all_combined.jsonl")
    all_seen = {}
    for lang in LANGUAGES:
        p = os.path.join(DATA_DIR, f"{lang}.jsonl")
        if not os.path.exists(p):
            continue
        with open(p, encoding="utf-8") as f:
            for line in f:
                rec = json.loads(line)
                all_seen[rec["id"]] = rec
    with open(combined_path, "w", encoding="utf-8") as f:
        for rec in all_seen.values():
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    print(f"\nCOMBINED: {len(all_seen)} unique communities -> {combined_path}")


if __name__ == "__main__":
    main()
