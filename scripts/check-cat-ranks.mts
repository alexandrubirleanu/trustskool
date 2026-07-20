import { ENV } from "../server/_core/env.ts";
import { createConnection } from "mysql2/promise";
const conn = await createConnection(ENV.databaseUrl);

// How many communities per category have isCategoryTop=1 (should be exactly 1 each)
const [rows] = await conn.execute(`
  SELECT category,
    SUM(CASE WHEN isCategoryTop=1 THEN 1 ELSE 0 END) as top1_count,
    COUNT(*) as total
  FROM communities
  WHERE category IS NOT NULL
  GROUP BY category
  ORDER BY category
`) as [any[], any];
console.log("=== isCategoryTop distribution (should be 1 per category) ===");
console.table(rows);

// Rank distribution for money category (top 25)
const [ranks] = await conn.execute(`
  SELECT displayName, ROUND(trustSkore,1) as score,
    (SELECT COUNT(*)+1 FROM communities c2
     WHERE c2.category = c.category AND c2.category IS NOT NULL
       AND (c2.trustSkore > c.trustSkore OR (c2.trustSkore = c.trustSkore AND c2.id < c.id))
    ) as cat_rank
  FROM communities c
  WHERE category = 'money'
  ORDER BY trustSkore DESC
  LIMIT 25
`) as [any[], any];
console.log("\n=== Money category top 25 ===");
console.table(ranks);

await conn.end();
