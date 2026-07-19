import { getDb } from "./server/db.ts";
import { communities } from "./drizzle/schema.ts";
import { sql, isNotNull } from "drizzle-orm";

const db = await getDb();
const cats = await db
  .select({ cat: communities.category, n: sql`count(*)` })
  .from(communities)
  .where(isNotNull(communities.category))
  .groupBy(communities.category)
  .orderBy(sql`count(*) desc`);
console.log("Categories with community counts:");
cats.forEach(r => console.log(`  ${r.cat}: ${r.n}`));
const [total] = await db.select({ n: sql`count(*)` }).from(communities);
const [withCat] = await db.select({ n: sql`count(*)` }).from(communities).where(isNotNull(communities.category));
console.log(`\nTotal: ${total.n}, With category: ${withCat.n}`);
process.exit(0);
