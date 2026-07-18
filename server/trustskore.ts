import type {
  MemberHistoryPoint,
  PriceHistoryPoint,
  RankHistoryPoint,
  ScoreBreakdown,
} from "../drizzle/schema";
import { SCORE_WEIGHTS } from "../shared/appConfig";

/**
 * TrustSkore engine.
 *
 * Computes a 0-100 weighted score per community from its history arrays:
 * - growth_momentum (45%): recent member growth rate, log-scaled
 * - ranking_momentum (35%): discovery rank improvement (lower rank = better)
 * - price_stability (20%): fewer/no price changes = more stable
 *
 * When the pipeline already provides trust_score / score_breakdown, ingestion
 * keeps the pipeline values as source of truth and this engine acts as a
 * fallback for records missing them (and for the daily recalculation pass).
 */

const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

function sortByDate<T extends { date: string }>(points: T[]): T[] {
  return [...points].sort((a, b) => a.date.localeCompare(b.date));
}

/** Percentage growth over the last `windowDays` days (e.g. 5.23 = +5.23%) */
export function computeGrowthRatePct(history: MemberHistoryPoint[] | null | undefined, windowDays = 30): number {
  if (!history || history.length < 2) return 0;
  const sorted = sortByDate(history);
  const last = sorted[sorted.length - 1];
  const lastDate = new Date(last.date).getTime();
  const cutoff = lastDate - windowDays * 86_400_000;
  // earliest point within the window, else the first available point
  const base = sorted.find(p => new Date(p.date).getTime() >= cutoff) ?? sorted[0];
  if (!base || base.total_members <= 0) return 0;
  return ((last.total_members - base.total_members) / base.total_members) * 100;
}

/**
 * Growth momentum 0-100.
 * 0% growth -> 50 (neutral), +20%/30d -> ~100, negative growth decays toward 0.
 */
export function computeGrowthMomentum(history: MemberHistoryPoint[] | null | undefined): number {
  if (!history || history.length < 2) return 50;
  const pct = computeGrowthRatePct(history);
  if (pct >= 0) {
    // saturating curve: 0% -> 50, 5% -> ~75, 20% -> ~97
    return clamp(round2(50 + 50 * (1 - Math.exp(-pct / 7))));
  }
  // losses hit harder: -10% -> ~19
  return clamp(round2(50 * Math.exp(pct / 10)));
}

/**
 * Ranking momentum 0-100 from discovery rank movement (lower rank = better).
 * Improvement of the rank over the window maps above 50; worsening below 50.
 */
export function computeRankingMomentum(history: RankHistoryPoint[] | null | undefined): number {
  if (!history || history.length < 2) return 50;
  const sorted = sortByDate(history);
  const first = sorted[0].discovery_rank;
  const last = sorted[sorted.length - 1].discovery_rank;
  if (first <= 0 || last <= 0) return 50;
  // relative improvement: positive when rank number decreased
  const improvement = (first - last) / first; // e.g. 100 -> 60 = +0.4
  const score = 50 + 50 * Math.tanh(improvement * 2);
  return clamp(round2(score));
}

/**
 * Price stability 0-100.
 * Free communities and communities with an unchanged price are fully stable (100).
 * Each price change reduces the score; recent increases weigh more.
 */
export function computePriceStability(history: PriceHistoryPoint[] | null | undefined): number {
  if (!history || history.length < 2) return 100;
  const sorted = sortByDate(history);
  let changes = 0;
  let increases = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].price_amount_cents ?? 0;
    const curr = sorted[i].price_amount_cents ?? 0;
    if (prev !== curr) {
      changes++;
      if (curr > prev) increases++;
    }
  }
  if (changes === 0) return 100;
  const penalty = changes * 15 + increases * 10;
  return clamp(round2(100 - penalty));
}

export function computeBreakdown(input: {
  memberHistory?: MemberHistoryPoint[] | null;
  rankHistory?: RankHistoryPoint[] | null;
  priceHistory?: PriceHistoryPoint[] | null;
}): ScoreBreakdown {
  return {
    growth_momentum: computeGrowthMomentum(input.memberHistory),
    ranking_momentum: computeRankingMomentum(input.rankHistory),
    price_stability: computePriceStability(input.priceHistory),
  };
}

/** Weighted TrustSkore 0-100 from a breakdown */
export function computeTrustSkore(breakdown: ScoreBreakdown): number {
  const score =
    breakdown.growth_momentum * SCORE_WEIGHTS.growth_momentum +
    breakdown.ranking_momentum * SCORE_WEIGHTS.ranking_momentum +
    breakdown.price_stability * SCORE_WEIGHTS.price_stability;
  return clamp(round2(score));
}

/**
 * Minimum TrustSkore floor based on member count.
 * Applied when history is too short (<2 data points) to compute real momentum.
 * Prevents popular communities from showing a misleading 60.0 flat score.
 *
 * Tiers (member count → floor):
 *   10k+  → 82   (established large community)
 *   5k+   → 78
 *   2k+   → 72
 *   1k+   → 67
 *   500+  → 62
 *   <500  → 50   (no floor — too small to assume trust)
 */
export function memberCountFloor(totalMembers: number): number {
  if (totalMembers >= 10_000) return 82;
  if (totalMembers >= 5_000)  return 78;
  if (totalMembers >= 2_000)  return 72;
  if (totalMembers >= 1_000)  return 67;
  if (totalMembers >= 500)    return 62;
  return 50;
}

/**
 * Returns true when history arrays are too short to produce meaningful momentum.
 * "Too short" = fewer than 2 data points in the most important arrays.
 */
export function hasInsufficientHistory(
  memberHistory: { date: string }[] | null | undefined,
  rankHistory: { date: string }[] | null | undefined,
): boolean {
  const mLen = memberHistory?.length ?? 0;
  const rLen = rankHistory?.length ?? 0;
  return mLen < 2 && rLen < 2;
}

/**
 * Compute TrustSkore with member-count floor applied when history is too short.
 * Once the pipeline accumulates ≥2 data points, the real score takes over.
 */
export function computeTrustSkoreWithFloor(
  breakdown: ScoreBreakdown,
  totalMembers: number,
  memberHistory: { date: string }[] | null | undefined,
  rankHistory: { date: string }[] | null | undefined,
): number {
  const raw = computeTrustSkore(breakdown);
  if (hasInsufficientHistory(memberHistory, rankHistory)) {
    const floor = memberCountFloor(totalMembers);
    return Math.max(raw, floor);
  }
  return raw;
}
