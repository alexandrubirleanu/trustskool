import { getDb } from "./server/db.ts";
import { communities } from "./drizzle/schema.ts";
import { sql } from "drizzle-orm";

const db = await getDb();

// Check distribution of member_history lengths
const rows = await db.select({
  slug: communities.slug,
  totalMembers: communities.totalMembers,
  growthRateBp: communities.growthRateBp,
  trustSkore: communities.trustSkore,
  memberHistLen: sql`JSON_LENGTH(member_history)`,
}).from(communities)
  .where(sql`JSON_LENGTH(member_history) >= 2`)
  .orderBy(sql`JSON_LENGTH(member_history) DESC`)
  .limit(10);

console.log("Communities with 2+ member_history snapshots:");
rows.forEach(r => console.log(`  ${r.slug}: mhist=${r.memberHistLen}, members=${r.totalMembers}, growthBp=${r.growthRateBp}, score=${r.trustSkore}`));

// Count total with 2+ snapshots
const [countRow] = await db.select({ count: sql`COUNT(*)` }).from(communities).where(sql`JSON_LENGTH(member_history) >= 2`);
console.log(`\nTotal with 2+ snapshots: ${countRow.count}`);

// Check growthRateBp distribution
const [bpStats] = await db.select({
  min: sql`MIN(growth_rate_bp)`,
  max: sql`MAX(growth_rate_bp)`,
  avg: sql`AVG(growth_rate_bp)`,
  nonZero: sql`SUM(CASE WHEN growth_rate_bp != 0 THEN 1 ELSE 0 END)`,
  total: sql`COUNT(*)`,
}).from(communities);
console.log(`\ngrowthRateBp stats: min=${bpStats.min}, max=${bpStats.max}, avg=${Number(bpStats.avg).toFixed(1)}, nonZero=${bpStats.nonZero}/${bpStats.total}`);

// Check trustSkore distribution
const scoreRows = await db.select({
  score: communities.trustSkore,
  count: sql`COUNT(*)`,
}).from(communities)
  .groupBy(communities.trustSkore)
  .orderBy(sql`COUNT(*) DESC`)
  .limit(10);
console.log("\nTrustSkore distribution (top 10):");
scoreRows.forEach(r => console.log(`  ${r.score}: ${r.count} communities`));

process.exit(0);
