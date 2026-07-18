/**
 * Dev seeding through the REAL ingestion path:
 * 1. generate the sample dataset in-memory (spawn sample-dataset.mjs)
 * 2. serve it once on an ephemeral local HTTP port
 * 3. call runIngestion(<local url>) — fetch -> zod -> upsert -> TrustSkore
 *
 * Usage: npx tsx scripts/seed-dev.mts
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { runIngestion } from "../server/ingestion";

const here = path.dirname(fileURLToPath(import.meta.url));
const json = execFileSync("node", [path.join(here, "sample-dataset.mjs")], {
  maxBuffer: 64 * 1024 * 1024,
}).toString();

const server = createServer((_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(json);
});

await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("No server address");
const url = `http://127.0.0.1:${address.port}/data/communities.json`;

const result = await runIngestion(url);
console.log(JSON.stringify(result, null, 2));
server.close();
process.exit(result.ok ? 0 : 1);
