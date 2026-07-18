import type { Express, Request, Response } from "express";
import { BRAND_NAME, SCORE_NAME } from "../shared/appConfig";
import { getAllSlugsForSitemap } from "./dbCommunities";

/**
 * SEO plumbing served straight from Express (before the SSR catch-all):
 * - GET /sitemap.xml  — homepage + methodology + every community detail page
 * - GET /robots.txt   — allow all, point at the sitemap, hide /admin and /go
 * - GET /llms.txt     — plain-text site guide for LLM crawlers
 */

const origin = () => process.env.CANONICAL_ORIGIN || "https://trustskool.com";

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function handleSitemap(_req: Request, res: Response) {
  try {
    const base = origin();
    const rows = await getAllSlugsForSitemap();
    const today = new Date().toISOString().slice(0, 10);
    const urls: string[] = [
      `<url><loc>${base}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      `<url><loc>${base}/methodology</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
      ...rows.map(r => {
        const lastmod = r.updatedAt ? new Date(r.updatedAt).toISOString().slice(0, 10) : today;
        return `<url><loc>${base}/community/${xmlEscape(encodeURIComponent(r.slug))}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`;
      }),
    ];
    res
      .status(200)
      .set("Cache-Control", "public, max-age=3600")
      .type("application/xml")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`,
      );
  } catch (err) {
    console.error("[Sitemap] Failed:", err);
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
        `- [Sitemap](${base}/sitemap.xml)`,
        "",
        "## Communities",
        ...communityLines,
        "",
      ].join("\n"),
    );
}

export function registerSeoRoutes(app: Express) {
  app.get("/sitemap.xml", (req, res) => {
    void handleSitemap(req, res);
  });
  app.get("/robots.txt", handleRobots);
  app.get("/llms.txt", (req, res) => {
    void handleLlmsTxt(req, res);
  });
}
