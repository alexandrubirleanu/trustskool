import { and, desc, eq } from "drizzle-orm";
import { contentPages } from "../drizzle/schema";
import type { ContentPage } from "../drizzle/schema";
import { getDb } from "./db";

export type ContentPageType = ContentPage["type"];

/** Fetch a single content page by slug + type. Returns undefined if not found. */
export async function getContentPage(
  slug: string,
  type: ContentPageType,
): Promise<ContentPage | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(contentPages)
    .where(and(eq(contentPages.slug, slug), eq(contentPages.type, type)))
    .limit(1);
  return rows[0];
}

/** List all content pages of a given type, ordered by publishedAt desc (newest first). */
export async function listContentPages(type: ContentPageType): Promise<ContentPage[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentPages)
    .where(eq(contentPages.type, type))
    .orderBy(desc(contentPages.publishedAt), desc(contentPages.createdAt));
}

/** List content pages for multiple types (e.g. guides + pillar together). */
export async function listContentPagesByTypes(types: ContentPageType[]): Promise<ContentPage[]> {
  if (types.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  // Fetch each type and merge (small sets, no need for complex OR)
  const results = await Promise.all(types.map(t => listContentPages(t)));
  return results.flat().sort((a, b) => {
    const ta = a.publishedAt ?? a.createdAt;
    const tb = b.publishedAt ?? b.createdAt;
    return tb.getTime() - ta.getTime();
  });
}

/** Fetch founder content page for a community slug (single-community bio). */
export async function getFounderPage(communitySlug: string): Promise<ContentPage | undefined> {
  return getContentPage(communitySlug, "founder");
}

/** Fetch category framing copy for a category slug. */
export async function getCategoryPage(categorySlug: string): Promise<ContentPage | undefined> {
  return getContentPage(categorySlug.toLowerCase(), "category");
}
