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

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
