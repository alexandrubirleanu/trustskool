import { getDb } from "./server/db.ts";
import { contentPages } from "./drizzle/schema.ts";
import { sql } from "drizzle-orm";

const db = await getDb();
if (!db) { console.error("No DB"); process.exit(1); }

const [total] = await db.select({ n: sql`count(*)` }).from(contentPages);
const byType = await db
  .select({ type: contentPages.type, n: sql`count(*)` })
  .from(contentPages)
  .groupBy(contentPages.type)
  .orderBy(sql`count(*) desc`);
console.log("Total content pages:", total.n);
console.log("By type:", JSON.stringify(byType, null, 2));
process.exit(0);
