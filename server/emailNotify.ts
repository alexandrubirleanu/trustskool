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
    subject: `[TrustSkool] Outbound click — ${click.displayName}`,
    html: `
      <div style="font-family:Roboto,Arial,sans-serif;color:#202124;max-width:560px;padding:24px">
        <p style="margin:0 0 4px;font-size:12px;color:#909090;text-transform:uppercase;letter-spacing:.08em">TrustSkool — Click Notification</p>
        <h2 style="margin:0 0 20px;font-size:20px;font-weight:700">Outbound click tracked</h2>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          <tr style="border-bottom:1px solid #E4E4E4">
            <td style="padding:10px 16px 10px 0;color:#909090;white-space:nowrap">Community</td>
            <td style="padding:10px 0"><strong>${name}</strong></td>
          </tr>
          <tr style="border-bottom:1px solid #E4E4E4">
            <td style="padding:10px 16px 10px 0;color:#909090;white-space:nowrap">Slug</td>
            <td style="padding:10px 0">${escapeHtml(click.slug)}</td>
          </tr>
          <tr style="border-bottom:1px solid #E4E4E4">
            <td style="padding:10px 16px 10px 0;color:#909090;white-space:nowrap">Timestamp (UTC)</td>
            <td style="padding:10px 0">${ts}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px 10px 0;color:#909090;white-space:nowrap">Referrer</td>
            <td style="padding:10px 0">${referrer}</td>
          </tr>
        </table>
        <p style="margin:24px 0 0">
          <a href="${skoolUrl}" style="display:inline-block;background:#202124;color:#fff;text-decoration:none;padding:10px 20px;border-radius:4px;font-size:14px;font-weight:600">Open community on Skool</a>
        </p>
        <p style="margin:32px 0 0;font-size:12px;color:#909090;border-top:1px solid #E4E4E4;padding-top:16px">
          This is an automated notification from <a href="https://trustskool.com" style="color:#909090">TrustSkool</a>.
          You are receiving this because you are the site owner.
        </p>
      </div>
    `.trim(),
    text: [
      "[TrustSkool] Outbound click tracked",
      "",
      `Community : ${click.displayName}`,
      `Slug      : ${click.slug}`,
      `Timestamp : ${ts}`,
      `Referrer  : ${referrer}`,
      `Skool URL : ${skoolUrl}`,
      "",
      "This is an automated notification from TrustSkool (https://trustskool.com).",
    ].join("\n"),
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
        from: serverConfig.emailFrom,
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
