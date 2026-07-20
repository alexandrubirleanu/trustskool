import { ENV } from "../server/_core/env.ts";
import { createConnection } from "mysql2/promise";
const conn = await createConnection(ENV.databaseUrl);
// Check a community with score ~85 in money that shows rank 1 incorrectly
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
  WHERE id = 130452
`) as [any[], any];
console.table(rows);
// Check how many money communities have score > 85
const [rows2] = await conn.execute(`
  SELECT COUNT(*) as cnt FROM communities WHERE category = 'money' AND trustSkore > 85.0915
`) as [any[], any];
console.log("\nMoney communities with score > 85.0915:", (rows2 as any[])[0].cnt);
await conn.end();
