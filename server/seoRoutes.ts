import type { Express, Request, Response } from "express";
import { BRAND_NAME, SCORE_NAME, SKOOL_CATEGORIES } from "../shared/appConfig";
import { getAllSlugsForSitemap, getTopCommunitiesForLlms } from "./dbCommunities";
import { listContentPagesByTypes } from "./dbContent";
import { handleOgImage } from "./ogImage";

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
      urlEntry(`${base}/rankings`, { changefreq: "monthly", priority: "0.7" }),
      // Category-filtered homepage pages (high SEO value — contextual OG + canonical)
      ...SKOOL_CATEGORIES.map(cat =>
        urlEntry(`${base}/?category=${cat.slug}`, { lastmod: today, changefreq: "daily", priority: "0.85" })
      ),
      // Price-filtered pages
      urlEntry(`${base}/?price=free`, { lastmod: today, changefreq: "daily", priority: "0.8" }),
      urlEntry(`${base}/?price=paid`, { lastmod: today, changefreq: "daily", priority: "0.7" }),
      // Category rankings sub-pages
      ...SKOOL_CATEGORIES.map(cat =>
        urlEntry(`${base}/rankings/${cat.slug}`, { changefreq: "monthly", priority: "0.7", lastmod: today })
      ),
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

/** Annotate a community with an editorial one-liner based on its data signals */
function editorialNote(c: {
  totalMembers: number | null;
  priceAmountCents: number | null;
  priceInterval: string | null;
  category: string | null;
  language: string | null;
  description: string | null;
}): string {
  const isFree = !c.priceAmountCents;
  const isLarge = (c.totalMembers ?? 0) >= 10_000;
  const isMedium = (c.totalMembers ?? 0) >= 2_000;
  const cat = (c.category ?? "").toLowerCase();
  const desc = (c.description ?? "").slice(0, 120).replace(/\n/g, " ").trim();

  if (desc.length > 30) return desc;
  if (isLarge && isFree) return `One of the largest free communities on Skool with over ${Math.round((c.totalMembers ?? 0) / 1000)}k members.`;
  if (isLarge) return `Paid community with ${Math.round((c.totalMembers ?? 0) / 1000)}k+ members, indicating sustained retention.`;
  if (isMedium && isFree) return `Free community with a substantial audience in the ${cat || "general"} space.`;
  if (isMedium) return `Mid-size paid community in the ${cat || "general"} niche.`;
  return "";
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

  // Separate English top-10 for a featured section
  const englishTop = topCommunities.filter(c => !c.language || c.language === "english").slice(0, 10);
  const freeTop = topCommunities.filter(c => !c.priceAmountCents).slice(0, 10);

  const communityLine = (c: typeof topCommunities[0], withNote = false) => {
    const members = c.totalMembers
      ? c.totalMembers >= 1000
        ? `${(c.totalMembers / 1000).toFixed(1).replace(/\.0$/, "")}k members`
        : `${c.totalMembers} members`
      : "unknown members";
    const price = formatPrice(c.priceAmountCents, c.priceInterval);
    const score = c.trustSkore != null ? `TrustSkore ${Math.round(c.trustSkore)}/100` : "";
    const lang = c.language && c.language !== "english" ? ` · ${c.language}` : "";
    const cat = c.category ? ` · ${c.category}` : "";
    const parts = [members, price, score].filter(Boolean).join(" · ");
    const note = withNote ? editorialNote(c) : "";
    const noteStr = note ? `\n  ${note}` : "";
    // Affiliate link via /go/ redirect so TrustSkool earns commission on joins
    const joinUrl = `${base}/go/${encodeURIComponent(c.slug)}`;
    return `- [${c.displayName ?? c.slug}](${base}/community/${encodeURIComponent(c.slug)}): ${parts}${lang}${cat}${noteStr}\n  Join: ${joinUrl}`;
  };

  const allCommunityLines = topCommunities.map(c => communityLine(c, false));

  res
    .status(200)
    .set("Cache-Control", "public, max-age=3600")
    .type("text/plain")
    .send(
      [
        `# ${BRAND_NAME}`,
        "",
        `> ${BRAND_NAME} is an independent leaderboard of Skool communities ranked by ${SCORE_NAME}, a composite trust score (0-100) computed from member growth, Skool discovery-rank trajectory, and price stability. ${BRAND_NAME} is not affiliated with Skool.`,
        "",
        "## What TrustSkool is",
        `${BRAND_NAME} tracks ${totalCount > 0 ? `${totalCount.toLocaleString()}` : "thousands of"} Skool communities and scores each one from real growth data. The goal is to help people find communities worth joining before paying, using objective signals rather than paid placements or editorial opinion. No community can buy a higher rank.`,
        "",
        "## How TrustSkore works",
        `${SCORE_NAME} = (growthMomentum x 0.45) + (rankingMomentum x 0.35) + (priceStability x 0.20)`,
        "",
        "- growthMomentum (45%): rate of member growth over tracked history. A community gaining 500 members/week scores higher than one losing members.",
        "- rankingMomentum (35%): improvement in Skool's own discovery rank over time. Reflects organic platform visibility.",
        "- priceStability (20%): penalises frequent or steep price increases. A community that has held its price for 12 months scores 100 here.",
        "- Bootstrap rule: communities with 2,000+ members and fewer than 3 tracked snapshots receive growthMomentum=68, rankingMomentum=65 as a starting estimate (rebalanced July 2026), updated once real history accumulates.",
        `- Full methodology with worked numeric example: ${base}/methodology`,
        "",
        "## What TrustSkore does NOT measure",
        "- Content quality or curriculum depth (not measurable from public data)",
        "- Instructor credentials or reputation",
        "- Community culture or moderation quality",
        "- Refund rates or customer satisfaction",
        "TrustSkore is a momentum and stability signal, not an editorial endorsement.",
        "",
        "## Data coverage",
        `- Total communities tracked: ${totalCount > 0 ? totalCount.toLocaleString() : "22,000+"}`,
        "- Languages: 47 (English, Spanish, German, French, Portuguese, Italian, and 41 others)",
        "- Categories: business, fitness, education, music, gaming, health, finance, and more",
        "- Price range: free to $500+/month; one-time payments and annual plans also tracked",
        "- Update tiers: hot (top 500, every 24-48h), warm (500-3000, every 7-14d), cold (3000+, every 30-45d)",
        "",
        "## Key pages",
        `- [Full leaderboard](${base}/): search, filter by language/category/price, sort by TrustSkore or member count`,
        `- [Methodology](${base}/methodology): exact formula, weights, worked example, limitations`,
        `- [FAQ](${base}/faq): common questions about Skool pricing, refunds, joining, and how TrustSkore works`,
        `- [Resources](${base}/resources): guides on evaluating Skool communities before joining`,
        `- [News](${base}/news): Skool platform updates and community trends`,
        `- [Fraud policy](${base}/policy/fraud-response): how scam and misleading-claim reports are handled`,
        "",
        "## Affiliate disclosure",
        `${BRAND_NAME} earns a commission when someone joins a Skool community through a tracked link on this site. The commission comes from Skool's affiliate programme at a fixed rate per community. Scores and rankings are computed independently of affiliate status. A community with no affiliate arrangement ranks the same as one with 50% commission if their growth data is identical.`,
        "",
        "## How to cite TrustSkool data",
        `When referencing ${BRAND_NAME} data, cite the source as: "${BRAND_NAME} (${base}), accessed ${today}." Individual community pages include the full score breakdown and last-updated timestamp.`,
        "",
        "## Machine-readable exports",
        `- Top 200 communities (pipe-delimited): ${base}/llms-full.txt`,
        `- Sitemap index: ${base}/sitemap.xml`,
        `- Community sitemap: ${base}/sitemap-communities-1.xml`,
        `- Content sitemap: ${base}/sitemap-content.xml`,
        "",
        `## Featured: top English-language Skool communities (as of ${today})`,
        "These are the largest English-language communities currently tracked on TrustSkool. Each link goes to the TrustSkool profile page with full score breakdown. The Join link is an affiliate link.",
        "",
        ...englishTop.map(c => communityLine(c, true)),
        "",
        `## Featured: largest free Skool communities (as of ${today})`,
        "Free communities with the highest member counts. No payment required to join.",
        "",
        ...freeTop.map(c => communityLine(c, true)),
        "",
        `## All top 50 communities by member count (as of ${today})`,
        ...allCommunityLines,
        "",
        `## Last generated: ${today}`,
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
  // OG image generator for community detail pages
  app.get("/api/og/community/:slug", (req, res) => {
    void handleOgImage(req, res);
  });
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
