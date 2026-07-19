/** Formatting helpers shared across TrustSkool pages */

/**
 * Classify a community's pricing model into one of four types.
 *
 * - "free"     → no price (100% free, no credit card ever)
 * - "monthly"  → monthly subscription (trial availability unknown — not in dataset)
 * - "annual"   → yearly subscription
 * - "one_time" → lifetime / one-time payment
 * - "paid"     → paid but interval unknown (fallback)
 *
 * NOTE: The Skool dataset does not expose a trial field. The 7-day free trial
 * is an optional feature that community owners can enable or disable. We cannot
 * reliably detect it, so we do NOT show a "7-day trial" badge or CTA.
 */
export type PriceType = "free" | "monthly" | "annual" | "one_time" | "paid";

export function getPriceType(
  cents: number | null | undefined,
  interval: string | null | undefined,
): PriceType {
  if (!cents || cents === 0) return "free";
  if (interval === "month") return "monthly";
  if (interval === "year") return "annual";
  if (interval === "one_time") return "one_time";
  return "paid";
}

export function formatMembers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function formatPrice(cents: number | null, interval?: string | null): string {
  if (!cents) return "Free";
  const amount = cents % 100 === 0 ? (cents / 100).toString() : (cents / 100).toFixed(2);
  if (interval === "year") return `$${amount}/yr`;
  if (interval === "one_time") return `$${amount} one-time`;
  return `$${amount}/mo`;
}

export function formatGrowth(bp: number): string {
  const pct = bp / 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

/** Score tier used for badge tinting */
export function scoreTier(score: number): "high" | "mid" | "low" {
  if (score >= 70) return "high";
  if (score >= 45) return "mid";
  return "low";
}

export const SCORE_TIER_CLASSES: Record<ReturnType<typeof scoreTier>, string> = {
  high: "bg-[oklch(0.55_0.12_155)] text-white",
  mid: "bg-[oklch(0.65_0.15_60)] text-white",
  low: "bg-[oklch(0.55_0.18_25)] text-white",
};

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatCategory(value: string | null): string {
  if (!value) return "";
  return value.split(/[-_]/).map(capitalize).join(" ");
}

/**
 * Maps a Skool MRR badge to a human-readable revenue range.
 * These are verified minimums — actual MRR may be higher.
 * Ranges: clover=$3k-$10k, rocket=$10k-$30k, crown=$30k-$100k,
 *         diamond=$100k-$300k, red_diamond=$300k-$1M, goated=$1M+
 */
export type MrrStatus = "none" | "clover" | "liftoff" | "rocket" | "crown" | "diamond" | "red_diamond" | "goat" | "goated";

export const MRR_BADGE: Record<string, { emoji: string; range: string; label: string }> = {
  clover:      { emoji: "🍀", range: "$3k–$10k/mo",   label: "$3k+ verified" },
  liftoff:     { emoji: "🚀", range: "$10k+/mo",      label: "$10k+ verified" },
  rocket:      { emoji: "🚀", range: "$10k–$30k/mo",  label: "$10k+ verified" },
  crown:       { emoji: "👑", range: "$30k–$100k/mo", label: "$30k+ verified" },
  diamond:     { emoji: "💎", range: "$100k–$300k/mo",label: "$100k+ verified" },
  red_diamond: { emoji: "💎", range: "$300k–$1M/mo",  label: "$300k+ verified" },
  goat:        { emoji: "🐐", range: "$1M+/mo",       label: "$1M+ verified" },
  goated:      { emoji: "🐐", range: "$1M+/mo",       label: "$1M+ verified" },
};

export function getMrrBadge(status: string | null | undefined) {
  if (!status || status === "none") return null;
  return MRR_BADGE[status] ?? null;
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
