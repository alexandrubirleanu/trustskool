import { skoolCommunityUrl, SKOOL_SIGNUP_URL } from "../shared/appConfig";
import { serverConfig } from "./config";

/**
 * Click notification emails via the Resend API.
 *
 * Tier A — real-time: fired on every /go/:slug click for high-value communities
 *   (paid AND afl_percent > 0). Includes commission estimate.
 * Tier B — daily digest: fired once at 09:00 UTC via Heartbeat cron, summarising
 *   all clicks from the previous 24-hour window.
 *
 * Failures are logged and swallowed: a broken email must never block the redirect.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// ─── Shared types ────────────────────────────────────────────────────────────

export interface ClickNotification {
  slug: string;
  displayName: string;
  referrer: string | null;
  timestamp: Date;
  totalMembers?: number | null;
  priceAmountCents?: number | null;
  priceInterval?: string | null;
  language?: string | null;
  clickCount?: number;
  /** Affiliate commission percentage (0-100). Present when owner profile is known. */
  aflPercent?: number | null;
  /**
   * Whether the site owner has already joined this community.
   * When true, the affiliate revenue stream is already active — downgrade to digest.
   */
  ownerJoined?: boolean | null;
}

export interface DigestRow {
  slug: string;
  displayName: string;
  count: number;
  lastClickAt: string;
  totalMembers?: number | null;
  priceAmountCents?: number | null;
  priceInterval?: string | null;
  language?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPrice(cents: number | null | undefined, interval: string | null | undefined): string {
  if (!cents || cents === 0) return "Free";
  const dollars = (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const period = interval === "year" ? "/year" : "/month";
  return `${dollars}${period}`;
}

function formatLanguage(lang: string | null | undefined): string {
  if (!lang) return "·";
  return lang.charAt(0).toUpperCase() + lang.slice(1);
}

/** Estimate commission from a single click: price × afl_percent / 100 (monthly). */
function estimateCommission(cents: number | null | undefined, aflPercent: number | null | undefined): string | null {
  if (!cents || cents === 0 || !aflPercent || aflPercent <= 0) return null;
  const monthly = (cents / 100) * (aflPercent / 100);
  return monthly.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

const tdLabel = `style="padding:10px 16px 10px 0;color:#909090;white-space:nowrap"`;
const tdValue = `style="padding:10px 0"`;
const trBorder = `style="border-bottom:1px solid #E4E4E4"`;

// ─── Tier A: real-time click email ───────────────────────────────────────────

export function buildClickEmail(click: ClickNotification) {
  const skoolUrl = click.slug === "signup" ? SKOOL_SIGNUP_URL : skoolCommunityUrl(click.slug);
  const name = escapeHtml(click.displayName);
  const referrer = click.referrer ? escapeHtml(click.referrer) : "(direct / unknown)";
  const ts = click.timestamp.toISOString();
  const members = click.totalMembers != null ? click.totalMembers.toLocaleString("en-US") : "·";
  const price = formatPrice(click.priceAmountCents, click.priceInterval);
  const language = formatLanguage(click.language);
  const clickCount = click.clickCount != null ? String(click.clickCount) : "·";
  const commission = estimateCommission(click.priceAmountCents, click.aflPercent);

  const commissionRow = commission
    ? `<tr ${trBorder}><td ${tdLabel}>Est. commission</td><td ${tdValue}><strong style="color:#1a7f4b">${commission}/mo</strong> (${click.aflPercent}% afl)</td></tr>`
    : "";

  return {
    subject: `[TrustSkool] Click: ${click.displayName}${commission ? ` (+${commission})` : ""}`,
    html: `
      <div style="font-family:Roboto,Arial,sans-serif;color:#202124;max-width:560px;padding:24px">
        <p style="margin:0 0 4px;font-size:12px;color:#909090;text-transform:uppercase;letter-spacing:.08em">TrustSkool: Click Notification</p>
        <h2 style="margin:0 0 20px;font-size:20px;font-weight:700">Outbound click tracked</h2>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          <tr ${trBorder}><td ${tdLabel}>Community</td><td ${tdValue}><strong>${name}</strong></td></tr>
          <tr ${trBorder}><td ${tdLabel}>Members</td><td ${tdValue}>${members}</td></tr>
          <tr ${trBorder}><td ${tdLabel}>Price</td><td ${tdValue}>${price}</td></tr>
          ${commissionRow}
          <tr ${trBorder}><td ${tdLabel}>Language</td><td ${tdValue}>${language}</td></tr>
          <tr ${trBorder}><td ${tdLabel}>Clicks (this slug)</td><td ${tdValue}><strong>${clickCount}</strong></td></tr>
          <tr ${trBorder}><td ${tdLabel}>Timestamp (UTC)</td><td ${tdValue}>${ts}</td></tr>
          <tr><td ${tdLabel}>Referrer</td><td ${tdValue}>${referrer}</td></tr>
        </table>
        <p style="margin:24px 0 0">
          <a href="${skoolUrl}" style="display:inline-block;background:#202124;color:#fff;text-decoration:none;padding:10px 20px;border-radius:4px;font-size:14px;font-weight:600">Open community on Skool</a>
        </p>
        <p style="margin:32px 0 0;font-size:12px;color:#909090;border-top:1px solid #E4E4E4;padding-top:16px">
          Automated notification from <a href="https://trustskool.com" style="color:#909090">TrustSkool</a>.
        </p>
      </div>
    `.trim(),
    text: [
      "[TrustSkool] Outbound click tracked",
      "",
      `Community  : ${click.displayName}`,
      `Members    : ${members}`,
      `Price      : ${price}`,
      commission ? `Commission : ${commission}/mo (${click.aflPercent}% afl)` : "",
      `Language   : ${language}`,
      `Clicks     : ${clickCount}`,
      `Timestamp  : ${ts}`,
      `Referrer   : ${referrer}`,
      `Skool URL  : ${skoolUrl}`,
      "",
      "Automated notification from TrustSkool (https://trustskool.com).",
    ]
      .filter(l => l !== "")
      .join("\n"),
  };
}

/**
 * Tier A gate: only send real-time email for paid communities with a known
 * affiliate commission. Free communities and unknown-commission communities
 * are batched into the daily digest instead.
 */
export function shouldSendTierA(click: ClickNotification): boolean {
  if (click.slug === "signup") return true; // always notify on signup clicks
  const isPaid = click.priceAmountCents != null && click.priceAmountCents > 0;
  const hasCommission = click.aflPercent != null && click.aflPercent > 0;
  // If the owner has already joined, the revenue stream is active — no need for
  // a per-click alert. Downgrade to the daily digest instead.
  const notYetJoined = !click.ownerJoined;
  return isPaid && hasCommission && notYetJoined;
}

// ─── Tier B: daily digest email ──────────────────────────────────────────────

export function buildDigestEmail(rows: DigestRow[], windowLabel: string) {
  const totalClicks = rows.reduce((sum, r) => sum + Number(r.count), 0);

  const tableRows = rows
    .slice(0, 30) // cap at 30 rows to keep email readable
    .map(r => {
      const name = escapeHtml(r.displayName);
      const price = formatPrice(r.priceAmountCents, r.priceInterval);
      const members = r.totalMembers != null ? r.totalMembers.toLocaleString("en-US") : "·";
      const skoolUrl = r.slug === "signup" ? SKOOL_SIGNUP_URL : skoolCommunityUrl(r.slug);
      return `
        <tr style="border-bottom:1px solid #E4E4E4">
          <td style="padding:8px 12px 8px 0"><a href="${skoolUrl}" style="color:#202124;font-weight:600;text-decoration:none">${name}</a></td>
          <td style="padding:8px 12px;text-align:center"><strong>${Number(r.count)}</strong></td>
          <td style="padding:8px 0;color:#909090">${price}</td>
          <td style="padding:8px 0;color:#909090">${members}</td>
        </tr>`;
    })
    .join("");

  const moreNote = rows.length > 30
    ? `<p style="margin:8px 0 0;font-size:12px;color:#909090">+ ${rows.length - 30} more communities. View full log at <a href="https://trustskool.com/admin/clicks" style="color:#909090">admin/clicks</a>.</p>`
    : "";

  return {
    subject: `[TrustSkool] Daily digest: ${totalClicks} click${totalClicks !== 1 ? "s" : ""} (${windowLabel})`,
    html: `
      <div style="font-family:Roboto,Arial,sans-serif;color:#202124;max-width:600px;padding:24px">
        <p style="margin:0 0 4px;font-size:12px;color:#909090;text-transform:uppercase;letter-spacing:.08em">TrustSkool: Daily Digest</p>
        <h2 style="margin:0 0 4px;font-size:20px;font-weight:700">${totalClicks} outbound click${totalClicks !== 1 ? "s" : ""}</h2>
        <p style="margin:0 0 20px;font-size:13px;color:#909090">${windowLabel}</p>
        ${rows.length === 0
          ? `<p style="color:#909090;font-size:14px">No clicks tracked in this window.</p>`
          : `
        <table style="border-collapse:collapse;width:100%;font-size:13px">
          <thead>
            <tr style="border-bottom:2px solid #202124">
              <th style="padding:6px 12px 6px 0;text-align:left;font-weight:600">Community</th>
              <th style="padding:6px 12px;text-align:center;font-weight:600">Clicks</th>
              <th style="padding:6px 0;text-align:left;font-weight:600">Price</th>
              <th style="padding:6px 0;text-align:left;font-weight:600">Members</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        ${moreNote}
        `}
        <p style="margin:24px 0 0">
          <a href="https://trustskool.com/admin/clicks" style="display:inline-block;background:#202124;color:#fff;text-decoration:none;padding:10px 20px;border-radius:4px;font-size:14px;font-weight:600">View full click log</a>
        </p>
        <p style="margin:32px 0 0;font-size:12px;color:#909090;border-top:1px solid #E4E4E4;padding-top:16px">
          Automated daily digest from <a href="https://trustskool.com" style="color:#909090">TrustSkool</a>.
        </p>
      </div>
    `.trim(),
    text: [
      `[TrustSkool] Daily digest: ${totalClicks} clicks (${windowLabel})`,
      "",
      ...rows.slice(0, 30).map(r => `${r.displayName.padEnd(40)} ${String(r.count).padStart(4)} clicks  ${formatPrice(r.priceAmountCents, r.priceInterval)}`),
      rows.length > 30 ? `... and ${rows.length - 30} more` : "",
      "",
      "Full log: https://trustskool.com/admin/clicks",
    ]
      .filter(l => l !== "")
      .join("\n"),
  };
}

// ─── Send helpers ─────────────────────────────────────────────────────────────

async function sendEmail(payload: { subject: string; html: string; text: string }): Promise<boolean> {
  const apiKey = serverConfig.resendApiKey;
  const to = serverConfig.notificationEmail;
  if (!apiKey || !to) {
    console.warn("[EmailNotify] RESEND_API_KEY or NOTIFICATION_EMAIL missing, skipping email");
    return false;
  }
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
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
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

export async function sendClickNotification(click: ClickNotification): Promise<boolean> {
  if (!shouldSendTierA(click)) return false; // Tier B only — skip real-time
  const email = buildClickEmail(click);
  return sendEmail(email);
}

export async function sendDailyDigest(rows: DigestRow[], windowLabel: string): Promise<boolean> {
  const email = buildDigestEmail(rows, windowLabel);
  return sendEmail(email);
}

export interface SlaBreachRow {
  tier: string;
  slug: string;
  displayName: string;
  totalMembers: number;
  lastScrapedAt: Date | null;
  hoursOverdue: number;
}

export function buildSlaAlertEmail(breaches: SlaBreachRow[]): { subject: string; html: string; text: string } {
  const hotBreaches = breaches.filter(b => b.tier === "hot");
  const warmBreaches = breaches.filter(b => b.tier === "warm");
  const coldBreaches = breaches.filter(b => b.tier === "cold");

  const subject = `⚠️ TrustSkool SLA breach: ${breaches.length} communities overdue (${hotBreaches.length} hot)`;

  const tierSection = (label: string, rows: SlaBreachRow[]) => {
    if (rows.length === 0) return "";
    const items = rows
      .slice(0, 20)
      .map(r => `  • ${r.displayName} (${r.totalMembers.toLocaleString()} members): ${r.hoursOverdue}h overdue`)
      .join("\n");
    return `\n${label} tier (${rows.length}):\n${items}\n`;
  };

  const body = [
    `TrustSkool pipeline SLA breach detected at ${new Date().toUTCString()}.`,
    "",
    `Total overdue: ${breaches.length} communities`,
    tierSection("🔴 HOT", hotBreaches),
    tierSection("🟡 WARM", warmBreaches),
    tierSection("🔵 COLD", coldBreaches),
    "",
    "Action required: check the GitHub Actions pipeline and re-run the affected tier jobs.",
    "",
    "SLA targets:",
    "  hot  → refresh every 24-48h (alert after 72h)",
    "  warm → refresh every 7-14d  (alert after 21d)",
    "  cold → refresh every 30-45d (alert after 60d)",
  ].join("\n");

  const html = `<pre style="font-family:monospace;font-size:13px">${body.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</pre>`;
  return { subject, html, text: body };
}

export async function sendSlaAlertEmail(breaches: SlaBreachRow[]): Promise<boolean> {
  if (breaches.length === 0) return false;
  const email = buildSlaAlertEmail(breaches);
  return sendEmail(email);
}

// ---------------------------------------------------------------------------
// Fraud report notification (sent to owner's personal email)
// ---------------------------------------------------------------------------

export interface FraudReportEmailData {
  communityRef: string;
  reporterEmail: string;
  description: string;
  evidence?: string | null;
  reportId: number;
}

function buildFraudReportEmail(data: FraudReportEmailData): { subject: string; html: string; text: string } {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const subject = `[TrustSkool] Fraud report #${data.reportId}: ${data.communityRef.slice(0, 60)}`;
  const evidenceRow = data.evidence
    ? `<tr><td style="padding:10px 12px;background:#f5f5f5;font-weight:600;vertical-align:top">Evidence</td><td style="padding:10px 12px;white-space:pre-wrap">${esc(data.evidence)}</td></tr>`
    : "";
  const html = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
    <img src="https://trustskool.com/manus-storage/trustskool-icon-only_a356506a.png" alt="TrustSkool" width="32" height="32" style="border-radius:4px" />
    <span style="font-size:18px;font-weight:700;color:#111">TrustSkool</span>
  </div>
  <h2 style="font-size:20px;font-weight:700;margin:0 0 4px">New fraud report received</h2>
  <p style="font-size:13px;color:#666;margin:0 0 24px">Report #${data.reportId}</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:10px 12px;background:#f5f5f5;font-weight:600;width:140px;vertical-align:top">Community</td><td style="padding:10px 12px;border-bottom:1px solid #eee">${esc(data.communityRef)}</td></tr>
    <tr><td style="padding:10px 12px;background:#f5f5f5;font-weight:600;vertical-align:top">Reporter</td><td style="padding:10px 12px;border-bottom:1px solid #eee"><a href="mailto:${esc(data.reporterEmail)}" style="color:#b8860b">${esc(data.reporterEmail)}</a></td></tr>
    <tr><td style="padding:10px 12px;background:#f5f5f5;font-weight:600;vertical-align:top">Description</td><td style="padding:10px 12px;border-bottom:1px solid #eee;white-space:pre-wrap">${esc(data.description)}</td></tr>
    ${evidenceRow}
  </table>
  <p style="margin-top:24px;font-size:13px;color:#888">Reply directly to this email to contact the reporter. <a href="https://trustskool.com/admin/clicks" style="color:#b8860b">Open admin panel</a>.</p>
</div>`.trim();
  const text = [
    `[TrustSkool] Fraud report #${data.reportId}: ${data.communityRef}`,
    ``,
    `Community : ${data.communityRef}`,
    `Reporter  : ${data.reporterEmail}`,
    ``,
    `Description:`,
    data.description,
    data.evidence ? `\nEvidence:\n${data.evidence}` : "",
  ].join("\n");
  return { subject, html, text };
}

export async function sendFraudReportEmail(data: FraudReportEmailData): Promise<boolean> {
  const to = serverConfig.fraudReportEmail;
  const apiKey = serverConfig.resendApiKey;
  if (!to || !apiKey) {
    console.warn("[EmailNotify] FRAUD_REPORT_EMAIL or RESEND_API_KEY missing, skipping fraud report email");
    return false;
  }
  const email = buildFraudReportEmail(data);
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: serverConfig.emailFrom,
        to: [to],
        reply_to: data.reporterEmail,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[EmailNotify] Fraud report email failed: ${res.status} ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[EmailNotify] Fraud report email error:", err);
    return false;
  }
}
