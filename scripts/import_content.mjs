/**
 * Import all content/ markdown files into the contentPages DB table.
 * Run: node scripts/import_content.mjs
 *
 * Mapping:
 *   content/founders/*.md      → type='founder',    slug=filename (community slug)
 *   content/reviews/*.md       → type='review',     slug=frontmatter.slug || filename
 *   content/categories/*.md    → type='category',   slug=filename
 *   content/guides/*.md        → type='guide',      slug=frontmatter.slug || filename
 *   content/pillar/*.md        → type='pillar',     slug=frontmatter.slug || filename
 *   content/faq/*.md           → type='faq',        slug=filename
 *   content/skool-news/*.md    → type='skool-news', slug=filename, publishedAt from frontmatter.date
 *   content/strategy/*.md      → type='strategy',   slug=frontmatter.slug || filename
 *
 * Founders: per content-decision.md rule #12, all 30 current founder files are
 * single-community bios → type='founder', folded into /community/:slug page.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "content");
const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error("DATABASE_URL env var not set");
  process.exit(1);
}

// Parse DATABASE_URL (mysql://user:pass@host:port/db)
function parseDbUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port || "3306"),
    user: u.username,
    password: u.password,
    database: u.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: false },
  };
}

/** Strip leading # from title if present (markdown h1 artifact) */
function cleanTitle(raw) {
  return raw?.replace(/^#+\s*/, "").trim() ?? "";
}

/** Derive slug from filename (strip .md extension) */
function slugFromFile(filePath) {
  return path.basename(filePath, ".md");
}

/**
 * Post-process HTML: add target="_blank" rel="noopener noreferrer" to all
 * external links (http/https that don't point to trustskool.com).
 */
function addExternalLinkTargets(html) {
  // marked v16 generates <a href="..."> (no leading space before href)
  return html.replace(
    /<a([^>]*?)href="(https?:\/\/(?!(?:www\.)?trustskool\.com)[^"]+)"([^>]*)>/gi,
    (match, before, href, after) => {
      // Don't double-add target if already present
      if (match.includes('target=')) return match;
      // Ensure there's always a space between <a and href
      const sep = before || " ";
      return `<a${sep}href="${href}"${after} target="_blank" rel="noopener noreferrer">`;
    }
  );
}

/** Render markdown to HTML with external links opening in new tab */
function renderHtml(markdown) {
  const raw = marked.parse(markdown);
  return addExternalLinkTargets(raw);
}

/**
 * Collect all content files by type.
 * Returns array of { filePath, type }
 */
function collectFiles() {
  const typeDirs = [
    { dir: "founders", type: "founder" },
    { dir: "reviews", type: "review" },
    { dir: "categories", type: "category" },
    { dir: "guides", type: "guide" },
    { dir: "pillar", type: "pillar" },
    { dir: "faq", type: "faq" },
    { dir: "skool-news", type: "skool-news" },
    { dir: "strategy", type: "strategy" },
  ];

  const files = [];
  for (const { dir, type } of typeDirs) {
    const dirPath = path.join(CONTENT_DIR, dir);
    if (!fs.existsSync(dirPath)) continue;
    const entries = fs.readdirSync(dirPath).filter(f => f.endsWith(".md"));
    for (const entry of entries) {
      files.push({ filePath: path.join(dirPath, entry), type });
    }
  }
  return files;
}

async function main() {
  const conn = await mysql.createConnection(parseDbUrl(DB_URL));
  console.log("[ContentImport] Connected to DB");

  const files = collectFiles();
  console.log(`[ContentImport] Found ${files.length} content files`);

  let upserted = 0;
  let errors = 0;

  for (const { filePath, type } of files) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const { data: fm, content: body } = matter(raw);

      const slug = fm.slug || fm.community_slug || slugFromFile(filePath);
      const title = cleanTitle(fm.title || "");
      const metaDescription = fm.meta_description || fm.metaDescription || null;
      const wordCount = fm.word_count || fm.wordCount || null;
      const bodyHtml = renderHtml(body);

      // publishedAt: use frontmatter date for skool-news, otherwise null (import date via DB default)
      let publishedAt = null;
      if (type === "skool-news" && fm.date) {
        publishedAt = new Date(fm.date);
      }

      await conn.execute(
        `INSERT INTO contentPages (slug, type, title, metaDescription, bodyHtml, frontmatter, wordCount, publishedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           metaDescription = VALUES(metaDescription),
           bodyHtml = VALUES(bodyHtml),
           frontmatter = VALUES(frontmatter),
           wordCount = VALUES(wordCount),
           publishedAt = VALUES(publishedAt),
           updatedAt = NOW()`,
        [
          slug,
          type,
          title,
          metaDescription,
          bodyHtml,
          JSON.stringify(fm),
          wordCount,
          publishedAt,
        ]
      );

      upserted++;
      console.log(`  [OK] ${type}/${slug}`);
    } catch (err) {
      errors++;
      console.error(`  [ERR] ${filePath}: ${err.message}`);
    }
  }

  await conn.end();
  console.log(`\n[ContentImport] Done: ${upserted} upserted, ${errors} errors`);
}

main().catch(err => {
  console.error("[ContentImport] Fatal:", err);
  process.exit(1);
});
