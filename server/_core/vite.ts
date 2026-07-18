import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import superjson from "superjson";
import { createServer as createViteServer } from "vite";
import type { HeadMeta } from "../../client/src/ssr/prefetch";
import viteConfig from "../../vite.config";
import { buildSsrPrefetch } from "./ssrCaller";

// SECURITY: head values may originate from the database. Escape EVERY value
// interpolated into head tags.
const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Canonical origin for og:url / canonical — configured per deployment, never
// derived from req.host (client-spoofable).
const CANONICAL_ORIGIN = process.env.CANONICAL_ORIGIN ?? "";
const SITE_NAME = process.env.SITE_NAME ?? "TrustSkool";
if (process.env.NODE_ENV === "production" && !CANONICAL_ORIGIN) {
  console.warn(
    "[SSR] CANONICAL_ORIGIN is not set — canonical/og:url/og:image tags will be omitted site-wide",
  );
}
const OG_LOCALE = process.env.OG_LOCALE ?? "en_US";

// Titles: whitespace-collapse + truncation only (no markdown strip).
const clampText = (s: string, max: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.lastIndexOf(" ", max);
  if (cut > max * 0.6) return t.slice(0, cut) + "…";
  return Array.from(t).slice(0, max).join("") + "…";
};
// Descriptions: also strip markdown tokens common in UGC excerpts.
const metaText = (s: string, max: number) => clampText(s.replace(/[#*_`~]+/g, ""), max);

export function buildHeadTags(head: HeadMeta, siteName = SITE_NAME): string {
  const title = escapeHtml(clampText(head.title, 70) || siteName);
  const desc = escapeHtml(metaText(head.description, 200));
  const url =
    head.canonicalPath && CANONICAL_ORIGIN ? escapeHtml(CANONICAL_ORIGIN + head.canonicalPath) : "";
  const img = head.ogImage?.startsWith("//")
    ? "https:" + head.ogImage
    : head.ogImage?.startsWith("/")
      ? CANONICAL_ORIGIN
        ? CANONICAL_ORIGIN + head.ogImage
        : undefined
      : head.ogImage;
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    `<meta property="og:type" content="${head.ogType ?? "website"}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:locale" content="${escapeHtml(OG_LOCALE)}" />`,
    `<meta name="twitter:card" content="${img ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:site" content="@trustskool" />`,
    `<link rel="llms-txt" href="/llms.txt" />`,
  ];
  if (siteName) tags.push(`<meta property="og:site_name" content="${escapeHtml(siteName)}" />`);
  if (img) {
    tags.push(`<meta property="og:image" content="${escapeHtml(img)}" />`);
    tags.push(`<meta name="twitter:image" content="${escapeHtml(img)}" />`);
    if (head.ogImageAlt)
      tags.push(`<meta property="og:image:alt" content="${escapeHtml(head.ogImageAlt)}" />`);
  }
  if (url) {
    tags.push(`<meta property="og:url" content="${url}" />`);
    tags.push(`<link rel="canonical" href="${url}" />`);
  }
  if (head.keywords) {
    tags.push(`<meta name="keywords" content="${escapeHtml(head.keywords)}" />`);
  }
  if (head.notFound || head.noindex) {
    tags.push(`<meta name="robots" content="noindex, follow" />`);
  }
  if (head.jsonLd) {
    // JSON-LD script: escape "<" to prevent </script> breakout from DB values.
    const json = JSON.stringify(head.jsonLd).replace(/</g, "\\u003c");
    tags.push(`<script type="application/ld+json">${json}</script>`);
  }
  return tags.join("\n    ");
}

function composeHtml(
  template: string,
  appHtml: string,
  head: HeadMeta,
  dehydratedState: unknown,
) {
  const esc = (s: string) => s.replace(/</g, "\\u003c");
  const headTags = buildHeadTags(head);
  const stateScript = `<script>window.__RQ_STATE__ = ${esc(
    JSON.stringify(superjson.serialize(dehydratedState)),
  )}</script>`;
  // Replacement values MUST be functions ($-pattern safety); state script is
  // injected BEFORE the app HTML so a literal "</body>" in content cannot
  // relocate it.
  return template
    .replace("</body>", () => `${stateScript}</body>`)
    .replace("<!--app-head-->", () => headTags)
    .replace("<!--app-html-->", () => appHtml);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(import.meta.dirname, "../..", "client", "index.html");

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/entry-client.tsx"`,
        `src="/src/entry-client.tsx?v=${nanoid()}"`,
      );
      // transformIndexHtml applies %VITE_*% env replacement and lets plugins
      // (manus runtime, debug collector) inject their scripts.
      template = await vite.transformIndexHtml(url, template);
      // Dev-only blocking CSS so the SSR'd first paint is styled.
      template = template.replace(
        "</head>",
        `<link rel="stylesheet" href="/src/index.css?direct" data-ssr-dev-css></head>`,
      );
      const { render } = await vite.ssrLoadModule("/src/entry-server.tsx");
      const prefetch = await buildSsrPrefetch(req, res);
      const { html, dehydratedState, head } = await render(url, prefetch);
      res
        .status(head.notFound ? 404 : 200)
        .set("Cache-Control", "no-cache")
        .type("html")
        .end(composeHtml(template, html, head, dehydratedState));
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      console.error("[SSR] dev render failed:", e);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // /index.html would leak the raw template; 301 it into the SSR handler.
  // Also 301-normalize trailing slashes so duplicate URLs collapse.
  app.use((req, res, next) => {
    if (req.path === "/index.html") return res.redirect(301, "/");
    if (req.path !== "/" && /\/+$/.test(req.path)) {
      const query = req.originalUrl.slice(req.path.length);
      // Collapse leading slashes too: "//evil.com/" must not become an open
      // redirect to a protocol-relative URL.
      const target = (req.path.replace(/\/+$/, "") || "/").replace(/^\/\/+/, "/");
      return res.redirect(301, target + query);
    }
    next();
  });

  // redirect:false prevents serve-static's directory 301 from ping-ponging
  // with the trailing-slash 301 above. SSR owns HTML (index:false).
  app.use(express.static(distPath, { index: false, redirect: false }));

  const templatePath = path.resolve(distPath, "index.html");
  const serverEntryPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "server-ssr", "entry-server.js")
      : path.resolve(import.meta.dirname, "server-ssr", "entry-server.js");

  app.use("*", async (req, res) => {
    try {
      const template = await fs.promises.readFile(templatePath, "utf-8");
      // Dynamic import with a runtime-variable path: the SSR bundle only
      // exists after build and esbuild leaves variable-path imports unbundled.
      const { render } = await import(serverEntryPath);
      const prefetch = await buildSsrPrefetch(req, res);
      const { html, dehydratedState, head } = await render(req.originalUrl, prefetch);
      res
        .status(head.notFound ? 404 : 200)
        .set("Cache-Control", "no-cache")
        .type("html")
        .end(composeHtml(template, html, head, dehydratedState));
    } catch (e) {
      // ALERT on this log line: invisible to human QA, crawlers get the shell.
      console.error("[SSR] render failed, serving shell:", e);
      const template = await fs.promises.readFile(templatePath, "utf-8");
      const fallbackHead = buildHeadTags({
        title: SITE_NAME,
        description:
          "TrustSkool ranks Skool communities by TrustSkore, an independent trust score built from growth and pricing data.",
      });
      res
        .status(200)
        .set("Cache-Control", "no-cache")
        .type("html")
        .end(
          template.replace("<!--app-head-->", () => fallbackHead).replace("<!--app-html-->", () => ""),
        );
    }
  });
}
