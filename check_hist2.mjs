import { getDb } from "./server/db.ts";
import { communities } from "./drizzle/schema.ts";
import { sql } from "drizzle-orm";

const db = await getDb();

// growthRateBp stats
const [bpStats] = await db.select({
  minBp: sql`MIN(growth_rate_bp)`,
  maxBp: sql`MAX(growth_rate_bp)`,
  avgBp: sql`ROUND(AVG(growth_rate_bp), 1)`,
  nonZero: sql`SUM(CASE WHEN growth_rate_bp != 0 THEN 1 ELSE 0 END)`,
  total: sql`COUNT(*)`,
}).from(communities);
console.log("growthRateBp stats:", bpStats);

// TrustSkore distribution
const scoreRows = await db.select({
  score: communities.trustSkore,
  cnt: sql`COUNT(*)`,
}).from(communities)
  .groupBy(communities.trustSkore)
  .orderBy(sql`COUNT(*) DESC`)
  .limit(10);
console.log("\nTrustSkore distribution:");
scoreRows.forEach(r => console.log(`  ${r.score}: ${r.cnt}`));

// Communities with 2+ snapshots
const [snapCount] = await db.select({
  cnt: sql`SUM(CASE WHEN JSON_LENGTH(member_history) >= 2 THEN 1 ELSE 0 END)`,
}).from(communities);
console.log(`\nCommunities with 2+ member_history snapshots: ${snapCount.cnt}`);

process.exit(0);
