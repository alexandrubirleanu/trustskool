/**
 * One-off ingestion runner — calls runIngestion() directly without HTTP auth.
 * Usage: npx tsx scripts/run-ingestion.mts
 */
import "dotenv/config";
import { runIngestion } from "../server/ingestion";

console.log("[Ingestion] Starting real dataset ingestion…");
const result = await runIngestion();
console.log("[Ingestion] ok:", result.ok);
console.log("[Ingestion] total:", result.total);
console.log("[Ingestion] upserted:", result.upserted);
console.log("[Ingestion] skipped:", result.skipped);
if (result.errors.length) {
  console.log("[Ingestion] first errors:", result.errors.slice(0, 5));
}
process.exit(result.ok ? 0 : 1);
