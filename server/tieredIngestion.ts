/**
 * Tiered ingestion scheduler for TrustSkool.
 *
 * Communities are classified into three tiers based on member count:
 *   hot  — top 500 by members → refresh target every 24-48h
 *   warm — rank 501-3000      → refresh target every 7-14d
 *   cold — rank 3001+         → refresh target every 30-45d
 *
 * Each heartbeat cron job calls a different /api/scheduled/* endpoint that
 * runs ingestion for only the communities in that tier (fetching the full
 * dataset but only upserting the relevant slice).
 *
 * SLA monitor: if a hot community hasn't been updated in 72h, or a warm
 * community in 21d, the owner receives an alert email.
 */

import { eq, sql, and, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { communities } from "../drizzle/schema";
import { runIngestion, toCommunityRow, communityRecordSchema, type IngestionResult, getDatasetUrl } from "./ingestion";
import { upsertCommunity } from "./dbCommunities";
import { sendSlaAlertEmail } from "./emailNotify";

/** Tier thresholds (member rank cutoffs) */
export const TIER_THRESHOLDS = {
  HOT_MAX_RANK: 500,   // top 500 communities by member count
  WARM_MAX_RANK: 3000, // rank 501–3000
  // cold = rank 3001+
} as const;

/** SLA breach windows (milliseconds) */
export const SLA_WINDOWS_MS = {
  hot:  72 * 60 * 60 * 1000,  // 72 hours
  warm: 21 * 24 * 60 * 60 * 1000, // 21 days
  cold: 60 * 24 * 60 * 60 * 1000, // 60 days (generous — cold tier is low priority)
} as const;

export type UpdateTier = "hot" | "warm" | "cold";

/**
 * Recompute updateTier for every community in the DB based on their current
 * totalMembers rank. Called at the end of each ingestion run.
 */
export async function recomputeAllTiers(): Promise<{ hot: number; warm: number; cold: number }> {
  const db = await getDb();
  if (!db) return { hot: 0, warm: 0, cold: 0 };

  // Rank communities by totalMembers descending using a window function
  const [ranked] = await db.execute(sql`
    SELECT id,
           ROW_NUMBER() OVER (ORDER BY totalMembers DESC) AS member_rank
    FROM communities
  `);

  const rows = ranked as unknown as { id: number; member_rank: number }[];
  let hot = 0, warm = 0, cold = 0;

  for (const row of rows) {
    let tier: UpdateTier;
    if (row.member_rank <= TIER_THRESHOLDS.HOT_MAX_RANK) {
      tier = "hot";
      hot++;
    } else if (row.member_rank <= TIER_THRESHOLDS.WARM_MAX_RANK) {
      tier = "warm";
      warm++;
    } else {
      tier = "cold";
      cold++;
    }
    await db
      .update(communities)
      .set({ updateTier: tier })
      .where(eq(communities.id, row.id));
  }

  return { hot, warm, cold };
}

/**
 * Run ingestion for a specific tier only.
 *
 * Strategy:
 * 1. Fetch the full dataset (one HTTP request — the dataset is already sorted by
 *    member count descending, so we can slice by rank cheaply).
 * 2. Only upsert communities whose rank falls within the tier's rank window.
 * 3. Mark lastScrapedAt = NOW() only for communities actually processed.
 * 4. After a hot-tier run, recompute all tier assignments (member counts shift).
 *
 * This means:
 *   hot  → rank 1-500   (daily at 02:00 UTC)
 *   warm → rank 501-3000 (weekly on Monday at 03:00 UTC)
 *   cold → rank 3001+   (monthly on 1st at 04:00 UTC)
 */
export async function runTieredIngestion(tier: UpdateTier, datasetUrl?: string) {
  const source = datasetUrl || getDatasetUrl();
  const result: IngestionResult = { ok: false, source, total: 0, upserted: 0, skipped: 0, errors: [] };

  // 1. Fetch dataset
  let raw: unknown;
  try {
    const res = await fetch(source, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Dataset fetch failed: HTTP ${res.status}`);
    raw = await res.json();
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : String(err));
    return result;
  }

  const list = Array.isArray(raw) ? raw : (raw as { communities?: unknown[] })?.communities;
  if (!Array.isArray(list)) {
    result.errors.push("Dataset is not an array");
    return result;
  }

  // 2. Determine rank window for this tier
  //    The dataset is sorted by member count desc, so index ≈ rank.
  const rankStart = tier === "hot" ? 0 : tier === "warm" ? TIER_THRESHOLDS.HOT_MAX_RANK : TIER_THRESHOLDS.WARM_MAX_RANK;
  const rankEnd   = tier === "hot" ? TIER_THRESHOLDS.HOT_MAX_RANK : tier === "warm" ? TIER_THRESHOLDS.WARM_MAX_RANK : list.length;

  const tierSlice = list.slice(rankStart, rankEnd);
  result.total = tierSlice.length;

  const upsertedSlugs: string[] = [];

  for (const item of tierSlice) {
    const parsed = communityRecordSchema.safeParse(item);
    if (!parsed.success) {
      result.skipped++;
      if (result.errors.length < 10) {
        const slug = (item as { slug?: string })?.slug ?? "unknown";
        result.errors.push(`Record ${slug}: ${parsed.error.issues[0]?.message ?? "invalid"}`);
      }
      continue;
    }
    try {
      await upsertCommunity(toCommunityRow(parsed.data));
      upsertedSlugs.push(parsed.data.slug);
      result.upserted++;
    } catch (err) {
      result.skipped++;
      if (result.errors.length < 10) {
        result.errors.push(`Upsert ${parsed.data.slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  result.ok = result.upserted > 0 || result.total === 0;

  // 3. Mark lastScrapedAt only for communities we actually processed
  if (upsertedSlugs.length > 0) {
    const db = await getDb();
    if (db) {
      const now = new Date();
      // Batch update in chunks of 500 to avoid huge IN clauses
      const CHUNK = 500;
      for (let i = 0; i < upsertedSlugs.length; i += CHUNK) {
        const chunk = upsertedSlugs.slice(i, i + CHUNK);
        await db
          .update(communities)
          .set({ lastScrapedAt: now, updateTier: tier })
          .where(inArray(communities.slug, chunk));
      }

      // 4. After hot-tier run, recompute all tier assignments
      if (tier === "hot") {
        await recomputeAllTiers();
      }
    }
  }

  return result;
}

export interface SlaBreachReport {
  tier: UpdateTier;
  slug: string;
  displayName: string;
  totalMembers: number;
  lastScrapedAt: Date | null;
  hoursOverdue: number;
}

/**
 * Check for SLA breaches: communities that haven't been scraped within their
 * tier's SLA window. Returns a list of breaching communities.
 */
export async function checkSlaBreach(): Promise<SlaBreachReport[]> {
  const now = Date.now();
  const breaches: SlaBreachReport[] = [];

  for (const tier of ["hot", "warm", "cold"] as UpdateTier[]) {
    const windowMs = SLA_WINDOWS_MS[tier];
    const cutoff = new Date(now - windowMs);

    // Communities in this tier where lastScrapedAt is NULL or older than cutoff
    const db = await getDb();
    if (!db) continue;
    const overdue = await db
      .select({
        slug: communities.slug,
        displayName: communities.displayName,
        totalMembers: communities.totalMembers,
        lastScrapedAt: communities.lastScrapedAt,
      })
      .from(communities)
      .where(
        and(
          eq(communities.updateTier, tier),
          // lastScrapedAt IS NULL OR lastScrapedAt < cutoff
          sql`(${communities.lastScrapedAt} IS NULL OR ${communities.lastScrapedAt} < ${cutoff})`
        )
      )
      .limit(50); // cap report size

    for (const row of overdue) {
      const lastMs = row.lastScrapedAt ? row.lastScrapedAt.getTime() : 0;
      const overdueMs = now - lastMs - windowMs;
      const hoursOverdue = Math.round(overdueMs / (60 * 60 * 1000));
      breaches.push({
        tier,
        slug: row.slug,
        displayName: row.displayName,
        totalMembers: row.totalMembers,
        lastScrapedAt: row.lastScrapedAt,
        hoursOverdue,
      });
    }
  }

  return breaches;
}

/**
 * Run the SLA check and send an alert email if any breaches are found.
 * Called by the daily-digest heartbeat job (or a dedicated monitor cron).
 */
export async function runSlaMonitor(): Promise<{ breachCount: number; emailSent: boolean }> {
  const breaches = await checkSlaBreach();
  if (breaches.length === 0) return { breachCount: 0, emailSent: false };

  const emailSent = await sendSlaAlertEmail(breaches);
  return { breachCount: breaches.length, emailSent };
}
