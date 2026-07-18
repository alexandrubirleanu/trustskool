/**
 * One-off: register (or update) the daily ingestion Heartbeat cron.
 * Run with: npx tsx scripts/register-cron.mts
 * Owner-scope (empty userSession) — this is a project-level system cron.
 */
import "dotenv/config";
import {
  createHeartbeatJob,
  listHeartbeatJobs,
  updateHeartbeatJob,
} from "../server/_core/heartbeat";

const JOB_NAME = "daily-ingestion";
const CRON = "0 0 5 * * *"; // 05:00 UTC daily, before EU morning traffic
const PATH = "/api/scheduled/ingest";

async function main() {
  const res0 = await listHeartbeatJobs("");
  const jobs = res0.jobs ?? [];
  const existing = jobs.find(j => j.name === JOB_NAME);
  if (existing) {
    const res = await updateHeartbeatJob(
      existing.taskUid,
      { cron: CRON, path: PATH, method: "POST", enable: true },
      "",
    );
    console.log(`Updated cron ${existing.taskUid}; next run: ${res.nextExecutionAt}`);
  } else {
    const res = await createHeartbeatJob(
      {
        name: JOB_NAME,
        cron: CRON,
        path: PATH,
        method: "POST",
        description:
          "Daily TrustSkool data ingestion: fetch pipeline dataset from GitHub, upsert communities, recompute TrustSkore",
      },
      "",
    );
    console.log(`Created cron ${res.taskUid}; next run: ${res.nextExecutionAt}`);
  }
}

main().catch(err => {
  console.error("Failed to register cron:", err);
  process.exit(1);
});
