/**
 * Central TrustSkool configuration.
 * Keep brand naming, affiliate ref code, and data source in ONE place.
 */

export const BRAND_NAME = "TrustSkool";
export const SCORE_NAME = "TrustSkore";
export const SITE_TAGLINE = `${BRAND_NAME} ranks Skool communities by real growth data, not paid reviews.`;

/** Skool affiliate ref code appended to every outbound redirect */
export const SKOOL_REF_CODE = "92733312bcf942809d665dd976c25eee";

/** Outbound redirect targets */
export const skoolCommunityUrl = (slug: string) =>
  `https://www.skool.com/${slug}/about?ref=${SKOOL_REF_CODE}`;
export const SKOOL_SIGNUP_URL = `https://www.skool.com/signup?ref=${SKOOL_REF_CODE}`;

/**
 * Dataset produced by the external GitHub Actions pipeline.
 * Override with the DATASET_URL env var (server-side) once the pipeline repo is live.
 * Expected shape: JSON array of community records (see drizzle/schema.ts history types).
 */
export const DEFAULT_DATASET_URL =
  "https://raw.githubusercontent.com/alexandrubirleanu/trustskool/main/data/communities.json";

/** Canonical production origin */
export const CANONICAL_ORIGIN = "https://trustskool.com";

/** TrustSkore weighting (must sum to 1) */
export const SCORE_WEIGHTS = {
  growth_momentum: 0.35,
  ranking_momentum: 0.30,
  price_stability: 0.15,
  owner_engagement: 0.20,
} as const;

/**
 * Skool discovery categories (the 9 official tabs on skool.com/discover).
 * Used for Rankings pages and category filtering.
 */
export const SKOOL_CATEGORIES = [
  { slug: "money", label: "Money", emoji: "💰" },
  { slug: "selfimprovement", label: "Self-Improvement", emoji: "🌱" },
  { slug: "tech", label: "Tech", emoji: "💻" },
  { slug: "health", label: "Health", emoji: "💪" },
  { slug: "hobbies", label: "Hobbies", emoji: "🎨" },
  { slug: "spirituality", label: "Spirituality", emoji: "✨" },
  { slug: "sports", label: "Sports", emoji: "⚽" },
  { slug: "relationships", label: "Relationships", emoji: "🤝" },
  { slug: "music", label: "Music", emoji: "🎵" },
] as const;

export type SkoolCategorySlug = (typeof SKOOL_CATEGORIES)[number]["slug"];
