import { ENV } from "../server/_core/env.ts";
import { createConnection } from "mysql2/promise";
const conn = await createConnection(ENV.databaseUrl);
// Check Trading Bootcamp rank
const [rows] = await conn.execute(`
  SELECT displayName, category, trustSkore, id,
    (SELECT COUNT(*)+1 FROM communities c2
     WHERE c2.category = c.category AND c2.category IS NOT NULL
       AND (c2.trustSkore > c.trustSkore OR (c2.trustSkore = c.trustSkore AND c2.id < c.id))
    ) as cat_rank,
    (SELECT COUNT(*) FROM communities c2
     WHERE c2.category = c.category AND c2.category IS NOT NULL
       AND c2.trustSkore > c.trustSkore
    ) as strictly_greater
  FROM communities c
  WHERE displayName IN ('Trading Bootcamp', 'Maker School: AI Automation', 'AI Automations by Jack', 'Origins Ecommerce', 'Blue-Collar Biz Free Group')
  ORDER BY trustSkore DESC, id ASC
`) as [any[], any];
console.table(rows);
// Check all money communities with score >= 93
const [rows2] = await conn.execute(`
  SELECT displayName, trustSkore, id,
    (SELECT COUNT(*)+1 FROM communities c2
     WHERE c2.category = c.category AND c2.category IS NOT NULL
       AND (c2.trustSkore > c.trustSkore OR (c2.trustSkore = c.trustSkore AND c2.id < c.id))
    ) as cat_rank
  FROM communities c
  WHERE category = 'money' AND trustSkore >= 93
  ORDER BY trustSkore DESC, id ASC
  LIMIT 15
`) as [any[], any];
console.log("\n--- Money communities with score >= 93 ---");
console.table(rows2);
await conn.end();
