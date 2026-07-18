/**
 * OG Image generator for community detail pages.
 * Produces a 1200x630 PNG branded with TrustSkool identity,
 * community name, TrustSkore badge, member count, and price.
 *
 * GET /api/og/community/:slug
 * Cache-Control: public, max-age=86400 (1 day)
 */
import type { Request, Response } from "express";
import { createCanvas, loadImage, type Canvas, type SKRSContext2D } from "@napi-rs/canvas";
import { getCommunityBySlug } from "./dbCommunities";

const W = 1200;
const H = 630;

// Brand palette
const BG_COLOR = "#F8F7F5";
const CARD_COLOR = "#FFFFFF";
const ACCENT_COLOR = "#F8D481"; // TrustSkool yellow
const TEXT_DARK = "#202124";
const TEXT_MID = "#5F6368";
const TEXT_LIGHT = "#9AA0A6";
const SCORE_BG = "#FFF3CD";
const SCORE_TEXT = "#856404";

function scoreColor(score: number): { bg: string; text: string } {
  const s = score / 10; // 0-10
  if (s >= 7.5) return { bg: "#D1FAE5", text: "#065F46" }; // green
  if (s >= 5.0) return { bg: "#FFF3CD", text: "#856404" }; // yellow
  return { bg: "#FEE2E2", text: "#991B1B" }; // red
}

function formatPrice(cents: number | null | undefined, currency: string | null | undefined, interval: string | null | undefined): string {
  if (!cents || cents === 0) return "Free";
  const amount = (cents / 100).toFixed(0);
  const curr = (currency ?? "USD").toUpperCase();
  const sym = curr === "USD" ? "$" : curr === "EUR" ? "\u20ac" : curr === "GBP" ? "\u00a3" : `${curr} `;
  // Skool dataset uses 'month' for monthly, 'year' for annual
  const intv = interval === "month" || interval === "monthly" ? "/mo" : interval === "year" || interval === "yearly" ? "/yr" : "";
  return `${sym}${amount}${intv}`;
}

function formatMembers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function roundRect(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBadge(ctx: SKRSContext2D, label: string, value: string, x: number, y: number, w: number, h: number, colors: { bg: string; text: string }) {
  ctx.fillStyle = colors.bg;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = colors.text;
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(value, x + w / 2, y + h / 2 + 4);
  ctx.font = "13px sans-serif";
  ctx.fillStyle = TEXT_MID;
  ctx.fillText(label, x + w / 2, y + h / 2 + 22);
}

function truncate(ctx: SKRSContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

async function generateOgImage(slug: string): Promise<Buffer | null> {
  const community = await getCommunityBySlug(slug);
  if (!community) return null;

  const canvas: Canvas = createCanvas(W, H);
  const ctx: SKRSContext2D = canvas.getContext("2d");

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, W, H);

  // Accent bar at top
  ctx.fillStyle = ACCENT_COLOR;
  ctx.fillRect(0, 0, W, 8);

  // Card
  ctx.fillStyle = CARD_COLOR;
  roundRect(ctx, 60, 60, W - 120, H - 120, 16);
  ctx.shadowColor = "rgba(0,0,0,0.08)";
  ctx.shadowBlur = 24;
  ctx.fill();
  ctx.shadowBlur = 0;

  const cardX = 60;
  const cardY = 60;
  const cardW = W - 120;
  const cardH = H - 120;

  // Logo (left side)
  const logoSize = 100;
  const logoX = cardX + 48;
  const logoY = cardY + 48;

  if (community.logoUrl) {
    try {
      const img = await loadImage(community.logoUrl);
      ctx.save();
      roundRect(ctx, logoX, logoY, logoSize, logoSize, 12);
      ctx.clip();
      ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
      ctx.restore();
    } catch {
      // fallback: colored circle
      ctx.fillStyle = ACCENT_COLOR;
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = TEXT_DARK;
      ctx.font = "bold 40px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((community.displayName ?? "?").charAt(0).toUpperCase(), logoX + logoSize / 2, logoY + logoSize / 2);
      ctx.textBaseline = "alphabetic";
    }
  }

  // Community name
  const nameX = logoX + logoSize + 32;
  const nameMaxW = cardW - logoSize - 32 - 48 - 200; // leave space for score badge
  ctx.fillStyle = TEXT_DARK;
  ctx.font = "bold 42px sans-serif";
  ctx.textAlign = "left";
  const name = truncate(ctx, community.displayName ?? slug, nameMaxW);
  ctx.fillText(name, nameX, logoY + 52);

  // Category + language chips
  let chipX = nameX;
  const chipY = logoY + 70;
  const chipH = 28;
  const chipPad = 16;

  const chips = [community.category, community.language].filter(Boolean) as string[];
  for (const chip of chips.slice(0, 2)) {
    const label = chip.charAt(0).toUpperCase() + chip.slice(1);
    ctx.font = "13px sans-serif";
    const chipW = ctx.measureText(label).width + chipPad * 2;
    ctx.fillStyle = "#F1F3F4";
    roundRect(ctx, chipX, chipY, chipW, chipH, 14);
    ctx.fill();
    ctx.fillStyle = TEXT_MID;
    ctx.textAlign = "center";
    ctx.fillText(label, chipX + chipW / 2, chipY + 18);
    chipX += chipW + 10;
  }

  // Description
  const descY = logoY + logoSize + 32;
  const descMaxW = cardW - 96;
  ctx.fillStyle = TEXT_MID;
  ctx.font = "20px sans-serif";
  ctx.textAlign = "left";
  const rawDesc = community.description?.trim() ?? "";
  const desc = truncate(ctx, rawDesc, descMaxW);
  ctx.fillText(desc, cardX + 48, descY);

  // Stat badges row — vertically centered in remaining space
  const badgeW = 160;
  const badgeH = 64;
  const remainingSpace = cardY + cardH - 48 - (descY + 20);
  const badgeY = descY + 20 + Math.max(20, (remainingSpace - badgeH) / 2);
  const badgeGap = 20;
  const badgeStartX = cardX + 48;

  // TrustSkore badge
  const score = community.trustSkore ?? 0;
  const scoreDisplay = (score / 10).toFixed(1);
  const scoreColors = scoreColor(score);
  drawBadge(ctx, "TrustSkore", scoreDisplay + " / 10", badgeStartX, badgeY, badgeW, badgeH, scoreColors);

  // Members badge
  drawBadge(ctx, "Members", formatMembers(community.totalMembers ?? 0), badgeStartX + badgeW + badgeGap, badgeY, badgeW, badgeH, { bg: "#EFF6FF", text: "#1E40AF" });

  // Price badge
  const priceStr = formatPrice(community.priceAmountCents, community.priceCurrency, community.priceInterval);
  drawBadge(ctx, "Price", priceStr, badgeStartX + (badgeW + badgeGap) * 2, badgeY, badgeW, badgeH, { bg: "#F0FDF4", text: "#166534" });

  // TrustSkool branding (bottom right)
  ctx.fillStyle = TEXT_LIGHT;
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("trustskool.com", cardX + cardW - 48, cardY + cardH - 32);

  // Star emoji + brand name (bottom right)
  ctx.font = "18px sans-serif";
  ctx.fillStyle = TEXT_MID;
  ctx.fillText("Skool community trust ratings", cardX + cardW - 48, cardY + cardH - 54);

  return canvas.toBuffer("image/png");
}

export async function handleOgImage(req: Request, res: Response) {
  try {
    const slug = req.params.slug ?? "";
    if (!slug) return res.status(400).type("text/plain").send("missing slug");

    const png = await generateOgImage(slug);
    if (!png) return res.status(404).type("text/plain").send("community not found");

    res
      .status(200)
      .set("Content-Type", "image/png")
      .set("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600")
      .send(png);
  } catch (err) {
    console.error("[OG Image] Failed:", err);
    res.status(500).type("text/plain").send("og image unavailable");
  }
}
