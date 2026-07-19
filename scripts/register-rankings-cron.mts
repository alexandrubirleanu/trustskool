/**
 * One-off: register (or update) the monthly category rankings Heartbeat cron.
 * Runs on the 1st of every month at 02:00 UTC, after the daily ingestion.
 * Run with: npx tsx scripts/register-rankings-cron.mts
 */
import "dotenv/config";
import {
  createHeartbeatJob,
  listHeartbeatJobs,
  updateHeartbeatJob,
} from "../server/_core/heartbeat";

const JOB_NAME = "monthly-rankings-snapshot";
const CRON = "0 0 2 1 * *"; // 02:00 UTC on the 1st of every month
const PATH = "/api/scheduled/rankings-snapshot";

async function main() {
  const res0 = await listHeartbeatJobs("");
  const jobs = res0.jobs ?? [];
  const existing = jobs.find((j: { name: string }) => j.name === JOB_NAME);
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
          "Monthly TrustSkool category rankings snapshot: top 30 per category by TrustSkore (min 100 members)",
      },
      "",
    );
    console.log(`Created cron ${res.taskUid}; next run: ${res.nextExecutionAt}`);
  }
}

main().catch(err => {
  console.error("Failed to register rankings cron:", err);
  process.exit(1);
});
