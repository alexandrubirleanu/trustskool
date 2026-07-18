import type { QueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { BRAND_NAME } from "@shared/appConfig";
import { trpc } from "@/lib/trpc";

export type HeadMeta = {
  title: string;
  description: string;
  ogType?: "website" | "article";
  ogImage?: string;
  ogImageAlt?: string;
  canonicalPath?: string;
  noindex?: boolean;
  notFound?: boolean;
  /** Optional JSON-LD payload rendered into the head as a script tag. */
  jsonLd?: object;
};

type RO = inferRouterOutputs<AppRouter>;

export type CommunitiesListInput = {
  search?: string;
  language?: string;
  category?: string;
  price: "all" | "free" | "paid";
  trending?: boolean;
  sort: "trustSkore" | "totalMembers" | "growthRateBp" | "category";
  direction: "asc" | "desc";
  page: number;
  pageSize: number;
};

// Deliberate allowlist: only these procedures are reachable from SSR prefetch.
export type ContentPageType = "founder" | "review" | "category" | "guide" | "pillar" | "faq" | "skool-news";

export type SsrPrefetch = {
  communitiesList: (input: CommunitiesListInput) => Promise<RO["communities"]["list"]>;
  communityBySlug: (slug: string) => Promise<RO["communities"]["bySlug"]>;
  communitiesFilters: () => Promise<RO["communities"]["filters"]>;
  communitiesStats: () => Promise<RO["communities"]["stats"]>;
  contentBySlug: (slug: string, type: ContentPageType) => Promise<RO["content"]["bySlug"]>;
};

const SITE = BRAND_NAME;
const DESC =
  "TrustSkool ranks Skool communities by TrustSkore, an independent trust score built from member growth, ranking momentum, and price stability. Find communities worth joining before you pay.";

function seed(qc: QueryClient, key: readonly unknown[], data: unknown) {
  qc.setQueryData(key, data);
}

const HOME_PAGE_SIZE = 24;

export async function prefetchForPath(
  url: string,
  qc: QueryClient,
  p: SsrPrefetch,
): Promise<HeadMeta> {
  const rawSearch = url.split("?").slice(1).join("?");
  let pathOnly = url.split("?")[0];
  try {
    pathOnly = decodeURI(pathOnly);
  } catch {
    // malformed URI: use raw, mirroring wouter
  }
  const clean = pathOnly.replace(/\/+$/, "") || "/";

  if (clean === "/") {
    const q = new URLSearchParams(rawSearch).get("q") ?? "";
    // Mirror Home.tsx listInput exactly (types AND defaulted keys): search from
    // ?q=, everything else initial state.
    const input: CommunitiesListInput = {
      search: q || undefined,
      language: undefined,
      category: undefined,
      price: "all",
      sort: "trustSkore",
      direction: "desc",
      page: 1,
      pageSize: HOME_PAGE_SIZE,
    };
    const [list, filters, stats] = await Promise.all([p.communitiesList(input), p.communitiesFilters(), p.communitiesStats()]);
    seed(qc, getQueryKey(trpc.communities.list, input, "query"), list);
    seed(qc, getQueryKey(trpc.communities.filters, undefined, "query"), filters);
    seed(qc, getQueryKey(trpc.communities.stats, undefined, "query"), stats);
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Skool community leaderboard ranked by TrustSkore",
      numberOfItems: list.total,
      itemListElement: list.items.slice(0, 10).map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.displayName,
        url: `/community/${c.slug}`,
      })),
    };
    return {
      title: `${SITE} — Skool community leaderboard, ranked by TrustSkore`,
      description: DESC,
      ogType: "website",
      canonicalPath: "/",
      ogImage: "/manus-storage/trustskool-og_10a2b5e1.png",
      ogImageAlt: "TrustSkool — Skool community leaderboard",
      jsonLd,
    };
  }

  const communityMatch = clean.match(/^\/community\/([^/]+)$/);
  if (communityMatch) {
    // Use the captured segment AS-IS (already decodeURI'd with the whole path).
    const slug = communityMatch[1];
    const community = await p.communityBySlug(slug);
    if (!community) return { title: SITE, description: DESC, notFound: true };
    seed(qc, getQueryKey(trpc.communities.bySlug, { slug }, "query"), community);
    const members = community.totalMembers >= 1000
      ? `${(community.totalMembers / 1000).toFixed(1).replace(/\.0$/, "")}k`
      : String(community.totalMembers);
    const desc = community.description?.trim()
      ? community.description
      : `${community.displayName} on Skool: ${members} members, TrustSkore ${(community.trustSkore / 10).toFixed(1)}/10. Growth, pricing and trust breakdown on ${SITE}.`;
    // NOTE: AggregateRating/Review markup intentionally omitted.
    // TrustSkore is an algorithmic composite score (not user reviews) and
    // does not qualify for Google's Review/AggregateRating rich results.
    // See: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: community.displayName,
      description: desc,
      url: `/community/${community.slug}`,
      ...(community.logoUrl ? { logo: community.logoUrl } : {}),
      // TrustSkore exposed as a plain additionalProperty, not as a Review/Rating.
      additionalProperty: {
        "@type": "PropertyValue",
        name: "TrustSkore",
        description: "Algorithmic momentum score (0-100) based on member growth, discovery-rank trajectory, and price stability. Not a user review or editorial rating.",
        value: community.trustSkore,
        minValue: 0,
        maxValue: 100,
      },
    };
    return {
      title: community.displayName?.trim()
        ? `${community.displayName} — TrustSkore ${(community.trustSkore / 10).toFixed(1)}/10 · ${SITE}`
        : SITE,
      description: desc,
      ogType: "article",
      ogImage: community.logoUrl ?? undefined,
      ogImageAlt: community.displayName ?? undefined,
      canonicalPath: `/community/${community.slug}`,
      jsonLd,
    };
  }

  if (clean === "/methodology") {
    return {
      title: `Methodology — how the TrustSkore is calculated · ${SITE}`,
      description:
        "The TrustSkore blends member growth momentum, Skool ranking trajectory, and price stability into a single 0-10 trust score. Here is exactly how each component is weighted.",
      ogType: "website",
      canonicalPath: "/methodology",
    };
  }

  if (clean === "/policy/fraud-response") {
    return {
      title: `Fraud & Scam Response Policy · ${SITE}`,
      description:
        "How TrustSkool handles credible fraud and scam reports: delisting criteria, commission suspension rule, warning labels, and how to submit a report.",
      ogType: "website",
      canonicalPath: "/policy/fraud-response",
    };
  }

  if (clean === "/resources") {
    return {
      title: `Resources — Skool community guides, pricing data & strategy · ${SITE}`,
      description:
        "In-depth guides and reference articles on Skool communities — pricing benchmarks, niche analysis, growth strategy, and how to evaluate a community before joining.",
      ogType: "website",
      canonicalPath: "/resources",
    };
  }

  const resourceMatch = clean.match(/^\/resources\/([^/]+)$/);
  if (resourceMatch) {
    const slug = resourceMatch[1];
    // Try guide first, then pillar, then faq (mirrors ResourceArticle.tsx)
    let page = await p.contentBySlug(slug, "guide");
    if (!page) page = await p.contentBySlug(slug, "pillar");
    if (!page) page = await p.contentBySlug(slug, "faq");
    if (!page) return { title: SITE, description: DESC, notFound: true };
    const title = `${page.title} · ${SITE}`;
    const desc = page.metaDescription ?? DESC;
    const published = page.publishedAt ? new Date(page.publishedAt).toISOString() : undefined;
    return {
      title,
      description: desc,
      ogType: "article",
      canonicalPath: `/resources/${slug}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: page.title,
        description: desc,
        url: `https://trustskool.com/resources/${slug}`,
        ...(published ? { datePublished: published } : {}),
        publisher: {
          "@type": "Organization",
          name: SITE,
          url: "https://trustskool.com",
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://trustskool.com/resources/${slug}`,
        },
      },
    };
  }

  if (clean === "/news") {
    return {
      title: `Skool News — latest updates from the Skool ecosystem · ${SITE}`,
      description:
        "Latest news, platform updates, and community highlights from the Skool ecosystem, curated by TrustSkool.",
      ogType: "website",
      canonicalPath: "/news",
    };
  }

  const newsMatch = clean.match(/^\/news\/([^/]+)$/);
  if (newsMatch) {
    const slug = newsMatch[1];
    const page = await p.contentBySlug(slug, "skool-news");
    if (!page) return { title: SITE, description: DESC, notFound: true };
    const title = `${page.title} · ${SITE} News`;
    const desc = page.metaDescription ?? DESC;
    const published = page.publishedAt ? new Date(page.publishedAt).toISOString() : undefined;
    return {
      title,
      description: desc,
      ogType: "article",
      canonicalPath: `/news/${slug}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: page.title,
        description: desc,
        url: `https://trustskool.com/news/${slug}`,
        ...(published ? { datePublished: published } : {}),
        publisher: {
          "@type": "Organization",
          name: SITE,
          url: "https://trustskool.com",
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://trustskool.com/news/${slug}`,
        },
      },
    };
  }

  if (clean === "/faq") {
    return {
      title: `FAQ — Skool community questions answered · ${SITE}`,
      description:
        "Frequently asked questions about Skool communities: pricing, joining, leaving, refunds, and how TrustSkore works.",
      ogType: "website",
      canonicalPath: "/faq",
    };
  }

  const faqMatch = clean.match(/^\/faq\/([^/]+)$/);
  if (faqMatch) {
    const slug = faqMatch[1];
    const page = await p.contentBySlug(slug, "faq");
    if (!page) return { title: SITE, description: DESC, notFound: true };
    const title = `${page.title} · ${SITE} FAQ`;
    const desc = page.metaDescription ?? DESC;
    return {
      title,
      description: desc,
      ogType: "article",
      canonicalPath: `/faq/${slug}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        name: page.title,
        description: desc,
        url: `https://trustskool.com/faq/${slug}`,
        // mainEntity populated client-side from rendered H2/H3 headings;
        // server-side we emit the page-level FAQPage type for crawler discovery.
        publisher: {
          "@type": "Organization",
          name: SITE,
          url: "https://trustskool.com",
        },
      },
    };
  }

  const founderMatch = clean.match(/^\/founders\/([^/]+)$/);
  if (founderMatch) {
    const slug = founderMatch[1];
    const page = await p.contentBySlug(slug, "founder");
    if (!page) return { title: SITE, description: DESC, notFound: true };
    const title = `${page.title} · ${SITE}`;
    const desc = page.metaDescription ?? DESC;
    const published = page.publishedAt ? new Date(page.publishedAt).toISOString() : undefined;
    return {
      title,
      description: desc,
      ogType: "article",
      canonicalPath: `/founders/${slug}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        headline: page.title,
        description: desc,
        url: `https://trustskool.com/founders/${slug}`,
        ...(published ? { datePublished: published } : {}),
        publisher: {
          "@type": "Organization",
          name: SITE,
          url: "https://trustskool.com",
        },
      },
    };
  }

  const reviewMatch = clean.match(/^\/reviews\/([^/]+)$/);
  if (reviewMatch) {
    const slug = reviewMatch[1];
    const page = await p.contentBySlug(slug, "review");
    if (!page) return { title: SITE, description: DESC, notFound: true };
    const title = `${page.title} · ${SITE}`;
    const desc = page.metaDescription ?? DESC;
    const published = page.publishedAt ? new Date(page.publishedAt).toISOString() : undefined;
    return {
      title,
      description: desc,
      ogType: "article",
      canonicalPath: `/reviews/${slug}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: page.title,
        description: desc,
        url: `https://trustskool.com/reviews/${slug}`,
        ...(published ? { datePublished: published } : {}),
        publisher: {
          "@type": "Organization",
          name: SITE,
          url: "https://trustskool.com",
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://trustskool.com/reviews/${slug}`,
        },
      },
    };
  }

  const categoryMatch = clean.match(/^\/categories\/([^/]+)$/);
  if (categoryMatch) {
    const slug = categoryMatch[1];
    const label = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      title: `${label} Skool communities — ranked by TrustSkore · ${SITE}`,
      description: `Browse the best ${label} communities on Skool, ranked by member growth, discovery momentum, and price stability.`,
      ogType: "website",
      canonicalPath: `/categories/${slug}`,
    };
  }

  // Auth-gated routes: 200 + default head, noindex, no prefetch.
  if (clean === "/admin" || clean.startsWith("/admin/")) {
    return { title: SITE, description: DESC, noindex: true };
  }

  // Unknown route: real 404.
  return { title: SITE, description: DESC, notFound: true };
}
