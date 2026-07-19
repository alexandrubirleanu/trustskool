/**
 * Score recomputation script — run after changing memberCountFloor or bootstrap values.
 * Reads all communities from DB, recomputes TrustSkore with the new formula, and
 * bulk-updates the trustSkore and scoreBreakdown columns.
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

const SCORE_WEIGHTS = { growth_momentum: 0.45, ranking_momentum: 0.35, price_stability: 0.2 };
const BOOTSTRAP_MIN_MEMBERS = 2_000;
const BOOTSTRAP_SNAPSHOT_THRESHOLD = 3;
const BOOTSTRAP_GROWTH_MOMENTUM = 68;  // rebalanced
const BOOTSTRAP_RANKING_MOMENTUM = 65; // rebalanced

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
  if (pct >= 0) return clamp(round2(50 + 50 * (1 - Math.exp(-pct / 7))));
  return clamp(round2(50 * Math.exp(pct / 10)));
}

function computeGrowthMomentumFromBp(growthRateBp) {
  const pct = growthRateBp / 100;
  if (pct >= 0) return clamp(round2(50 + 50 * (1 - Math.exp(-pct / 7))));
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
  const base = 45 + 31 * (Math.log10(members) / 5); // rebalanced ceiling = 76
  // Micro-perturbation: up to +0.3 pts based on exact member count mod 10000
  const micro = (members % 10_000) / 10_000 * 0.3;
  const raw = base + micro;
  // 4-decimal precision for unique scores per exact member count
  return clamp(Math.round(raw * 10_000) / 10_000, 45, 76.3);
}

function computeScore(totalMembers, memberHistory, rankHistory, priceHistory, growthRateBp) {
  const bootstrap = isBootstrap(totalMembers, memberHistory, rankHistory);
  const mLen = memberHistory?.length ?? 0;

  let growth_momentum;
  if (bootstrap) {
    growth_momentum = BOOTSTRAP_GROWTH_MOMENTUM;
  } else if (mLen >= 2) {
    growth_momentum = computeGrowthMomentum(memberHistory);
  } else if (growthRateBp != null && growthRateBp !== 0) {
    growth_momentum = computeGrowthMomentumFromBp(growthRateBp);
  } else {
    growth_momentum = 50;
  }

  const ranking_momentum = bootstrap ? BOOTSTRAP_RANKING_MOMENTUM : computeRankingMomentum(rankHistory);
  const price_stability = computePriceStability(priceHistory);
  const breakdown = { growth_momentum, ranking_momentum, price_stability, isBootstrap: bootstrap };

  const rawBase = clamp(round2(
    growth_momentum * SCORE_WEIGHTS.growth_momentum +
    ranking_momentum * SCORE_WEIGHTS.ranking_momentum +
    price_stability * SCORE_WEIGHTS.price_stability
  ));

  const hasHistory = mLen >= 2 || (rankHistory?.length ?? 0) >= 2;
  const score = hasHistory ? rawBase : Math.max(rawBase, memberCountFloor(totalMembers));
  return { score: clamp(Math.round(score * 10_000) / 10_000), breakdown };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const conn = await createConnection(DATABASE_URL);
  console.log("Connected to DB");

  // Fetch all communities with their history arrays
  const [rows] = await conn.query(
    "SELECT id, totalMembers, memberHistory, rankHistory, priceHistory, growthRateBp, trustSkore FROM communities LIMIT 100000"
  );

  console.log(`Recomputing scores for ${rows.length} communities...`);

  let updated = 0;
  let unchanged = 0;
  const BATCH = 500;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    for (const row of batch) {
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

      const { score: baseScore, breakdown } = computeScore(
        row.totalMembers,
        memberHistory,
        rankHistory,
        priceHistory,
        growthRateBp,
      );

      // Apply community-id-based micro-perturbation for guaranteed unique scores
      // The id is a string like 'abc123xyz' — sum char codes for a numeric seed
      const idSeed = typeof row.id === 'string'
        ? row.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
        : (row.id ?? 0);
      const idMicro = (idSeed % 10_000) / 10_000 * 0.05;
      const score = Math.round((baseScore + idMicro) * 10_000) / 10_000;

      if (Math.abs(score - row.trustSkore) < 0.0001) {
        unchanged++;
        continue;
      }

      await conn.execute(
        "UPDATE communities SET trustSkore = ?, scoreBreakdown = ? WHERE id = ?",
        [score, JSON.stringify(breakdown), row.id]
      );
      updated++;
    }
    if ((i / BATCH) % 10 === 0) {
      process.stdout.write(`  ${i + batch.length}/${rows.length} processed...\r`);
    }
  }

  console.log(`\nDone. Updated: ${updated}, Unchanged: ${unchanged}`);
  await conn.end();
}

main().catch(err => { console.error(err); process.exit(1); });
