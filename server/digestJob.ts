/**
 * Daily digest job — called by the Heartbeat cron at 09:00 UTC.
 * Aggregates all clicks from the previous 24-hour window and sends a
 * Tier B summary email to the site owner.
 */
import { getClicksForDigest } from "./dbCommunities";
import { sendDailyDigest } from "./emailNotify";

export async function runDailyDigest(): Promise<{ ok: boolean; clicks: number; sent: boolean }> {
  const until = new Date();
  // Round down to the start of the current hour for a clean 24h window
  until.setMinutes(0, 0, 0);
  const since = new Date(until.getTime() - 24 * 60 * 60 * 1000);

  const windowLabel = `${since.toISOString().slice(0, 16).replace("T", " ")} – ${until.toISOString().slice(0, 16).replace("T", " ")} UTC`;

  try {
    const rows = await getClicksForDigest(since, until);
    const totalClicks = rows.reduce((sum, r) => sum + Number(r.count), 0);

    const sent = await sendDailyDigest(
      rows.map(r => ({
        slug: r.slug,
        displayName: r.displayName,
        count: Number(r.count),
        lastClickAt: r.lastClickAt,
        totalMembers: r.totalMembers,
        priceAmountCents: r.priceAmountCents,
        priceInterval: r.priceInterval,
        language: r.language,
      })),
      windowLabel,
    );

    console.log(`[DigestJob] Sent digest for ${totalClicks} clicks (${windowLabel}): ${sent ? "OK" : "FAILED"}`);
    return { ok: true, clicks: totalClicks, sent };
  } catch (err) {
    console.error("[DigestJob] Failed:", err);
    return { ok: false, clicks: 0, sent: false };
  }
}
