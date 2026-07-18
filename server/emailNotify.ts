import { skoolCommunityUrl, SKOOL_SIGNUP_URL } from "../shared/appConfig";
import { serverConfig } from "./config";

/**
 * Click notification email via the Resend API.
 * RESEND_API_KEY and NOTIFICATION_EMAIL are server-side env vars, never exposed client-side.
 * Failures are logged and swallowed: a broken email must never block the redirect.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface ClickNotification {
  slug: string;
  displayName: string;
  referrer: string | null;
  timestamp: Date;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildClickEmail(click: ClickNotification) {
  const skoolUrl = click.slug === "signup" ? SKOOL_SIGNUP_URL : skoolCommunityUrl(click.slug);
  const name = escapeHtml(click.displayName);
  const referrer = click.referrer ? escapeHtml(click.referrer) : "(direct / unknown)";
  const ts = click.timestamp.toISOString();
  return {
    subject: `TrustSkool click: ${click.displayName}`,
    html: `
      <div style="font-family:Roboto,Arial,sans-serif;color:#202124;max-width:560px">
        <h2 style="margin:0 0 12px">Outbound click tracked</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:6px 12px 6px 0;color:#909090">Community</td><td style="padding:6px 0"><strong>${name}</strong></td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#909090">Slug</td><td style="padding:6px 0">${escapeHtml(click.slug)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#909090">Timestamp</td><td style="padding:6px 0">${ts}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#909090">Referrer</td><td style="padding:6px 0">${referrer}</td></tr>
        </table>
        <p style="margin:16px 0 0">
          <a href="${skoolUrl}" style="color:#202124">Open on Skool</a>
        </p>
      </div>
    `.trim(),
    text: `Outbound click tracked\nCommunity: ${click.displayName}\nSlug: ${click.slug}\nTimestamp: ${ts}\nReferrer: ${referrer}\nSkool page: ${skoolUrl}`,
  };
}

export async function sendClickNotification(click: ClickNotification): Promise<boolean> {
  const apiKey = serverConfig.resendApiKey;
  const to = serverConfig.notificationEmail;
  if (!apiKey || !to) {
    console.warn("[EmailNotify] RESEND_API_KEY or NOTIFICATION_EMAIL missing, skipping email");
    return false;
  }

  const email = buildClickEmail(click);
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // trustskool.com is added on Resend but still pending verification; until it
        // verifies, we send from an already-verified domain on the same account so
        // notifications can reach any recipient. Override with EMAIL_FROM once ready.
        from: process.env.EMAIL_FROM || "TrustSkool <trustskool@alexandrubirleanu.it>",
        to: [to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[EmailNotify] Resend returned ${res.status}: ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[EmailNotify] Failed to send:", err);
    return false;
  }
}
