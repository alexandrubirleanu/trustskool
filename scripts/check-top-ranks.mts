import { ENV } from "../server/_core/env.ts";
import { createConnection } from "mysql2/promise";
const conn = await createConnection(ENV.databaseUrl);
const [rows] = await conn.execute(`
  SELECT displayName, category, ROUND(trustSkore,1) as score,
    (SELECT COUNT(*)+1 FROM communities c2
     WHERE c2.category = c.category AND c2.category IS NOT NULL
       AND (c2.trustSkore > c.trustSkore OR (c2.trustSkore = c.trustSkore AND c2.id < c.id))
    ) as cat_rank
  FROM communities c
  ORDER BY trustSkore DESC
  LIMIT 15
`) as [any[], any];
console.table(rows);
await conn.end();
