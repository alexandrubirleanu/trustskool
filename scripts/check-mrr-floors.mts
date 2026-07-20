import { ENV } from "../server/_core/env.ts";
import { createConnection } from "mysql2/promise";

const conn = await createConnection(ENV.databaseUrl);
const [rows] = await conn.execute(`
  SELECT mrrStatus, COUNT(*) as total,
    ROUND(MIN(trustSkore),1) as min_score,
    ROUND(MAX(trustSkore),1) as max_score,
    SUM(CASE 
      WHEN mrrStatus='clover' AND trustSkore<75 THEN 1 
      WHEN mrrStatus IN('rocket','liftoff') AND trustSkore<82 THEN 1 
      WHEN mrrStatus='crown' AND trustSkore<88 THEN 1 
      WHEN mrrStatus='diamond' AND trustSkore<93 THEN 1 
      WHEN mrrStatus='red_diamond' AND trustSkore<97 THEN 1 
      WHEN mrrStatus IN('goated','goat') AND trustSkore<99 THEN 1 
      ELSE 0 
    END) as below_floor
  FROM communities WHERE mrrStatus IS NOT NULL AND mrrStatus!='none'
  GROUP BY mrrStatus ORDER BY min_score
`) as [any[], any];
console.table(rows);
await conn.end();
