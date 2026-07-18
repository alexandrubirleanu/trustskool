import SiteLayout from "@/components/SiteLayout";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import CommunityCard from "@/components/CommunityCard";

function capitalize(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const label = capitalize(slug);

  // Fetch framing copy from content/categories if available
  const { data: framingPage } = trpc.content.bySlug.useQuery(
    { slug, type: "category" },
    { enabled: Boolean(slug) },
  );

  // Fetch communities filtered by this category
  const { data: list, isLoading } = trpc.communities.list.useQuery(
    {
      category: slug,
      price: "all",
      sort: "trustSkore",
      direction: "desc",
      page: 1,
      pageSize: 48,
    },
    { enabled: Boolean(slug) },
  );

  useEffect(() => {
    document.title = `${label} Skool Communities | TrustSkool`;
  }, [label]);

  return (
    <SiteLayout>
      <div className="container py-10 md:py-14">
        {/* Header */}
        <div className="mb-8 max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            ← All communities
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            {label} communities on Skool
          </h1>
          {framingPage?.metaDescription ? (
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {framingPage.metaDescription}
            </p>
          ) : (
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Browse the best {label} communities on Skool, ranked by TrustSkore: an independent
              score built from member growth, discovery-rank momentum, and price stability.
            </p>
          )}
          {list && (
            <p className="mt-2 text-sm text-muted-foreground">
              {list.total.toLocaleString()} communities found
            </p>
          )}
        </div>

        {/* Framing body copy */}
        {framingPage?.bodyHtml && (
          <div
            className="prose prose-neutral mb-10 max-w-2xl text-foreground [&_a]:text-foreground [&_a]:underline [&_p]:text-muted-foreground [&_p]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: framingPage.bodyHtml }}
          />
        )}

        {/* Community list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-[4px]" />
            ))}
          </div>
        ) : !list?.items.length ? (
          <div className="py-20 text-center text-muted-foreground">
            <p>No communities found in this category.</p>
            <Link href="/" className="chip mt-4 inline-flex">
              Browse all communities
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {list.items.map((community, index) => (
              <CommunityCard key={community.slug} community={community} rank={index + 1} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
