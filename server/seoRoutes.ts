import type { Express, Request, Response } from "express";
import { BRAND_NAME, SCORE_NAME } from "../shared/appConfig";
import { getAllSlugsForSitemap, getTopCommunitiesForLlms } from "./dbCommunities";
import { listContentPagesByTypes } from "./dbContent";

/**
 * SEO plumbing served straight from Express (before the SSR catch-all):
 * - GET /sitemap.xml                — sitemap index (chunks + content)
 * - GET /sitemap-communities-N.xml  — community URL chunks (10k per file)
 * - GET /sitemap-content.xml        — all content pages
 * - GET /robots.txt                 — allow all, explicit AI crawler rules
 * - GET /llms.txt                   — rich plain-text guide for LLM crawlers
 * - GET /llms-full.txt              — machine-readable top-200 community dump
 */

const CHUNK_SIZE = 10_000;

const origin = () => process.env.CANONICAL_ORIGIN || "https://trustskool.com";

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function urlEntry(loc: string, opts: { lastmod?: string; changefreq?: string; priority?: string } = {}) {
  const parts = [`<loc>${loc}</loc>`];
  if (opts.lastmod) parts.push(`<lastmod>${opts.lastmod}</lastmod>`);
  if (opts.changefreq) parts.push(`<changefreq>${opts.changefreq}</changefreq>`);
  if (opts.priority) parts.push(`<priority>${opts.priority}</priority>`);
  return `<url>${parts.join("")}</url>`;
}

function sitemapDoc(urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
}

function sitemapIndexDoc(entries: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</sitemapindex>`;
}

/** GET /sitemap.xml — sitemap index listing all chunk sitemaps + content sitemap */
async function handleSitemapIndex(_req: Request, res: Response) {
  try {
    const base = origin();
    const rows = await getAllSlugsForSitemap();
    const chunkCount = Math.max(1, Math.ceil(rows.length / CHUNK_SIZE));
    const today = new Date().toISOString().slice(0, 10);

    const entries: string[] = [];
    for (let i = 1; i <= chunkCount; i++) {
      entries.push(`<sitemap><loc>${base}/sitemap-communities-${i}.xml</loc><lastmod>${today}</lastmod></sitemap>`);
    }
    entries.push(`<sitemap><loc>${base}/sitemap-content.xml</loc><lastmod>${today}</lastmod></sitemap>`);

    res
      .status(200)
      .set("Cache-Control", "public, max-age=3600")
      .type("application/xml")
      .send(sitemapIndexDoc(entries));
  } catch (err) {
    console.error("[Sitemap] Index failed:", err);
    res.status(500).type("text/plain").send("sitemap unavailable");
  }
}

/** GET /sitemap-communities-N.xml — Nth chunk of community URLs */
async function handleCommunitiesChunk(req: Request, res: Response) {
  try {
    const n = parseInt(String(req.params.n ?? "1"), 10);
    if (isNaN(n) || n < 1) return res.status(404).type("text/plain").send("not found");

    const base = origin();
    const rows = await getAllSlugsForSitemap();
    const today = new Date().toISOString().slice(0, 10);

    // Static pages only in chunk 1
    const staticUrls: string[] = n === 1 ? [
      urlEntry(`${base}/`, { lastmod: today, changefreq: "daily", priority: "1.0" }),
      urlEntry(`${base}/methodology`, { changefreq: "monthly", priority: "0.6" }),
      urlEntry(`${base}/faq`, { changefreq: "monthly", priority: "0.6" }),
      urlEntry(`${base}/resources`, { changefreq: "weekly", priority: "0.6" }),
      urlEntry(`${base}/news`, { changefreq: "daily", priority: "0.5" }),
    ] : [];

    const start = (n - 1) * CHUNK_SIZE;
    const chunk = rows.slice(start, start + CHUNK_SIZE);
    if (n > 1 && chunk.length === 0) return res.status(404).type("text/plain").send("not found");

    const communityUrls = chunk.map(r => {
      const lastmod = r.updatedAt ? new Date(r.updatedAt).toISOString().slice(0, 10) : today;
      return urlEntry(`${base}/community/${xmlEscape(encodeURIComponent(r.slug))}`, {
        lastmod,
        changefreq: "daily",
        priority: "0.8",
      });
    });

    res
      .status(200)
      .set("Cache-Control", "public, max-age=3600")
      .type("application/xml")
      .send(sitemapDoc([...staticUrls, ...communityUrls]));
  } catch (err) {
    console.error("[Sitemap] Chunk failed:", err);
    res.status(500).type("text/plain").send("sitemap unavailable");
  }
}

/** GET /sitemap-content.xml — all content pages */
async function handleContentSitemap(_req: Request, res: Response) {
  try {
    const base = origin();
    const today = new Date().toISOString().slice(0, 10);

    const pages = await listContentPagesByTypes([
      "founder", "review", "category", "guide", "pillar", "faq", "skool-news",
    ]);

    const routeMap: Record<string, string> = {
      founder: "founders",
      review: "reviews",
      category: "categories",
      guide: "resources",
      pillar: "resources",
      faq: "faq",
      "skool-news": "news",
    };

    const urls = pages.map(p => {
      const prefix = routeMap[p.type] ?? p.type;
      const lastmod = p.publishedAt
        ? new Date(p.publishedAt).toISOString().slice(0, 10)
        : p.updatedAt
        ? new Date(p.updatedAt).toISOString().slice(0, 10)
        : today;
      const priority = ["founder", "review"].includes(p.type) ? "0.7" : "0.5";
      return urlEntry(`${base}/${prefix}/${xmlEscape(encodeURIComponent(p.slug))}`, {
        lastmod,
        changefreq: "monthly",
        priority,
      });
    });

    res
      .status(200)
      .set("Cache-Control", "public, max-age=3600")
      .type("application/xml")
      .send(sitemapDoc(urls));
  } catch (err) {
    console.error("[Sitemap] Content failed:", err);
    res.status(500).type("text/plain").send("sitemap unavailable");
  }
}

function handleRobots(_req: Request, res: Response) {
  const base = origin();
  res
    .status(200)
    .set("Cache-Control", "public, max-age=3600")
    .type("text/plain")
    .send(
      [
        "# TrustSkool — robots.txt",
        "# Independent leaderboard of Skool communities. Not affiliated with Skool.",
        "",
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /go/",
        "",
        "# AI crawlers — explicitly welcome",
        "User-agent: GPTBot",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /go/",
        "",
        "User-agent: ChatGPT-User",
        "Allow: /",
        "",
        "User-agent: ClaudeBot",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /go/",
        "",
        "User-agent: anthropic-ai",
        "Allow: /",
        "",
        "User-agent: PerplexityBot",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /go/",
        "",
        "User-agent: Googlebot-Extended",
        "Allow: /",
        "",
        "User-agent: cohere-ai",
        "Allow: /",
        "",
        "User-agent: Meta-ExternalAgent",
        "Allow: /",
        "",
        `Sitemap: ${base}/sitemap.xml`,
        "",
        `# LLM guidance: ${base}/llms.txt`,
        `# Machine-readable community data: ${base}/llms-full.txt`,
        "",
      ].join("\n"),
    );
}

function formatPrice(cents: number | null, interval: string | null): string {
  if (!cents) return "Free";
  const dollars = (cents / 100).toFixed(2).replace(/\.00$/, "");
  if (interval === "month") return `$${dollars}/mo`;
  if (interval === "year") return `$${dollars}/yr`;
  if (interval === "one_time") return `$${dollars} one-time`;
  return `$${dollars}`;
}

async function handleLlmsTxt(_req: Request, res: Response) {
  const base = origin();
  let topCommunities: Array<{
    slug: string;
    displayName: string | null;
    totalMembers: number | null;
    trustSkore: number | null;
    priceAmountCents: number | null;
    priceInterval: string | null;
    language: string | null;
    category: string | null;
    description: string | null;
  }> = [];
  let totalCount = 0;

  try {
    const [slugRows, top] = await Promise.all([
      getAllSlugsForSitemap(),
      getTopCommunitiesForLlms(50),
    ]);
    totalCount = slugRows.length;
    topCommunities = top;
  } catch {
    // degrade gracefully
  }

  const today = new Date().toISOString().slice(0, 10);

  const communityLines = topCommunities.map(c => {
    const members = c.totalMembers
      ? c.totalMembers >= 1000
        ? `${(c.totalMembers / 1000).toFixed(1).replace(/\.0$/, "")}k members`
        : `${c.totalMembers} members`
      : "unknown members";
    const price = formatPrice(c.priceAmountCents, c.priceInterval);
    const score = c.trustSkore != null ? `TrustSkore ${c.trustSkore}/100` : "";
    const lang = c.language && c.language !== "english" ? ` · ${c.language}` : "";
    const cat = c.category ? ` · ${c.category}` : "";
    const parts = [members, price, score].filter(Boolean).join(" · ");
    return `- [${c.displayName ?? c.slug}](${base}/community/${encodeURIComponent(c.slug)}): ${parts}${lang}${cat}`;
  });

  res
    .status(200)
    .set("Cache-Control", "public, max-age=3600")
    .type("text/plain")
    .send(
      [
        `# ${BRAND_NAME}`,
        "",
        `> ${BRAND_NAME} is an independent leaderboard of Skool communities ranked by ${SCORE_NAME}, a composite trust score (0-100) computed from member growth momentum, Skool discovery-rank trajectory, and price stability. ${BRAND_NAME} is not affiliated with Skool.`,
        "",
        "## About",
        `${BRAND_NAME} tracks ${totalCount > 0 ? `${totalCount.toLocaleString()}+` : "thousands of"} Skool communities and scores each one algorithmically. The goal is to help people find communities worth joining before paying, using objective growth and stability signals rather than paid placements or editorial opinion.`,
        "",
        "## Data model",
        "Each community record contains:",
        "- displayName, slug, description",
        "- totalMembers (integer)",
        "- priceAmountCents, priceInterval (month/year/one_time/null for free)",
        "- language, category",
        "- trustSkore (0-100 composite)",
        "- scoreBreakdown: { growthMomentum, rankingMomentum, priceStability } (each 0-100)",
        "- memberHistory, rankHistory (time-series arrays for trend computation)",
        "- updateTier: hot (every 24-48h) / warm (7-14d) / cold (30-45d)",
        "",
        "## Score methodology",
        `${SCORE_NAME} = (growthMomentum × 0.45) + (rankingMomentum × 0.35) + (priceStability × 0.20)`,
        "- growthMomentum: rate of change in totalMembers over tracked history",
        "- rankingMomentum: improvement in Skool discovery rank over tracked history",
        "- priceStability: penalises frequent price increases",
        "- Bootstrap rule: communities with 2,000+ members and fewer than 3 tracked snapshots receive growthMomentum=80, rankingMomentum=75 as a temporary placeholder",
        `- Full methodology: ${base}/methodology`,
        "",
        "## Key pages",
        `- [Leaderboard](${base}/): searchable, filterable ranking of all tracked communities`,
        `- [Methodology](${base}/methodology): full score formula and weights`,
        `- [FAQ](${base}/faq): common questions about Skool and TrustSkool`,
        `- [Resources](${base}/resources): guides on evaluating and joining Skool communities`,
        `- [News](${base}/news): Skool platform updates and community trends`,
        `- [Fraud response policy](${base}/policy/fraud-response): how scam reports are handled`,
        "",
        "## Machine-readable data",
        `- Full community dump (top 200 by members): ${base}/llms-full.txt`,
        `- Sitemap index: ${base}/sitemap.xml`,
        `- Community sitemap: ${base}/sitemap-communities-1.xml`,
        `- Content sitemap: ${base}/sitemap-content.xml`,
        "",
        "## Update schedule",
        `- Hot communities (top 500 by rank): refreshed every 24-48 hours`,
        `- Warm communities (rank 500-3000): refreshed every 7-14 days`,
        `- Cold communities (rank 3000+): refreshed every 30-45 days`,
        `- This file last generated: ${today}`,
        "",
        "## Affiliate disclosure",
        "Some community links include an affiliate parameter. TrustSkool earns a commission if you join through a tracked link. Scores and rankings are never influenced by affiliate relationships.",
        "",
        `## Top 50 communities by member count (as of ${today})`,
        ...communityLines,
        "",
      ].join("\n"),
    );
}

async function handleLlmsFullTxt(_req: Request, res: Response) {
  const base = origin();
  let communities: Awaited<ReturnType<typeof getTopCommunitiesForLlms>> = [];
  try {
    communities = await getTopCommunitiesForLlms(200);
  } catch {
    return res.status(503).type("text/plain").send("data temporarily unavailable");
  }

  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    `# ${BRAND_NAME} — Full community data export`,
    `# Generated: ${today}`,
    `# Source: ${base}/llms-full.txt`,
    `# Format: slug | displayName | totalMembers | trustSkore | price | language | category`,
    `# TrustSkore: 0-100 composite (see ${base}/methodology)`,
    "",
  ];

  for (const c of communities) {
    const price = formatPrice(c.priceAmountCents, c.priceInterval);
    const score = c.trustSkore ?? "n/a";
    const lang = c.language ?? "unknown";
    const cat = c.category ?? "uncategorized";
    const name = (c.displayName ?? c.slug).replace(/\|/g, "-");
    const members = c.totalMembers ?? 0;
    lines.push(`${c.slug} | ${name} | ${members} | ${score} | ${price} | ${lang} | ${cat}`);
  }

  lines.push("");
  lines.push(`# End of export — ${communities.length} communities`);

  res
    .status(200)
    .set("Cache-Control", "public, max-age=3600")
    .type("text/plain")
    .send(lines.join("\n"));
}

export function registerSeoRoutes(app: Express) {
  app.get("/sitemap.xml", (req, res) => {
    void handleSitemapIndex(req, res);
  });
  app.get("/sitemap-communities-:n.xml", (req, res) => {
    void handleCommunitiesChunk(req, res);
  });
  app.get("/sitemap-content.xml", (req, res) => {
    void handleContentSitemap(req, res);
  });
  app.get("/robots.txt", handleRobots);
  app.get("/llms.txt", (req, res) => {
    void handleLlmsTxt(req, res);
  });
  app.get("/llms-full.txt", (req, res) => {
    void handleLlmsFullTxt(req, res);
  });
}
