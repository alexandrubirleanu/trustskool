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

NEXT_DATA_RE = re.compile(r'__NEXT_DATA__" type="application/json">(.*?)</script>', re.S)


def fetch_page(lang, page):
    url = f"https://www.skool.com/discovery?lang={lang}&srt=trending&p={page}"
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
        except URLError as e:
            print(f"  ! request error for {lang} p={page}: {e}", file=sys.stderr)
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


def fetch_all_groups(lang):
    """Paginate a language's discovery listing to the natural end. Returns (records, reached_natural_end)."""
    seen_ids = set()
    records = []
    page = 1
    total_declared = None
    reached_natural_end = False
    while True:
        pp = fetch_page(lang, page)
        time.sleep(SLEEP_SECONDS)
        if pp in ("error", "blocked"):
            print(f"[{lang}] stopping early at page {page} due to fetch error/block ({pp})")
            break
        groups = pp.get("groups") or []
        if total_declared is None:
            total_declared = pp.get("numGroups")
            print(f"[{lang}] declared total: {total_declared}")
        if not groups:
            reached_natural_end = True
            break
        for entry in groups:
            gid = entry.get("group", {}).get("id")
            if gid and gid not in seen_ids:
                seen_ids.add(gid)
                records.append(normalize_group(entry, lang))
        print(f"[{lang}] page {page}: +{len(groups)} groups (total collected: {len(records)}/{total_declared})")
        if len(groups) < PAGE_SIZE:
            reached_natural_end = True
            break
        page += 1
        if page > 200:  # sanity guard against infinite loop
            reached_natural_end = True
            print(f"[{lang}] hit safety page cap (200), stopping")
            break
    return records, reached_natural_end


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
        return
    history_path = os.path.join(HISTORY_DIR, f"{lang}.jsonl")
    with open(history_path, "a", encoding="utf-8") as f:
        for r in records:
            r["scraped_at"] = snapshot_date
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"[{lang}] refresh DONE: {len(records)} communities appended to {history_path} (snapshot {snapshot_date})")


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
        for lang in only:
            refresh_language(lang, snapshot_date)
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
