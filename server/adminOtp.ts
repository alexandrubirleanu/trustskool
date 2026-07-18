/**
 * Admin OTP authentication helpers.
 *
 * Flow:
 *   1. requestOtp(email) — validates allowlist, generates 6-digit code,
 *      stores SHA-256 hash in adminOtps table, sends code via Resend.
 *   2. verifyOtp(email, code) — looks up the latest unused/unexpired OTP
 *      for the email, compares hash, marks as used, returns true on match.
 *
 * Session: after verifyOtp succeeds, the caller signs a short-lived JWT
 * (ADMIN_OTP_COOKIE_NAME, 30 min) and sets it as an httpOnly cookie.
 * The adminOtpProcedure middleware verifies that cookie on every admin tRPC call.
 */

import { createHash, randomInt } from "crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { adminOtps, type AdminOtp } from "../drizzle/schema";
import { serverConfig } from "./config";

// ─── Allowlist ────────────────────────────────────────────────────────────────

export const ADMIN_EMAIL_ALLOWLIST = new Set([
  "alexbirle97@gmail.com",
  "alexbirle@hey.com",
]);

export const ADMIN_OTP_COOKIE_NAME = "admin_otp_session";
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_ENDPOINT = "https://api.resend.com/emails";

// ─── Crypto helpers ───────────────────────────────────────────────────────────

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function generateCode(): string {
  // 6-digit zero-padded
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

export async function createOtp(email: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db.insert(adminOtps).values({ email, codeHash, expiresAt });
  return code;
}

export async function consumeOtp(email: string, code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const now = new Date();
  const rows: AdminOtp[] = await db
    .select()
    .from(adminOtps)
    .where(
      and(
        eq(adminOtps.email, email),
        gt(adminOtps.expiresAt, now),
        isNull(adminOtps.usedAt),
      ),
    )
    .orderBy(desc(adminOtps.createdAt))
    .limit(5);

  const match = rows.find(r => r.codeHash === hashCode(code));
  if (!match) return false;

  // Mark as used
  await db
    .update(adminOtps)
    .set({ usedAt: now })
    .where(eq(adminOtps.id, match.id));

  return true;
}

// ─── Email ────────────────────────────────────────────────────────────────────

export async function sendOtpEmail(email: string, code: string): Promise<boolean> {
  const apiKey = serverConfig.resendApiKey;
  if (!apiKey) {
    console.warn("[AdminOtp] RESEND_API_KEY missing, skipping OTP email");
    return false;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8F7F5;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #E4E4E4;border-radius:8px;padding:40px 32px">
        <tr><td>
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#909090">TrustSkool Admin</p>
          <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#1a1a1a">Your one-time code</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#444">Use this code to access the admin panel. It expires in <strong>10 minutes</strong>.</p>
          <div style="background:#F8F7F5;border:1px solid #E4E4E4;border-radius:6px;padding:20px 24px;text-align:center;margin:0 0 24px">
            <span style="font-size:36px;font-weight:700;letter-spacing:.25em;color:#1a1a1a;font-variant-numeric:tabular-nums">${code}</span>
          </div>
          <p style="margin:0;font-size:13px;color:#909090">If you did not request this code, ignore this email. Do not share it with anyone.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `TrustSkool Admin — your one-time code: ${code}\n\nExpires in 10 minutes. Do not share it.`;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: serverConfig.emailFrom,
        to: [email],
        subject: `${code} is your TrustSkool admin code`,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[AdminOtp] Resend returned ${res.status}: ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[AdminOtp] Failed to send OTP email:", err);
    return false;
  }
}
