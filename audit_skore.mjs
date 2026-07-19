import { getDb } from './server/db.ts';
import { communities } from './drizzle/schema.ts';
import { sql, count, avg, min, max } from 'drizzle-orm';

const db = await getDb();

// 1. TrustSkore distribution
const dist = await db.select({
  min: min(communities.trustSkore),
  max: max(communities.trustSkore),
  avg: avg(communities.trustSkore),
  total: count(),
}).from(communities);
console.log("=== TrustSkore distribution ===");
console.log(dist[0]);

// 2. Unique trustSkore values
const unique = await db.execute(sql`SELECT COUNT(DISTINCT trustSkore) as unique_scores FROM communities`);
console.log("\n=== Unique TrustSkore values ===");
console.log(unique[0]);

// 3. Top 20 score buckets
const top20 = await db.execute(sql`SELECT trustSkore, COUNT(*) as cnt FROM communities GROUP BY trustSkore ORDER BY trustSkore DESC LIMIT 20`);
console.log("\n=== Top 20 score buckets ===");
for (const r of top20[0]) console.log(`  ${r.trustSkore}: ${r.cnt} communities`);

// 4. Sample memberHistory for top communities
const sample = await db.execute(sql`SELECT slug, totalMembers, memberHistory FROM communities WHERE memberHistory IS NOT NULL AND memberHistory != '[]' AND memberHistory != 'null' ORDER BY totalMembers DESC LIMIT 5`);
console.log("\n=== Sample memberHistory (top 5 by members) ===");
for (const r of sample[0]) {
  const hist = typeof r.memberHistory === 'string' ? JSON.parse(r.memberHistory) : r.memberHistory;
  const len = Array.isArray(hist) ? hist.length : 0;
  const last2 = Array.isArray(hist) ? hist.slice(-2) : [];
  console.log(`  ${r.slug} (${r.totalMembers} members): ${len} snapshots`);
  if (last2.length > 0) console.log(`    last 2: ${JSON.stringify(last2)}`);
}

// 5. Communities with 2+ snapshots
const withHistory = await db.execute(sql`SELECT COUNT(*) as cnt FROM communities WHERE memberHistory IS NOT NULL AND memberHistory != '[]' AND JSON_LENGTH(memberHistory) >= 2`);
console.log("\n=== Communities with 2+ snapshots ===");
console.log(withHistory[0]);

// 6. Exactly 1 snapshot
const one = await db.execute(sql`SELECT COUNT(*) as cnt FROM communities WHERE memberHistory IS NOT NULL AND JSON_LENGTH(memberHistory) = 1`);
console.log("\n=== Communities with exactly 1 snapshot ===");
console.log(one[0]);

// 7. No history
const noHist = await db.execute(sql`SELECT COUNT(*) as cnt FROM communities WHERE memberHistory IS NULL OR memberHistory = '[]' OR memberHistory = 'null'`);
console.log("\n=== Communities with no history ===");
console.log(noHist[0]);

// 8. Formula inputs for top 10
const cols = await db.execute(sql`SELECT slug, trustSkore, growthRateBp, totalMembers, priceAmountCents FROM communities ORDER BY trustSkore DESC LIMIT 10`);
console.log("\n=== Top 10 by TrustSkore with formula inputs ===");
for (const r of cols[0]) console.log(`  ${r.slug}: skore=${r.trustSkore}, growthBp=${r.growthRateBp}, members=${r.totalMembers}, price=${r.priceAmountCents}`);

// 9. growthRateBp distribution
const growthDist = await db.execute(sql`SELECT MIN(growthRateBp) as min_bp, MAX(growthRateBp) as max_bp, AVG(growthRateBp) as avg_bp, COUNT(DISTINCT growthRateBp) as unique_vals FROM communities`);
console.log("\n=== growthRateBp distribution ===");
console.log(growthDist[0]);

process.exit(0);
