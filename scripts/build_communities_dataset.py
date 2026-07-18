#!/usr/bin/env python3
"""
Assembles data/communities.json (a single JSON array, one object per community,
with embedded member_history/price_history/rank_history) from the raw scraper
output in scripts/skool_data/. This is the exact shape and path the TrustSkool
app's ingestion endpoint expects (see shared/appConfig.ts DEFAULT_DATASET_URL
and server/ingestion.ts communityRecordSchema).

Run after scrape_skool_discovery.py (backfill or --refresh) to (re)build the
consumable dataset. Does not compute trust_score/score_breakdown: the app's
own TrustSkore engine (server/trustskore.ts) computes it from the history
arrays on ingestion, so we don't duplicate that logic here.
"""
import json
import os
import glob
import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "skool_data")
HISTORY_DIR = os.path.join(DATA_DIR, "history")
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT_PATH = os.path.join(REPO_ROOT, "data", "communities.json")


def load_jsonl(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def main():
    today = datetime.date.today().isoformat()

    # 1. Base records: latest full snapshot per language (from the backfill/latest scrape)
    communities = {}
    for path in sorted(glob.glob(os.path.join(DATA_DIR, "*.jsonl"))):
        if os.path.basename(path) == "_all_combined.jsonl":
            continue
        for rec in load_jsonl(path):
            communities[rec["id"]] = {
                "id": rec["id"],
                "slug": rec["slug"],
                "url": rec["url"],
                "display_name": rec["display_name"],
                "description": rec.get("description"),
                "total_members": rec["total_members"],
                "price_amount_cents": rec.get("price_amount_cents"),
                "price_currency": rec.get("price_currency"),
                "price_interval": rec.get("price_interval"),
                "logo_url": rec.get("logo_url"),
                "language": rec.get("language", "english"),
                "category": None,
                "member_history": {},  # date -> total_members
                "price_history": {},   # date -> price_amount_cents
                "rank_history": {},    # date -> discovery_rank (1-indexed)
            }
            # seed day-1 history point from this snapshot itself
            snap_date = rec.get("updated_at", today)[:10] if rec.get("updated_at") else today
            communities[rec["id"]]["member_history"][today] = rec["total_members"]
            communities[rec["id"]]["price_history"][today] = rec.get("price_amount_cents")
            if rec.get("discovery_rank") is not None:
                communities[rec["id"]]["rank_history"][today] = rec["discovery_rank"] + 1  # 1-indexed, schema requires positive()

    # 2. Overlay accumulated history snapshots (from --refresh runs over time)
    for path in sorted(glob.glob(os.path.join(HISTORY_DIR, "*.jsonl"))):
        for rec in load_jsonl(path):
            cid = rec["id"]
            if cid not in communities:
                # a community that only shows up in history (e.g. new since backfill) - register it
                communities[cid] = {
                    "id": cid,
                    "slug": rec["slug"],
                    "url": rec["url"],
                    "display_name": rec["display_name"],
                    "description": rec.get("description"),
                    "total_members": rec["total_members"],
                    "price_amount_cents": rec.get("price_amount_cents"),
                    "price_currency": rec.get("price_currency"),
                    "price_interval": rec.get("price_interval"),
                    "logo_url": rec.get("logo_url"),
                    "language": rec.get("language", "english"),
                    "category": None,
                    "member_history": {},
                    "price_history": {},
                    "rank_history": {},
                }
            date = rec.get("scraped_at", today)
            communities[cid]["member_history"][date] = rec["total_members"]
            communities[cid]["price_history"][date] = rec.get("price_amount_cents")
            if rec.get("discovery_rank") is not None:
                communities[cid]["rank_history"][date] = rec["discovery_rank"] + 1
            # refresh the "current" fields to the latest snapshot seen
            communities[cid]["total_members"] = rec["total_members"]
            communities[cid]["price_amount_cents"] = rec.get("price_amount_cents")
            communities[cid]["description"] = rec.get("description")

    # 3. Flatten date-keyed dicts into sorted arrays matching the app's schema
    output = []
    for c in communities.values():
        c["member_history"] = [
            {"date": d, "total_members": v} for d, v in sorted(c["member_history"].items())
        ]
        c["price_history"] = [
            {"date": d, "price_amount_cents": v} for d, v in sorted(c["price_history"].items())
        ]
        c["rank_history"] = [
            {"date": d, "discovery_rank": v} for d, v in sorted(c["rank_history"].items())
        ]
        output.append(c)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=None)

    print(f"Built {OUTPUT_PATH}: {len(output)} communities")


if __name__ == "__main__":
    main()
