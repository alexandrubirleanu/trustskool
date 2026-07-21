import { getCategoryRanking } from "../server/dbRankings.js";

const { rankings, snapshotMonth } = await getCategoryRanking("money");
console.log(`Money rankings (snapshot: ${snapshotMonth}):`);
for (const r of rankings.slice(0, 5)) {
  console.log(`  ${r.rankPosition}. ${r.displayName} — score: ${r.trustSkoreAtSnapshot}`);
}
process.exit(0);
