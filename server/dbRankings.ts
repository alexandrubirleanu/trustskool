/**
 * Category Rankings DB helpers.
 * Snapshot logic: top 30 per category (totalMembers >= 100), ordered by trustSkore desc.
 * One snapshotMonth batch per run; prior months are kept for history.
 */
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { categoryRankings, communities } from "../drizzle/schema";
import { getDb } from "./db";

export type CategoryRankingRow = {
  id: number;
  category: string;
  rankPosition: number;
  communitySlug: string;
  snapshotMonth: string;
  trustSkoreAtSnapshot: number;
  totalMembersAtSnapshot: number;
  createdAt: Date;
};

export type RankingWithCommunity = CategoryRankingRow & {
  displayName: string;
  logoUrl: string | null;
  priceAmountCents: number | null;
  priceInterval: string | null;
  language: string;
  growthRateBp: number;
};

/** Returns YYYY-MM string for the current month */
export function currentSnapshotMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Compute and insert a new snapshot for all categories.
 * Top 30 communities per category, filtered to totalMembers >= 100,
 * ordered by trustSkore desc. Deletes the current month's batch first
 * (idempotent re-run) then inserts fresh rows.
 *
 * @param snapshotMonth - YYYY-MM string (defaults to current month)
 */
export async function computeCategoryRankings(
  snapshotMonth?: string,
): Promise<{ category: string; inserted: number }[]> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const month = snapshotMonth ?? currentSnapshotMonth();

  // The 9 Skool discovery categories
  const CATEGORIES = [
    "money",
    "selfimprovement",
    "tech",
    "health",
    "hobbies",
    "spirituality",
    "sports",
    "relationships",
    "music",
  ];

  const results: { category: string; inserted: number }[] = [];

  for (const cat of CATEGORIES) {
    // Delete existing rows for this category + month (idempotent)
    await db
      .delete(categoryRankings)
      .where(
        and(
          eq(categoryRankings.category, cat),
          eq(categoryRankings.snapshotMonth, month),
        ),
      );

    // Fetch top 30 by trustSkore, min 100 members, non-null category
    const top = await db
      .select({
        slug: communities.slug,
        trustSkore: communities.trustSkore,
        totalMembers: communities.totalMembers,
      })
      .from(communities)
      .where(
        and(
          eq(communities.category, cat),
          gte(communities.totalMembers, 100),
          isNotNull(communities.category),
        ),
      )
      .orderBy(desc(communities.trustSkore))
      .limit(30);

    if (top.length === 0) {
      results.push({ category: cat, inserted: 0 });
      continue;
    }

    // Insert snapshot rows
    const rows = top.map((c, i) => ({
      category: cat,
      rankPosition: i + 1,
      communitySlug: c.slug,
      snapshotMonth: month,
      trustSkoreAtSnapshot: c.trustSkore,
      totalMembersAtSnapshot: c.totalMembers,
    }));

    await db.insert(categoryRankings).values(rows);
    results.push({ category: cat, inserted: rows.length });
  }

  return results;
}

/**
 * Get the latest snapshot month available in the DB.
 * Returns null if no snapshots exist yet.
 */
export async function getLatestSnapshotMonth(): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ month: categoryRankings.snapshotMonth })
    .from(categoryRankings)
    .orderBy(desc(categoryRankings.snapshotMonth))
    .limit(1);
  return rows[0]?.month ?? null;
}

/**
 * Get the ranked list for a single category, latest snapshot month.
 * Joins with communities for display fields.
 */
export async function getCategoryRanking(
  category: string,
): Promise<{ rankings: RankingWithCommunity[]; snapshotMonth: string | null }> {
  const db = await getDb();
  if (!db) return { rankings: [], snapshotMonth: null };

  const latestMonth = await getLatestSnapshotMonth();
  if (!latestMonth) return { rankings: [], snapshotMonth: null };

  const rows = await db
    .select({
      id: categoryRankings.id,
      category: categoryRankings.category,
      rankPosition: categoryRankings.rankPosition,
      communitySlug: categoryRankings.communitySlug,
      snapshotMonth: categoryRankings.snapshotMonth,
      trustSkoreAtSnapshot: categoryRankings.trustSkoreAtSnapshot,
      totalMembersAtSnapshot: categoryRankings.totalMembersAtSnapshot,
      createdAt: categoryRankings.createdAt,
      displayName: communities.displayName,
      logoUrl: communities.logoUrl,
      priceAmountCents: communities.priceAmountCents,
      priceInterval: communities.priceInterval,
      language: communities.language,
      growthRateBp: communities.growthRateBp,
    })
    .from(categoryRankings)
    .innerJoin(communities, eq(communities.slug, categoryRankings.communitySlug))
    .where(
      and(
        eq(categoryRankings.category, category),
        eq(categoryRankings.snapshotMonth, latestMonth),
      ),
    )
    .orderBy(categoryRankings.rankPosition);

  return { rankings: rows, snapshotMonth: latestMonth };
}

/**
 * Get a summary of the latest snapshot for all 9 categories.
 * Returns category slug, count of ranked communities, and top community name.
 */
export async function getCategoryRankingsSummary(): Promise<
  { category: string; count: number; topCommunity: string | null; snapshotMonth: string | null }[]
> {
  const db = await getDb();
  if (!db) return [];

  const latestMonth = await getLatestSnapshotMonth();
  if (!latestMonth) return [];

  const rows = await db
    .select({
      category: categoryRankings.category,
      count: sql<number>`count(*)`,
      topCommunity: sql<string>`MIN(CASE WHEN ${categoryRankings.rankPosition} = 1 THEN ${communities.displayName} END)`,
    })
    .from(categoryRankings)
    .innerJoin(communities, eq(communities.slug, categoryRankings.communitySlug))
    .where(eq(categoryRankings.snapshotMonth, latestMonth))
    .groupBy(categoryRankings.category);

  return rows.map(r => ({
    category: r.category,
    count: Number(r.count),
    topCommunity: r.topCommunity ?? null,
    snapshotMonth: latestMonth,
  }));
}
