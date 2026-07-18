import {
  bigint,
  double,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** History point shapes stored in JSON columns */
export type MemberHistoryPoint = { date: string; total_members: number };
export type PriceHistoryPoint = { date: string; price_amount_cents: number | null };
export type RankHistoryPoint = { date: string; discovery_rank: number };

export type ScoreBreakdown = {
  growth_momentum: number;
  ranking_momentum: number;
  price_stability: number;
};

/**
 * Skool communities ingested from the external GitHub Actions pipeline.
 * One row per community, upserted on each ingestion run.
 */
export const communities = mysqlTable(
  "communities",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Stable external id from the pipeline dataset */
    externalId: varchar("externalId", { length: 128 }).notNull().unique(),
    slug: varchar("slug", { length: 191 }).notNull().unique(),
    url: varchar("url", { length: 512 }).notNull(),
    displayName: varchar("displayName", { length: 255 }).notNull(),
    description: text("description"),
    totalMembers: int("totalMembers").default(0).notNull(),
    priceAmountCents: int("priceAmountCents"),
    priceCurrency: varchar("priceCurrency", { length: 8 }),
    priceInterval: varchar("priceInterval", { length: 16 }),
    logoUrl: varchar("logoUrl", { length: 1024 }),
    language: varchar("language", { length: 64 }).default("english").notNull(),
    category: varchar("category", { length: 128 }),
    /** TrustSkore 0-100 */
    trustSkore: double("trustSkore").default(0).notNull(),
    scoreBreakdown: json("scoreBreakdown").$type<ScoreBreakdown>(),
    memberHistory: json("memberHistory").$type<MemberHistoryPoint[]>(),
    priceHistory: json("priceHistory").$type<PriceHistoryPoint[]>(),
    rankHistory: json("rankHistory").$type<RankHistoryPoint[]>(),
    /** 30-day growth rate in basis points (523 = 5.23%) for sorting without JSON parsing */
    growthRateBp: int("growthRateBp").default(0).notNull(),
    /**
     * Fraud/scam flag set by admin review.
     * 'caution' = reports received, under review.
     * 'warning' = verified, delisted from rankings, affiliate link suspended.
     * null = no flag.
     */
    isFlagged: mysqlEnum("isFlagged", ["caution", "warning"]),
    /** Optional human-readable reason shown to users on the community page. */
    flagReason: text("flagReason"),
    ingestedAt: timestamp("ingestedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("idx_communities_trustSkore").on(table.trustSkore),
    index("idx_communities_language").on(table.language),
    index("idx_communities_category").on(table.category),
    index("idx_communities_totalMembers").on(table.totalMembers),
  ],
);

export type Community = typeof communities.$inferSelect;
export type InsertCommunity = typeof communities.$inferInsert;

/**
 * Outbound click log. One row per hit on /go/<slug> or /go/signup.
 */
export const clicks = mysqlTable(
  "clicks",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    /** Community slug, or "signup" for the platform-level CTA */
    slug: varchar("slug", { length: 191 }).notNull(),
    displayName: varchar("displayName", { length: 255 }).notNull(),
    referrer: varchar("referrer", { length: 1024 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("idx_clicks_slug").on(table.slug),
    index("idx_clicks_createdAt").on(table.createdAt),
  ],
);

export type Click = typeof clicks.$inferSelect;
export type InsertClick = typeof clicks.$inferInsert;

/**
 * Ingestion runs log for observability of the daily cron.
 */
export const ingestionRuns = mysqlTable("ingestionRuns", {
  id: int("id").autoincrement().primaryKey(),
  source: varchar("source", { length: 512 }).notNull(),
  status: mysqlEnum("status", ["success", "error"]).notNull(),
  communitiesUpserted: int("communitiesUpserted").default(0).notNull(),
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IngestionRun = typeof ingestionRuns.$inferSelect;

/** Shape of each entry in ownerProfiles.ownedCommunities JSON column */
export type OwnedCommunityEntry = {
  slug: string;
  display_name: string;
  total_members: number;
  afl_percent: number | null;
};

/**
 * Skool creator owner profiles scraped from skool.com/@handle.
 * One row per unique owner handle. Populated incrementally by the scrape pipeline.
 * mrrStatus reflects the creator's TOTAL revenue across ALL their communities.
 */
export const ownerProfiles = mysqlTable(
  "ownerProfiles",
  {
    id: int("id").autoincrement().primaryKey(),
    handle: varchar("handle", { length: 128 }).notNull().unique(),
    firstName: varchar("firstName", { length: 128 }),
    lastName: varchar("lastName", { length: 128 }),
    /**
     * Skool public MRR badge:
     * none | clover ($3k+) | rocket ($10k+) | crown ($30k+) |
     * diamond ($100k+) | red_diamond ($300k+) | goated ($1M+)
     */
    mrrStatus: mysqlEnum("mrrStatus", [
      "none",
      "clover",
      "liftoff",
      "rocket",
      "crown",
      "diamond",
      "red_diamond",
      "goat",
      "goated",
    ]),
    activityStatus: varchar("activityStatus", { length: 64 }),
    /** Array of communities this owner operates, with their afl_percent */
    ownedCommunities: json("ownedCommunities").$type<OwnedCommunityEntry[]>(),
    scrapedAt: timestamp("scrapedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("idx_ownerProfiles_handle").on(table.handle),
  ],
);

export type OwnerProfile = typeof ownerProfiles.$inferSelect;
export type InsertOwnerProfile = typeof ownerProfiles.$inferInsert;

/**
 * Content pages ingested from content/ markdown files.
 * One row per file. Type discriminates routing and rendering.
 * Upserted on each import run (slug is the stable key).
 */
export const contentPages = mysqlTable(
  "contentPages",
  {
    id: int("id").autoincrement().primaryKey(),
    /**
     * URL-safe slug, unique within type.
     * For founders: community slug (e.g. "abbewcrew").
     * For categories: category slug (e.g. "money").
     * For guides/pillar/faq/skool-news: file slug from frontmatter or filename.
     */
    slug: varchar("slug", { length: 255 }).notNull(),
    type: mysqlEnum("type", [
      "founder",
      "category",
      "guide",
      "pillar",
      "faq",
      "skool-news",
    ]).notNull(),
    title: varchar("title", { length: 512 }).notNull(),
    metaDescription: text("metaDescription"),
    /** Rendered HTML body (markdown → html) */
    bodyHtml: text("bodyHtml").notNull(),
    /** Raw frontmatter fields as JSON (word_count, category, community_slug, etc.) */
    frontmatter: json("frontmatter").$type<Record<string, unknown>>(),
    /** Word count from frontmatter or computed */
    wordCount: int("wordCount"),
    /** For skool-news: publication date from frontmatter; others: import date */
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("idx_contentPages_type").on(table.type),
    index("idx_contentPages_slug_type").on(table.slug, table.type),
    index("idx_contentPages_publishedAt").on(table.publishedAt),
  ],
);

export type ContentPage = typeof contentPages.$inferSelect;
export type InsertContentPage = typeof contentPages.$inferInsert;