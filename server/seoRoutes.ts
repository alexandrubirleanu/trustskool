import type { Express, Request, Response } from "express";
import { BRAND_NAME, SCORE_NAME } from "../shared/appConfig";
import { getAllSlugsForSitemap } from "./dbCommunities";
import { listContentPagesByTypes } from "./dbContent";

/**
 * SEO plumbing served straight from Express (before the SSR catch-all):
 * - GET /sitemap.xml            — sitemap index (chunks + content)
 * - GET /sitemap-communities-N.xml — community URL chunks (10k per file)
 * - GET /sitemap-content.xml    — all content pages (founders, reviews, guides, faq, news, categories)
 * - GET /robots.txt             — allow all, point at the sitemap, hide /admin and /go
 * - GET /llms.txt               — plain-text site guide for LLM crawlers
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

/** GET /sitemap-content.xml — all content pages (founders, reviews, guides, faq, news, categories) */
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
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /go/",
        "",
        `Sitemap: ${base}/sitemap.xml`,
        "",
        `# LLM guidance: ${base}/llms.txt`,
        "",
      ].join("\n"),
    );
}

async function handleLlmsTxt(_req: Request, res: Response) {
  const base = origin();
  let communityLines: string[] = [];
  try {
    const rows = await getAllSlugsForSitemap();
    communityLines = rows
      .slice(0, 100)
      .map(r => `- [${r.slug}](${base}/community/${encodeURIComponent(r.slug)})`);
  } catch {
    // degrade to the static sections
  }
  res
    .status(200)
    .set("Cache-Control", "public, max-age=3600")
    .type("text/plain")
    .send(
      [
        `# ${BRAND_NAME}`,
        "",
        `> ${BRAND_NAME} is an independent leaderboard of Skool communities ranked by ${SCORE_NAME}, a 0-10 trust score computed from member growth momentum, Skool ranking trajectory, and price stability. ${BRAND_NAME} is not affiliated with Skool.`,
        "",
        "## Key pages",
        `- [Leaderboard](${base}/): searchable, filterable ranking of Skool communities`,
        `- [Methodology](${base}/methodology): exactly how the ${SCORE_NAME} is calculated`,
        `- [Sitemap index](${base}/sitemap.xml)`,
        `- [Community sitemap](${base}/sitemap-communities-1.xml)`,
        `- [Content sitemap](${base}/sitemap-content.xml)`,
        "",
        "## Communities",
        ...communityLines,
        "",
      ].join("\n"),
    );
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
}
