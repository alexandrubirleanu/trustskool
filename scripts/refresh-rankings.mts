import { computeCategoryRankings } from "../server/dbRankings.js";

const results = await computeCategoryRankings();
const total = results.reduce((s, r) => s + r.inserted, 0);
console.log(`Rankings refreshed: ${total} rows`);
for (const r of results) {
  console.log(`  ${r.category}: ${r.inserted} rows`);
}
process.exit(0);
