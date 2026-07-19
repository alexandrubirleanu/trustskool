/**
 * Score recomputation script — run after changing memberCountFloor or bootstrap values.
 * Reads all communities from DB, recomputes TrustSkore with the new formula,
 * applies a guaranteed-unique post-processing pass (no two communities share the same score),
 * and bulk-updates the trustSkore and scoreBreakdown columns.
 *
 * Uniqueness algorithm:
 *   1. Compute raw scores for all communities.
 *   2. Sort by (rawScore DESC, id ASC) — deterministic tie-breaking.
 *   3. Walk the sorted list: if score[i] >= score[i-1], set score[i] = score[i-1] - 0.01.
 *   4. Clamp to [40, 100].
 *
 * Usage: node scripts/recompute-scores.mjs
 */

import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// ── Inline score functions (mirrors trustskore.ts) ──────────────────────────

const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));
const round2 = (v) => Math.round(v * 100) / 100;

const SCORE_WEIGHTS = { growth_momentum: 0.35, ranking_momentum: 0.30, price_stability: 0.15, owner_engagement: 0.20 };
const BOOTSTRAP_MIN_MEMBERS = 2_000;
const BOOTSTRAP_SNAPSHOT_THRESHOLD = 3;
// v4: continuous bootstrap based on member count (replaces fixed 85/82)
function bootstrapGrowthMomentum(totalMembers) {
  const n = Math.max(2_000, totalMembers);
  return Math.min(100, Math.max(0, Math.round((60 + 25 * Math.log10(n) / 5) * 100) / 100));
}
function bootstrapRankingMomentum(totalMembers) {
  const n = Math.max(2_000, totalMembers);
  return Math.min(100, Math.max(0, Math.round((57 + 25 * Math.log10(n) / 5) * 100) / 100));
}

function sortByDate(points) {
  return [...points].sort((a, b) => a.date.localeCompare(b.date));
}

function computeGrowthRatePct(history, windowDays = 30) {
  if (!history || history.length < 2) return 0;
  const sorted = sortByDate(history);
  const last = sorted[sorted.length - 1];
  const lastDate = new Date(last.date).getTime();
  const cutoff = lastDate - windowDays * 86_400_000;
  const base = sorted.find(p => new Date(p.date).getTime() >= cutoff) ?? sorted[0];
  if (!base || base.total_members <= 0) return 0;
  return ((last.total_members - base.total_members) / base.total_members) * 100;
}

function computeGrowthMomentum(history) {
  if (!history || history.length < 2) return 50;
  const pct = computeGrowthRatePct(history);
  if (pct >= 0) return clamp(round2(50 + 50 * (1 - Math.exp(-pct / 2.5))));
  return clamp(round2(50 * Math.exp(pct / 10)));
}

function computeGrowthMomentumFromBp(growthRateBp) {
  const pct = growthRateBp / 100;
  if (pct >= 0) return clamp(round2(50 + 50 * (1 - Math.exp(-pct / 2.5))));
  return clamp(round2(50 * Math.exp(pct / 10)));
}

function computeRankingMomentum(history) {
  if (!history || history.length < 2) return 50;
  const sorted = sortByDate(history);
  const first = sorted[0].discovery_rank;
  const last = sorted[sorted.length - 1].discovery_rank;
  if (first <= 0 || last <= 0) return 50;
  const improvement = (first - last) / first;
  return clamp(round2(50 + 50 * Math.tanh(improvement * 2)));
}

function computeOwnerEngagement(ownerLastActiveAt, ownerActiveDaysLast30) {
  // Recency
  let recency_score;
  if (ownerLastActiveAt == null) {
    recency_score = 50; // no data → neutral
  } else {
    const daysSince = (Date.now() - new Date(ownerLastActiveAt).getTime()) / 86_400_000;
    recency_score = Math.min(100, Math.max(15, round2(100 - daysSince * 2)));
  }
  // Frequency
  let frequency_score;
  if (ownerActiveDaysLast30 == null) {
    frequency_score = 50; // no data → neutral
  } else {
    frequency_score = clamp(round2((ownerActiveDaysLast30 / 30) * 100), 0, 100);
  }
  return clamp(round2(0.6 * recency_score + 0.4 * frequency_score));
}

function computePriceStability(history) {
  if (!history || history.length < 2) return 100;
  const sorted = sortByDate(history);
  let changes = 0, increases = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].price_amount_cents ?? 0;
    const curr = sorted[i].price_amount_cents ?? 0;
    if (prev !== curr) { changes++; if (curr > prev) increases++; }
  }
  if (changes === 0) return 100;
  return clamp(round2(100 - changes * 15 - increases * 10));
}

function isBootstrap(totalMembers, memberHistory, rankHistory) {
  if (totalMembers < BOOTSTRAP_MIN_MEMBERS) return false;
  const mLen = memberHistory?.length ?? 0;
  const rLen = rankHistory?.length ?? 0;
  return Math.max(mLen, rLen) < BOOTSTRAP_SNAPSHOT_THRESHOLD;
}

function memberCountFloor(totalMembers) {
  const members = Math.max(1, totalMembers);
  const base = 45 + 31 * (Math.log10(members) / 5);
  const micro = (members % 10_000) / 10_000 * 0.3;
  const raw = base + micro;
  return clamp(Math.round(raw * 10_000) / 10_000, 45, 76.3);
}

function computeScore(totalMembers, memberHistory, rankHistory, priceHistory, growthRateBp, ownerLastActiveAt, ownerActiveDaysLast30) {
  const bootstrap = isBootstrap(totalMembers, memberHistory, rankHistory);
  const mLen = memberHistory?.length ?? 0;

  let growth_momentum;
  if (bootstrap) {
    growth_momentum = bootstrapGrowthMomentum(totalMembers);
  } else if (mLen >= 2) {
    growth_momentum = computeGrowthMomentum(memberHistory);
  } else if (growthRateBp != null && growthRateBp !== 0) {
    growth_momentum = computeGrowthMomentumFromBp(growthRateBp);
  } else {
    growth_momentum = 50;
  }

  const ranking_momentum = bootstrap ? bootstrapRankingMomentum(totalMembers) : computeRankingMomentum(rankHistory);
  const price_stability = computePriceStability(priceHistory);
  const owner_engagement = computeOwnerEngagement(ownerLastActiveAt, ownerActiveDaysLast30);
  const breakdown = { growth_momentum, ranking_momentum, price_stability, owner_engagement, isBootstrap: bootstrap };

  const rawBase = clamp(round2(
    growth_momentum * SCORE_WEIGHTS.growth_momentum +
    ranking_momentum * SCORE_WEIGHTS.ranking_momentum +
    price_stability * SCORE_WEIGHTS.price_stability +
    owner_engagement * SCORE_WEIGHTS.owner_engagement
  ));

  const hasHistory = mLen >= 2 || (rankHistory?.length ?? 0) >= 2;
  const score = hasHistory ? rawBase : Math.max(rawBase, memberCountFloor(totalMembers));
  return { score: clamp(Math.round(score * 10_000) / 10_000), breakdown };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const conn = await createConnection(DATABASE_URL);
  console.log("Connected to DB");

  // Fetch all communities with their history arrays and owner activity fields
  const [rows] = await conn.query(
    "SELECT id, totalMembers, memberHistory, rankHistory, priceHistory, growthRateBp, trustSkore, ownerLastActiveAt, ownerActiveDaysLast30 FROM communities LIMIT 100000"
  );

  console.log(`Computing scores for ${rows.length} communities...`);

  // ── Phase 1: compute raw scores for every community ──────────────────────
  const computed = rows.map(row => {
    const parseCol = (v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') return JSON.parse(v);
      return [];
    };
    const memberHistory = parseCol(row.memberHistory);
    const rankHistory = parseCol(row.rankHistory);
    const priceHistory = parseCol(row.priceHistory);
    const growthRateBp = row.growthRateBp ?? 0;

    const { score, breakdown } = computeScore(
      row.totalMembers,
      memberHistory,
      rankHistory,
      priceHistory,
      growthRateBp,
      row.ownerLastActiveAt ?? null,
      row.ownerActiveDaysLast30 ?? null,
    );

    return { id: row.id, oldScore: row.trustSkore, score, breakdown };
  });

  // ── Phase 2: guaranteed-unique pass ──────────────────────────────────────
  // Convert scores to integers (×100) to avoid floating-point rounding issues.
  // Sort by (scoreInt DESC, id ASC) for deterministic tie-breaking.
  // Walk the list: if scoreInt[i] >= scoreInt[i-1], set scoreInt[i] = scoreInt[i-1] - 1.
  // This guarantees every score is unique at 2-decimal precision.
  computed.sort((a, b) => {
    const ai = Math.round(a.score * 100);
    const bi = Math.round(b.score * 100);
    if (bi !== ai) return bi - ai;
    return String(a.id).localeCompare(String(b.id));
  });

  // Convert to integer scores for the uniqueness pass
  for (const item of computed) {
    item.scoreInt = Math.round(item.score * 100);
  }

  let collisions = 0;
  for (let i = 1; i < computed.length; i++) {
    if (computed[i].scoreInt >= computed[i - 1].scoreInt) {
      computed[i].scoreInt = computed[i - 1].scoreInt - 1;
      collisions++;
    }
    // Clamp to minimum 4000 (= 40.00)
    computed[i].scoreInt = Math.max(4000, computed[i].scoreInt);
  }

  // Convert back to 2-decimal float
  for (const item of computed) {
    item.score = item.scoreInt / 100;
  }

  console.log(`Uniqueness pass: resolved ${collisions} collisions`);

  // ── Phase 3: bulk-update only changed rows ────────────────────────────────
  let updated = 0;
  let unchanged = 0;

  for (const item of computed) {
    if (Math.abs(item.score - item.oldScore) < 0.001) {
      unchanged++;
      continue;
    }
    await conn.execute(
      "UPDATE communities SET trustSkore = ?, scoreBreakdown = ? WHERE id = ?",
      [item.score, JSON.stringify(item.breakdown), item.id]
    );
    updated++;
    if (updated % 500 === 0) {
      process.stdout.write(`  ${updated} updated...\r`);
    }
  }

  console.log(`\nDone. Updated: ${updated}, Unchanged: ${unchanged}`);

  // ── Verify uniqueness ─────────────────────────────────────────────────────
  const scoreSet = new Set(computed.map(c => c.score));
  console.log(`Unique scores in memory: ${scoreSet.size} / ${computed.length}`);
  if (scoreSet.size !== computed.length) {
    console.warn("WARNING: still have duplicate scores in memory — check logic");
  } else {
    console.log("✓ All scores are unique");
  }

  await conn.end();
}

main().catch(err => { console.error(err); process.exit(1); });
