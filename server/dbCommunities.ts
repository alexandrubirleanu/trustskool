import { and, asc, desc, eq, isNull, like, ne, or, sql, type SQL } from "drizzle-orm";
import {
  categoryRankings,
  clicks,
  communities,
  ingestionRuns,
  ownerProfiles,
  type InsertClick,
  type InsertCommunity,
  type InsertOwnerProfile,
} from "../drizzle/schema";
import { getDb } from "./db";

export type CommunitySort = "trustSkore" | "totalMembers" | "growthRateBp" | "category";
export type PriceFilter = "all" | "free" | "paid";

export interface ListCommunitiesParams {
  search?: string;
  language?: string;
  category?: string;
  price?: PriceFilter;
  trending?: boolean;
  /** When true, show only communities with a verified Skool MRR badge (mrrStatus IS NOT NULL) */
  mrrVerified?: boolean;
  sort?: CommunitySort;
  direction?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

const LIST_COLUMNS = {
  id: communities.id,
  slug: communities.slug,
  url: communities.url,
  displayName: communities.displayName,
  description: communities.description,
  totalMembers: communities.totalMembers,
  priceAmountCents: communities.priceAmountCents,
  priceCurrency: communities.priceCurrency,
  priceInterval: communities.priceInterval,
  logoUrl: communities.logoUrl,
  language: communities.language,
  category: communities.category,
  trustSkore: communities.trustSkore,
  scoreBreakdown: communities.scoreBreakdown,
  growthRateBp: communities.growthRateBp,
  isFlagged: communities.isFlagged,
  flagReason: communities.flagReason,
  mrrStatus: communities.mrrStatus,
  /** Rank of this community within its category by trustSkore (1 = best in category) */
  categoryRank: sql<number>`(
    SELECT COUNT(*) + 1 FROM communities c2
    WHERE c2.category = ${communities.category}
      AND c2.category IS NOT NULL
      AND c2.trustSkore > ${communities.trustSkore}
  )`,
  /** 1 if this community is #1 in its category by current trustSkore */
  isCategoryTop: sql<number>`(
    SELECT CASE WHEN (
      SELECT COUNT(*) FROM communities c2
      WHERE c2.category = ${communities.category}
        AND c2.category IS NOT NULL
        AND c2.trustSkore > ${communities.trustSkore}
    ) = 0 AND ${communities.category} IS NOT NULL THEN 1 ELSE 0 END
  )`,
};

export async function listCommunities(params: ListCommunitiesParams) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const {
    search,
    language,
    category,
    price = "all",
    trending,
    sort = "trustSkore",
    direction = "desc",
    page = 1,
    pageSize = 24,
  } = params;

  const conditions: SQL[] = [];
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    const searchCond = or(like(communities.displayName, term), like(communities.description, term));
    if (searchCond) conditions.push(searchCond);
  }
  if (language) conditions.push(eq(communities.language, language));
  if (category) conditions.push(eq(communities.category, category));
  if (price === "free") {
    // "Free" = truly free communities only (priceAmountCents = 0 or NULL).
    // Monthly paid communities are NOT included: the Skool dataset does not
    // expose a trial field, so we cannot confirm whether a trial is available.
    const freeCond = or(
      eq(communities.priceAmountCents, 0),
      sql`${communities.priceAmountCents} IS NULL`,
    );
    if (freeCond) conditions.push(freeCond);
  }
  if (price === "paid") conditions.push(sql`${communities.priceAmountCents} > 0`);
  if (trending) conditions.push(sql`${communities.growthRateBp} > 0`);
  if (params.mrrVerified) conditions.push(sql`${communities.mrrStatus} IS NOT NULL AND ${communities.mrrStatus} != 'none'`);

  const where = conditions.length ? and(...conditions) : undefined;

  const sortColumn = {
    trustSkore: communities.trustSkore,
    totalMembers: communities.totalMembers,
    growthRateBp: communities.growthRateBp,
    category: communities.category,
  }[sort];
  const orderPrimary = direction === "asc" ? asc(sortColumn) : desc(sortColumn);

  const offset = (page - 1) * pageSize;

  const [items, totalRows] = await Promise.all([
    db
      .select(LIST_COLUMNS)
      .from(communities)
      .where(where)
      .orderBy(orderPrimary, desc(communities.trustSkore), asc(communities.id))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(communities).where(where),
  ]);

  return { items, total: Number(totalRows[0]?.count ?? 0) };
}

export async function getCommunityBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(communities).where(eq(communities.slug, slug)).limit(1);
  return rows[0];
}

export async function getSimilarCommunities(slug: string, language: string, category: string | null, limit = 4) {
  const db = await getDb();
  if (!db) return [];
  const sameLang = eq(communities.language, language);
  const notSelf = ne(communities.slug, slug);
  const preferred = category
    ? and(notSelf, sameLang, eq(communities.category, category))
    : and(notSelf, sameLang);

  const rows = await db
    .select(LIST_COLUMNS)
    .from(communities)
    .where(preferred)
    .orderBy(desc(communities.trustSkore))
    .limit(limit);

  if (rows.length >= limit || !category) return rows;

  // top up with same-language communities from other categories
  const seen = new Set(rows.map(r => r.slug));
  const extra = await db
    .select(LIST_COLUMNS)
    .from(communities)
    .where(and(notSelf, sameLang))
    .orderBy(desc(communities.trustSkore))
    .limit(limit * 2);
  for (const row of extra) {
    if (rows.length >= limit) break;
    if (!seen.has(row.slug)) {
      rows.push(row);
      seen.add(row.slug);
    }
  }
  return rows;
}

// Canonical language order matching Skool's own language picker (All → English → German → …)
const SKOOL_LANGUAGE_ORDER: string[] = [
  "english", "german", "spanish", "french", "chinese", "italian", "dutch",
  "vietnamese", "arabic", "hebrew", "danish", "romanian", "turkish", "polish",
  "czech", "hungarian", "swedish", "portuguese", "bulgarian", "norwegian",
  "finnish", "croatian", "latvian", "slovak", "serbian", "mongolian", "haitian",
  "thai", "slovenian", "russian", "lithuanian", "amharic", "malay", "estonian",
  "greek", "ukrainian", "swahili", "japanese", "filipino", "persian", "welsh",
  "korean", "cantonese", "indonesian", "latin", "bengali", "catalan", "hindi",
];

export async function getFilterOptions() {
  const db = await getDb();
  if (!db) return { languages: [], categories: [] };
  const [langs, cats] = await Promise.all([
    db
      .select({ value: communities.language, count: sql<number>`count(*)` })
      .from(communities)
      .groupBy(communities.language),
    db
      .select({ value: communities.category, count: sql<number>`count(*)` })
      .from(communities)
      .where(sql`${communities.category} IS NOT NULL AND ${communities.category} != ''`)
      .groupBy(communities.category)
      .orderBy(desc(sql`count(*)`)),
  ]);

  // Sort languages by Skool's canonical order; unknown languages fall to the end sorted by count
  const langMap = new Map(langs.map(l => [l.value, Number(l.count)]));
  const ordered = SKOOL_LANGUAGE_ORDER
    .filter(lang => langMap.has(lang))
    .map(lang => ({ value: lang, count: langMap.get(lang)! }));
  const knownSet = new Set(SKOOL_LANGUAGE_ORDER);
  const unknown = langs
    .filter(l => !knownSet.has(l.value))
    .sort((a, b) => Number(b.count) - Number(a.count))
    .map(l => ({ value: l.value, count: Number(l.count) }));

  return {
    languages: [...ordered, ...unknown],
    categories: cats
      .filter(c => c.value)
      .map(c => ({ value: c.value as string, count: Number(c.count) })),
  };
}

/* ---------------- Owner Profiles ---------------- */

/**
 * Look up the owner profile for a community by its slug.
 * Returns null if no profile has been scraped for this community's owner yet.
 */
export async function getOwnerProfileBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  // ownerProfiles.ownedCommunities is a JSON array; we search by slug using JSON_CONTAINS
  const rows = await db
    .select()
    .from(ownerProfiles)
    .where(sql`JSON_CONTAINS(${ownerProfiles.ownedCommunities}, JSON_OBJECT('slug', ${slug}))`)
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Upsert an owner profile (insert or update by handle).
 */
export async function upsertOwnerProfile(record: InsertOwnerProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(ownerProfiles)
    .values(record)
    .onDuplicateKeyUpdate({
      set: {
        firstName: record.firstName ?? null,
        lastName: record.lastName ?? null,
        mrrStatus: record.mrrStatus ?? null,
        activityStatus: record.activityStatus ?? null,
        ownedCommunities: record.ownedCommunities ?? null,
        scrapedAt: record.scrapedAt ?? new Date(),
      },
    });
}

/**
 * Return all owner profiles (for admin view).
 */
export async function listOwnerProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ownerProfiles).orderBy(desc(ownerProfiles.scrapedAt));
}

export async function getAllSlugsForSitemap() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ slug: communities.slug, updatedAt: communities.updatedAt })
    .from(communities)
    .orderBy(desc(communities.trustSkore));
}

export async function upsertCommunity(record: InsertCommunity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(communities)
    .values(record)
    .onDuplicateKeyUpdate({
      set: {
        slug: record.slug,
        url: record.url,
        displayName: record.displayName,
        description: record.description ?? null,
        totalMembers: record.totalMembers ?? 0,
        priceAmountCents: record.priceAmountCents ?? null,
        priceCurrency: record.priceCurrency ?? null,
        priceInterval: record.priceInterval ?? null,
        logoUrl: record.logoUrl ?? null,
        language: record.language ?? "english",
        category: record.category ?? null,
        trustSkore: record.trustSkore ?? 0,
        scoreBreakdown: record.scoreBreakdown ?? null,
        memberHistory: record.memberHistory ?? null,
        priceHistory: record.priceHistory ?? null,
        rankHistory: record.rankHistory ?? null,
        growthRateBp: record.growthRateBp ?? 0,
        // Owner badge fields — only update if the pipeline provides them (null = not yet scraped)
        ...(record.aflPercent !== undefined && { aflPercent: record.aflPercent }),
        ...(record.mrrStatus !== undefined && { mrrStatus: record.mrrStatus }),
        ...(record.ownerName !== undefined && { ownerName: record.ownerName }),
        ...(record.active30dStreak !== undefined && { active30dStreak: record.active30dStreak }),
        ingestedAt: new Date(),
      },
    });
}

/* ---------------- Clicks ---------------- */

export async function insertClick(click: InsertClick) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(clicks).values(click);
}

export async function getClickStats() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      slug: clicks.slug,
      displayName: sql<string>`MAX(${clicks.displayName})`,
      count: sql<number>`count(*)`,
      lastClickAt: sql<string>`MAX(${clicks.createdAt})`,
    })
    .from(clicks)
    .groupBy(clicks.slug)
    .orderBy(desc(sql`count(*)`));
}

export async function listClicks(limit = 500) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clicks).orderBy(desc(clicks.createdAt)).limit(limit);
}

/** Returns the total number of tracked clicks for a given slug (including the current one). */
export async function getClickCountForSlug(slug: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(clicks)
    .where(eq(clicks.slug, slug));
  return Number(rows[0]?.count ?? 0);
}

/* ---------------- Ingestion runs ---------------- */

export async function logIngestionRun(run: {
  source: string;
  status: "success" | "error";
  communitiesUpserted: number;
  message?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(ingestionRuns).values(run);
}

export async function getLatestIngestionRun() {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(ingestionRuns).orderBy(desc(ingestionRuns.createdAt)).limit(1);
  return rows[0];
}

/** Returns all clicks in a given UTC time window, grouped by slug, with community data joined. */
export async function getClicksForDigest(since: Date, until: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      slug: clicks.slug,
      displayName: sql<string>`MAX(${clicks.displayName})`,
      count: sql<number>`count(*)`,
      lastClickAt: sql<string>`MAX(${clicks.createdAt})`,
      totalMembers: sql<number | null>`MAX(${communities.totalMembers})`,
      priceAmountCents: sql<number | null>`MAX(${communities.priceAmountCents})`,
      priceInterval: sql<string | null>`MAX(${communities.priceInterval})`,
      language: sql<string | null>`MAX(${communities.language})`,
    })
    .from(clicks)
    .leftJoin(communities, eq(clicks.slug, communities.slug))
    .where(sql`${clicks.createdAt} >= ${since.toISOString()} AND ${clicks.createdAt} < ${until.toISOString()}`)
    .groupBy(clicks.slug)
    .orderBy(desc(sql`count(*)`));
}

/** Returns platform-wide stats for the social proof bar. */
export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return { totalCommunities: 0, freeCommunities: 0, paidCommunities: 0, trendingCommunities: 0, totalClicks: 0 };
  const [totalRows, freeRows, paidRows, trendingRows, clickRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(communities),
    // Count truly free communities only
    db.select({ count: sql<number>`count(*)` }).from(communities).where(
      sql`${communities.priceAmountCents} = 0 OR ${communities.priceAmountCents} IS NULL`
    ),
    // Count paid communities
    db.select({ count: sql<number>`count(*)` }).from(communities).where(
      sql`${communities.priceAmountCents} > 0`
    ),
    db.select({ count: sql<number>`count(*)` }).from(communities).where(
      sql`${communities.growthRateBp} > 0`
    ),
    db.select({ count: sql<number>`count(*)` }).from(clicks),
  ]);
  return {
    totalCommunities: Number(totalRows[0]?.count ?? 0),
    freeCommunities: Number(freeRows[0]?.count ?? 0),
    paidCommunities: Number(paidRows[0]?.count ?? 0),
    trendingCommunities: Number(trendingRows[0]?.count ?? 0),
    totalClicks: Number(clickRows[0]?.count ?? 0),
  };
}

/** Toggle ownerJoined for a community. Returns the new state. */
export async function toggleOwnerJoined(slug: string, joined: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(communities)
    .set({
      ownerJoined: joined,
      ownerJoinedAt: joined ? new Date() : null,
    })
    .where(eq(communities.slug, slug));
}

/**
 * Admin decision-support view: communities with click count, TrustSkore,
 * afl_percent and ownerJoined status. Used to prioritise which community
 * to join next to activate affiliate revenue.
 */
export async function getAdminOpportunityView() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      slug: communities.slug,
      displayName: communities.displayName,
      trustSkore: communities.trustSkore,
      totalMembers: communities.totalMembers,
      aflPercent: communities.aflPercent,
      mrrStatus: communities.mrrStatus,
      ownerName: communities.ownerName,
      ownerJoined: communities.ownerJoined,
      ownerJoinedAt: communities.ownerJoinedAt,
      priceAmountCents: communities.priceAmountCents,
      priceInterval: communities.priceInterval,
      clickCount: sql<number>`count(${clicks.id})`,
    })
    .from(communities)
    .leftJoin(clicks, eq(clicks.slug, communities.slug))
    .groupBy(communities.id)
    .orderBy(desc(sql`count(${clicks.id})`));
  return rows;
}

export async function getTopCommunitiesForLlms(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      slug: communities.slug,
      displayName: communities.displayName,
      totalMembers: communities.totalMembers,
      trustSkore: communities.trustSkore,
      priceAmountCents: communities.priceAmountCents,
      priceInterval: communities.priceInterval,
      language: communities.language,
      category: communities.category,
      description: communities.description,
    })
    .from(communities)
    .where(isNull(communities.isFlagged))
    .orderBy(desc(communities.totalMembers))
    .limit(limit);
}
