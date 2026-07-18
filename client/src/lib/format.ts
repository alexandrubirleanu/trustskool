/** Formatting helpers shared across TrustSkool pages */

export function formatMembers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function formatPrice(cents: number | null, interval?: string | null): string {
  if (!cents) return "Free";
  const amount = cents % 100 === 0 ? (cents / 100).toString() : (cents / 100).toFixed(2);
  return `$${amount}/${interval === "year" ? "yr" : "mo"}`;
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
