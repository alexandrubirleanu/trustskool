import { ENV } from "../server/_core/env.ts";
import { createConnection } from "mysql2/promise";
const conn = await createConnection(ENV.databaseUrl);
const [rows] = await conn.execute(`
  SELECT displayName, category, ROUND(trustSkore,4) as score, id,
    (SELECT COUNT(*)+1 FROM communities c2
     WHERE c2.category = c.category AND c2.category IS NOT NULL
       AND (c2.trustSkore > c.trustSkore OR (c2.trustSkore = c.trustSkore AND c2.id < c.id))
    ) as cat_rank
  FROM communities c
  WHERE slug = 'origins-ecommerce' OR displayName LIKE '%Origins Ecommerce%'
`) as [any[], any];
console.table(rows);
// Also check who else has score >= 97 in money
const [rows2] = await conn.execute(`
  SELECT displayName, ROUND(trustSkore,4) as score, id
  FROM communities
  WHERE category = 'money' AND trustSkore >= 97
  ORDER BY trustSkore DESC, id ASC
  LIMIT 10
`) as [any[], any];
console.log("\n--- Money communities with score >= 97 ---");
console.table(rows2);
await conn.end();
