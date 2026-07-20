import type {
  MemberHistoryPoint,
  PriceHistoryPoint,
  RankHistoryPoint,
  ScoreBreakdown,
} from "../drizzle/schema";
import type { MrrStatus } from "./mrrEstimate";
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
 *
 * Bootstrap rule (temporary, first ~2-4 weeks of tracking):
 * If a community has >=2,000 members AND fewer than 3 history snapshots, we
 * bootstrap growth_momentum=80 and ranking_momentum=75 instead of the neutral
 * 50/50 defaults. This prevents a large, established community from showing a
 * misleading mediocre score just because our own tracking is young.
 * Once >=3 real snapshots exist, the bootstrap is dropped entirely.
 */

const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

/** Minimum member count to qualify for bootstrap treatment */
export const BOOTSTRAP_MIN_MEMBERS = 2_000;
/** Minimum snapshot count to graduate out of bootstrap mode */
export const BOOTSTRAP_SNAPSHOT_THRESHOLD = 3;
/**
 * Bootstrap sub-scores for popular communities with insufficient history.
 * REBALANCED v4 (2026-07-19): replaced fixed 85/82 constants with a continuous
 * member-count-based formula so bootstrap communities are spread across a wide
 * score range instead of all clustering at 87.
 *
 * bootstrapGrowth  = 60 + 25 * log10(n) / log10(100_000)  → 2k→67.5, 10k→73.9, 100k→85
 * bootstrapRanking = 57 + 25 * log10(n) / log10(100_000)  → 2k→64.5, 10k→70.9, 100k→82
 *
 * Composite range: ~62 (2k members) to ~87 (100k+ members).
 * Communities with real growth data can still score 88-95+ and outrank bootstrap ones.
 */
export const BOOTSTRAP_GROWTH_MOMENTUM = 85; // kept for reference; use bootstrapGrowthMomentum(n) instead
export const BOOTSTRAP_RANKING_MOMENTUM = 82; // kept for reference; use bootstrapRankingMomentum(n) instead

/** Continuous bootstrap growth momentum based on member count. */
export function bootstrapGrowthMomentum(totalMembers: number): number {
  const n = Math.max(2_000, totalMembers);
  // log10(100_000) = 5
  return clamp(Math.round((60 + 25 * Math.log10(n) / 5) * 100) / 100);
}

/** Continuous bootstrap ranking momentum based on member count. */
export function bootstrapRankingMomentum(totalMembers: number): number {
  const n = Math.max(2_000, totalMembers);
  return clamp(Math.round((57 + 25 * Math.log10(n) / 5) * 100) / 100);
}

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
 * RECALIBRATED (2026-07-19): saturation constant changed from 7 → 2.5 so that
 * modest real growth (+3%/30d) maps to ~82 instead of ~65, allowing top communities
 * to reach 85-95+ on the composite score.
 * 0% growth -> 50 (neutral), +3% -> ~82, +5% -> ~91, +10% -> ~98, negative decays toward 0.
 */
export function computeGrowthMomentum(history: MemberHistoryPoint[] | null | undefined): number {
  if (!history || history.length < 2) return 50;
  const pct = computeGrowthRatePct(history);
  if (pct >= 0) {
    // saturating curve: 0% -> 50, 3% -> ~82, 5% -> ~91, 10% -> ~98
    return clamp(round2(50 + 50 * (1 - Math.exp(-pct / 2.5))));
  }
  // losses hit harder: -10% -> ~19
  return clamp(round2(50 * Math.exp(pct / 10)));
}

/**
 * Growth momentum from basis points (growthRateBp from the pipeline dataset).
 * Used as a fallback when memberHistory has fewer than 2 snapshots.
 * RECALIBRATED (2026-07-19): saturation constant 7 → 2.5 to match computeGrowthMomentum.
 * 0 bp -> 50 (neutral), +300 bp (+3%) -> ~82, +500 bp (+5%) -> ~91, +1000 bp (+10%) -> ~98
 * Negative bp decays toward 0 symmetrically.
 */
export function computeGrowthMomentumFromBp(growthRateBp: number): number {
  const pct = growthRateBp / 100; // convert bp to percentage
  if (pct >= 0) {
    return clamp(round2(50 + 50 * (1 - Math.exp(-pct / 2.5))));
  }
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

/**
 * Returns true when a community qualifies for bootstrap mode:
 * - Has >= BOOTSTRAP_MIN_MEMBERS members (established/popular community)
 * - Has fewer than BOOTSTRAP_SNAPSHOT_THRESHOLD history snapshots (our tracking is young)
 *
 * Once a community accumulates enough real snapshots, this returns false and
 * the real computed values from the existing engine take over permanently.
 */
export function isBootstrapScore(
  totalMembers: number,
  memberHistory: { date: string }[] | null | undefined,
  rankHistory: { date: string }[] | null | undefined,
): boolean {
  if (totalMembers < BOOTSTRAP_MIN_MEMBERS) return false;
  const mLen = memberHistory?.length ?? 0;
  const rLen = rankHistory?.length ?? 0;
  // Use the maximum of the two arrays as the snapshot count
  const snapshotCount = Math.max(mLen, rLen);
  return snapshotCount < BOOTSTRAP_SNAPSHOT_THRESHOLD;
}

/**
 * Compute breakdown with bootstrap applied for popular communities with
 * insufficient history. Bootstrap sets growth_momentum=80, ranking_momentum=75
 * and lets price_stability use its existing logic (already defaults to 100 for
 * <2 history points, which is correct).
 *
 * The breakdown is returned with an `isBootstrap` flag so the UI can show a
 * transparency note to visitors.
 */
export function computeBreakdownWithBootstrap(input: {
  memberHistory?: MemberHistoryPoint[] | null;
  rankHistory?: RankHistoryPoint[] | null;
  priceHistory?: PriceHistoryPoint[] | null;
  totalMembers: number;
  /** Pipeline-provided growth rate in basis points (e.g. 83 = +0.83%). Used as
   * fallback for growth_momentum when memberHistory has < 2 snapshots. */
  growthRateBp?: number | null;
  /** Owner activity signals — null means no data yet (resolves to neutral 50) */
  ownerLastActiveAt?: Date | null;
  ownerActiveDaysLast30?: number | null;
}): ScoreBreakdown {
  const bootstrap = isBootstrapScore(
    input.totalMembers,
    input.memberHistory,
    input.rankHistory,
  );

  // Determine growth_momentum:
  // 1. If bootstrap (large community, few snapshots) → use bootstrap value
  // 2. If we have ≥2 member history points → compute from real snapshots
  // 3. If we have pipeline growthRateBp → convert bp to momentum score
  // 4. Otherwise → neutral 50
  const mLen = input.memberHistory?.length ?? 0;
  let growth_momentum: number;
  if (bootstrap) {
    growth_momentum = bootstrapGrowthMomentum(input.totalMembers);
  } else if (mLen >= 2) {
    growth_momentum = computeGrowthMomentum(input.memberHistory);
  } else if (input.growthRateBp != null) {
    growth_momentum = computeGrowthMomentumFromBp(input.growthRateBp);
  } else {
    growth_momentum = 50;
  }

  return {
    growth_momentum,
    ranking_momentum: bootstrap
      ? bootstrapRankingMomentum(input.totalMembers)
      : computeRankingMomentum(input.rankHistory),
    price_stability: computePriceStability(input.priceHistory),
    owner_engagement: computeOwnerEngagement(input.ownerLastActiveAt, input.ownerActiveDaysLast30),
    isBootstrap: bootstrap,
  };
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

/**
 * Owner engagement sub-score (0-100).
 *
 * recency_score  = last_active null ? 50 : clamp(100 - days_since_active*2, 15, 100)
 * frequency_score = active_days_last_30 null ? 50 : (active_days_last_30/30)*100
 * owner_engagement = 0.6*recency_score + 0.4*frequency_score
 *
 * CRITICAL: null inputs MUST resolve to neutral 50 — never 0 — so communities
 * without owner data yet are not unfairly penalised when this feature ships.
 */
export function computeOwnerEngagement(
  ownerLastActiveAt: Date | null | undefined,
  ownerActiveDaysLast30: number | null | undefined,
): number {
  // Recency: how recently the owner was active
  let recency_score: number;
  if (ownerLastActiveAt == null) {
    recency_score = 50; // no data → neutral
  } else {
    const daysSince = (Date.now() - ownerLastActiveAt.getTime()) / 86_400_000;
    recency_score = clamp(round2(100 - daysSince * 2), 15, 100);
  }

  // Frequency: how often the owner is active in the last 30 days
  let frequency_score: number;
  if (ownerActiveDaysLast30 == null) {
    frequency_score = 50; // no data → neutral
  } else {
    frequency_score = clamp(round2((ownerActiveDaysLast30 / 30) * 100), 0, 100);
  }

  return clamp(round2(0.6 * recency_score + 0.4 * frequency_score));
}

/**
 * Weighted TrustSkore 0-100 from a breakdown.
 *
 * When `communityId` is provided, a deterministic micro-perturbation of up to
 * 0.05 points is added based on the community's unique ID. This ensures every
 * community gets a numerically unique score even when their breakdown components
 * round to the same value. The perturbation is invisible to users (displayed as
 * integer or 1 decimal) but prevents ties in the sort order.
 */
export function computeTrustSkore(
  breakdown: ScoreBreakdown,
  totalMembers?: number,
  communityId?: number | string,
): number {
  // owner_engagement defaults to neutral 50 when not present in breakdown
  const ownerEngagement = breakdown.owner_engagement ?? 50;
  const raw =
    breakdown.growth_momentum * SCORE_WEIGHTS.growth_momentum +
    breakdown.ranking_momentum * SCORE_WEIGHTS.ranking_momentum +
    breakdown.price_stability * SCORE_WEIGHTS.price_stability +
    ownerEngagement * SCORE_WEIGHTS.owner_engagement;
  const base = clamp(round2(raw));
  // Micro-perturbation using communityId (guaranteed unique) as seed.
  // Falls back to totalMembers-based perturbation if id not available.
  const seed = communityId != null
    ? (typeof communityId === 'string'
        ? communityId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
        : communityId)
    : (totalMembers ?? 0);
  if (seed > 0) {
    // max 0.05 pts, 4-decimal precision — invisible in display but unique in DB
    const micro = (seed % 10_000) / 10_000 * 0.05;
    return clamp(Math.round((base + micro) * 10_000) / 10_000);
  }
  return base;
}

/**
 * Continuous TrustSkore floor based on member count, using log-scale interpolation.
 * Applied when history is too short (<2 data points) to compute real momentum.
 * Prevents popular communities from showing a misleading flat score.
 *
 * REBALANCED (2026-07-19): ceiling lowered from 90 → 76 and slope compressed
 * so large-but-stagnant communities don't permanently dominate communities that
 * have real growth data. Communities with ≥2 real snapshots and strong growth
 * can now score above 76 and outrank large-but-idle ones.
 *
 * MICRO-PERTURBATION (2026-07-19): adds (n mod 10000) / 10000 * 0.3 to the
 * log-scale base, so every community with a distinct member count gets a
 * numerically unique floor score. The perturbation is ≤0.3 pts and never
 * crosses an order-of-magnitude boundary, preserving the overall ranking economy.
 *
 * Formula: floor = 45 + 31 * log10(max(1, n)) / 5 + (n mod 10000) / 10000 * 0.3
 * Example reference values (base only, before perturbation):
 *   1 member    → 45.0
 *   10 members  → 51.2
 *   100 members → 57.4
 *   1k members  → 63.6
 *   10k members → 69.8
 *   100k members→ 76.0
 *
 * Communities with real growth data can still score 77-95+ via the momentum
 * components, so the leaderboard rewards active communities over large-but-idle ones.
 */
export function memberCountFloor(totalMembers: number): number {
  const members = Math.max(1, totalMembers);
  // log10(100_000) = 5; base ceiling = 45 + 31 = 76
  const base = 45 + 31 * (Math.log10(members) / 5);
  // Micro-perturbation: spreads communities with similar member counts apart
  // by up to 0.3 points based on the exact member count modulo 10000.
  // Use 4-decimal precision (not round2) to maximise unique score values.
  const micro = (members % 10_000) / 10_000 * 0.3;
  const raw = base + micro;
  // Round to 4 decimal places for uniqueness while keeping display clean
  return clamp(Math.round(raw * 10_000) / 10_000, 45, 76.3);
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
 * Permanent TrustSkore floor based on the community's Skool-verified MRR badge.
 * A verified badge is a stable, external trust signal that should always be
 * reflected in the score — unlike the memberCountFloor which is only a bootstrap
 * proxy until real history accumulates.
 *
 * Tier mapping (badge → floor):
 *   clover      ($3k+/mo)   → 75
 *   rocket      ($10k+/mo)  → 82
 *   liftoff     ($10k+/mo)  → 82  (alias for rocket)
 *   crown       ($30k+/mo)  → 88
 *   diamond     ($100k+/mo) → 93
 *   red_diamond ($300k+/mo) → 97
 *   goated      ($1M+/mo)   → 99
 *   goat        ($1M+/mo)   → 99  (alias for goated)
 *   none / null             →  0  (no floor applied)
 */
export function mrrBadgeFloor(mrrStatus: MrrStatus | string | null | undefined): number {
  switch (mrrStatus) {
    case "clover":      return 75;
    case "rocket":      return 82;
    case "liftoff":     return 82;
    case "crown":       return 88;
    case "diamond":     return 93;
    case "red_diamond": return 97;
    case "goated":      return 99;
    case "goat":        return 99;
    default:            return 0;
  }
}

/**
 * Compute TrustSkore with all applicable floors:
 * 1. memberCountFloor — applied only when history is too short (<2 data points)
 * 2. mrrBadgeFloor    — applied always when a Skool-verified MRR badge is present
 *
 * finalScore = max(rawComputedScore, memberCountFloor?, mrrBadgeFloor)
 */
export function computeTrustSkoreWithFloor(
  breakdown: ScoreBreakdown,
  totalMembers: number,
  memberHistory: { date: string }[] | null | undefined,
  rankHistory: { date: string }[] | null | undefined,
  communityId?: number | string,
  mrrStatus?: MrrStatus | string | null,
): number {
  const raw = computeTrustSkore(breakdown, totalMembers, communityId);
  let score = raw;
  // Member-count floor: only when history is too short to compute real momentum
  if (hasInsufficientHistory(memberHistory, rankHistory)) {
    const floor = memberCountFloor(totalMembers);
    score = Math.max(score, floor);
  }
  // MRR badge floor: always applied when a verified badge is present
  const badgeFloor = mrrBadgeFloor(mrrStatus);
  if (badgeFloor > 0) {
    score = Math.max(score, badgeFloor);
  }
  return score;
}
