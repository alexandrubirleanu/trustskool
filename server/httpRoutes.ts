import type { Express, Request, Response } from "express";
import { skoolCommunityUrl, SKOOL_SIGNUP_URL } from "../shared/appConfig";
import { getCommunityBySlug, getClickCountForSlug, insertClick } from "./dbCommunities";
import { sendClickNotification } from "./emailNotify";
import { runIngestion } from "./ingestion";
import { sdk } from "./_core/sdk";

/**
 * Non-tRPC HTTP routes:
 * - GET /go/signup and /go/:slug — click-tracking 302 redirects to Skool with affiliate ref
 * - POST /api/scheduled/ingest — Heartbeat cron callback for daily data ingestion
 *
 * Click logging and the notification email both happen BEFORE the redirect
 * (the email is bounded by a short timeout so the visitor is never stuck).
 */

const SLUG_RE = /^[a-z0-9][a-z0-9-_]{0,190}$/i;

/** Steps 1-2 (log + email) must complete before the 302; the email is capped at 3s. */
async function sendNotificationWithTimeout(
  click: Parameters<typeof sendClickNotification>[0],
  timeoutMs = 3000,
) {
  try {
    await Promise.race([
      sendClickNotification(click),
      new Promise<void>(resolve => setTimeout(resolve, timeoutMs)),
    ]);
  } catch (err) {
    console.error("[Go] Notification failed:", err);
  }
}

async function handleGoRedirect(req: Request, res: Response) {
  const rawSlug = String(req.params.slug ?? "").trim();
  const referrer = req.get("referer") ?? null;
  const timestamp = new Date();

  if (rawSlug === "signup") {
    try {
      await insertClick({ slug: "signup", displayName: "Skool signup", referrer });
    } catch (err) {
      console.error("[Go] Failed to log signup click:", err);
    }
    await sendNotificationWithTimeout({ slug: "signup", displayName: "Skool signup", referrer, timestamp });
    return res.redirect(302, SKOOL_SIGNUP_URL);
  }

  if (!SLUG_RE.test(rawSlug)) {
    return res.redirect(302, "/");
  }

  const community = await getCommunityBySlug(rawSlug).catch(() => undefined);
  const displayName = community?.displayName ?? rawSlug;

  // 1. Log the click BEFORE redirecting
  try {
    await insertClick({ slug: rawSlug, displayName, referrer });
  } catch (err) {
    console.error("[Go] Failed to log click:", err);
  }

  // 2. Fetch running click count for this slug (includes the click just inserted)
  const clickCount = await getClickCountForSlug(rawSlug).catch(() => 0);

  // 3. Send the notification email BEFORE redirecting (bounded so a slow
  //    email provider cannot hold the visitor hostage)
  await sendNotificationWithTimeout({
    slug: rawSlug,
    displayName,
    referrer,
    timestamp,
    totalMembers: community?.totalMembers ?? null,
    priceAmountCents: community?.priceAmountCents ?? null,
    priceInterval: community?.priceInterval ?? null,
    language: community?.language ?? null,
    clickCount,
  });

  // 4. 302 redirect to Skool with the affiliate ref
  return res.redirect(302, skoolCommunityUrl(rawSlug));
}

async function handleScheduledIngest(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }
    const result = await runIngestion();
    return res.json({
      ok: result.ok,
      source: result.source,
      total: result.total,
      upserted: result.upserted,
      skipped: result.skipped,
      errors: result.errors,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[ScheduledIngest] Failed:", error);
    return res.status(500).json({
      error,
      stack,
      context: { url: req.originalUrl },
      timestamp: new Date().toISOString(),
    });
  }
}

export function registerHttpRoutes(app: Express) {
  app.get("/go/:slug", (req, res) => {
    void handleGoRedirect(req, res);
  });
  app.post("/api/scheduled/ingest", (req, res) => {
    void handleScheduledIngest(req, res);
  });
}
