import SiteLayout from "@/components/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "wouter";

export default function NewsArticle() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  const { data: page, isLoading } = trpc.content.bySlug.useQuery(
    { slug, type: "skool-news" },
    { enabled: Boolean(slug) },
  );

  useEffect(() => {
    if (page) {
      document.title = `${page.title} | TrustSkool News`;
    }
  }, [page?.slug]);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container max-w-3xl py-10">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-6 h-10 w-full" />
          <div className="mt-10 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!page) {
    return (
      <SiteLayout>
        <div className="container py-24 text-center">
          <h1 className="text-2xl font-semibold">Article not found</h1>
          <p className="mt-2 text-muted-foreground">This news article doesn't exist.</p>
          <Link href="/news" className="chip mt-6 inline-flex">
            Back to News
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container max-w-3xl py-10 md:py-14">
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Skool News
        </Link>

        <article className="mt-6">
          <header>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-[2px] bg-secondary px-2 py-0.5 font-medium">News</span>
              {page.publishedAt && (
                <time dateTime={new Date(page.publishedAt).toISOString()}>
                  {new Date(page.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight leading-tight md:text-4xl">
              {page.title}
            </h1>
            {page.metaDescription && (
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {page.metaDescription}
              </p>
            )}
          </header>

          <div
            className="prose prose-neutral mt-8 max-w-none text-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_li]:text-muted-foreground [&_p]:text-muted-foreground [&_p]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
          />
        </article>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-[4px] border border-border bg-card px-6 py-10 text-center">
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Explore the top-ranked Skool communities, scored by real growth data.
          </p>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-[4px] bg-[#F8D481] px-8 text-sm font-bold text-[#202124] transition-transform active:scale-[0.97]">
            Browse all communities
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
