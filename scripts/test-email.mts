/**
 * Manual test: send a click notification using the current serverConfig.emailFrom.
 * Run with: npx tsx scripts/test-email.mts
 */
import "dotenv/config";
import { sendClickNotification } from "../server/emailNotify";

const result = await sendClickNotification({
  slug: "skool-games",
  displayName: "The Skool Games",
  referrer: "https://trustskool.com/community/skool-games",
  timestamp: new Date(),
});

console.log("Email sent:", result);
process.exit(result ? 0 : 1);
