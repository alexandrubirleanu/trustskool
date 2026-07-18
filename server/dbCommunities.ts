import { and, asc, desc, eq, like, ne, or, sql, type SQL } from "drizzle-orm";
import {
  clicks,
  communities,
  ingestionRuns,
  type InsertClick,
  type InsertCommunity,
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
    const freeCond = or(eq(communities.priceAmountCents, 0), sql`${communities.priceAmountCents} IS NULL`);
    if (freeCond) conditions.push(freeCond);
  }
  if (price === "paid") conditions.push(sql`${communities.priceAmountCents} > 0`);
  if (trending) conditions.push(sql`${communities.growthRateBp} > 0`);

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

/** Returns platform-wide stats for the social proof bar. */
export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return { totalCommunities: 0, freeCommunities: 0, trendingCommunities: 0, totalClicks: 0 };
  const [totalRows, freeRows, trendingRows, clickRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(communities),
    db.select({ count: sql<number>`count(*)` }).from(communities).where(
      sql`${communities.priceAmountCents} = 0 OR ${communities.priceAmountCents} IS NULL`
    ),
    db.select({ count: sql<number>`count(*)` }).from(communities).where(
      sql`${communities.growthRateBp} > 0`
    ),
    db.select({ count: sql<number>`count(*)` }).from(clicks),
  ]);
  return {
    totalCommunities: Number(totalRows[0]?.count ?? 0),
    freeCommunities: Number(freeRows[0]?.count ?? 0),
    trendingCommunities: Number(trendingRows[0]?.count ?? 0),
    totalClicks: Number(clickRows[0]?.count ?? 0),
  };
}
