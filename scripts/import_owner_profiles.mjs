#!/usr/bin/env node
/**
 * Import owner_profiles.jsonl into the ownerProfiles DB table.
 *
 * Usage:
 *   node scripts/import_owner_profiles.mjs [path/to/owner_profiles.jsonl]
 *
 * Defaults to scripts/skool_data/owner_profiles.jsonl if no path is given.
 * Upserts by handle (insert or update), so it is safe to run repeatedly.
 *
 * Known badge-name normalization:
 *   liftoff → kept as-is (treated as rocket tier in mrrEstimate.ts)
 *   goat    → kept as-is (treated as goated tier in mrrEstimate.ts)
 *   Any other unknown value → stored as null
 */

import { readFileSync } from "fs";
import { createConnection } from "mysql2/promise";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const VALID_MRR_STATUSES = new Set([
  "none", "clover", "liftoff", "rocket", "crown", "diamond", "red_diamond", "goat", "goated",
]);

function normalizeMrrStatus(raw) {
  if (!raw) return null;
  const lower = String(raw).toLowerCase().trim();
  return VALID_MRR_STATUSES.has(lower) ? lower : null;
}

async function main() {
  const filePath = process.argv[2]
    ? resolve(process.cwd(), process.argv[2])
    : resolve(__dirname, "skool_data/owner_profiles.jsonl");

  console.log(`Reading: ${filePath}`);
  const lines = readFileSync(filePath, "utf8")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  console.log(`Found ${lines.length} profile(s)`);

  const db = await createConnection(process.env.DATABASE_URL);

  let upserted = 0;
  let skipped = 0;

  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      console.warn("  Skipping unparseable line:", line.slice(0, 80));
      skipped++;
      continue;
    }

    const handle = row.handle?.trim();
    if (!handle) {
      console.warn("  Skipping row with no handle");
      skipped++;
      continue;
    }

    const mrrStatus = normalizeMrrStatus(row.mrr_status);
    const ownedCommunities = Array.isArray(row.owned_communities)
      ? row.owned_communities.map(c => ({
          slug: c.slug ?? "",
          display_name: c.display_name ?? "",
          total_members: Number(c.total_members ?? 0),
          afl_percent: c.afl_percent != null ? Number(c.afl_percent) : null,
        }))
      : [];

    await db.execute(
      `INSERT INTO ownerProfiles
         (handle, firstName, lastName, mrrStatus, activityStatus, ownedCommunities, scrapedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         firstName         = VALUES(firstName),
         lastName          = VALUES(lastName),
         mrrStatus         = VALUES(mrrStatus),
         activityStatus    = VALUES(activityStatus),
         ownedCommunities  = VALUES(ownedCommunities),
         scrapedAt         = NOW()`,
      [
        handle,
        row.first_name ?? null,
        row.last_name ?? null,
        mrrStatus,
        row.activity_status ?? null,
        JSON.stringify(ownedCommunities),
      ],
    );
    upserted++;
  }

  await db.end();
  console.log(`Done: ${upserted} upserted, ${skipped} skipped`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
