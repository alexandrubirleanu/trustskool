import SiteLayout from "@/components/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Clock } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "wouter";

function readTime(wordCount: number | null | undefined): string {
  if (!wordCount) return "";
  const mins = Math.max(1, Math.round(wordCount / 200));
  return `${mins} min read`;
}

export default function ResourceArticle() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  // Try guide first, then pillar, then faq
  const { data: guidePage, isLoading: loadingGuide } = trpc.content.bySlug.useQuery(
    { slug, type: "guide" },
    { enabled: Boolean(slug) },
  );
  const { data: pillarPage, isLoading: loadingPillar } = trpc.content.bySlug.useQuery(
    { slug, type: "pillar" },
    { enabled: Boolean(slug) && !guidePage },
  );
  const { data: faqPage, isLoading: loadingFaq } = trpc.content.bySlug.useQuery(
    { slug, type: "faq" },
    { enabled: Boolean(slug) && !guidePage && !pillarPage },
  );

  const page = guidePage ?? pillarPage ?? faqPage;
  const isLoading = loadingGuide || loadingPillar || loadingFaq;

  useEffect(() => {
    if (page) {
      document.title = `${page.title} | TrustSkool`;
    }
  }, [page?.slug]);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container max-w-3xl py-10">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-6 h-10 w-full" />
          <Skeleton className="mt-3 h-4 w-2/3" />
          <div className="mt-10 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
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
          <p className="mt-2 text-muted-foreground">This page doesn't exist in the TrustSkool resource library.</p>
          <Link href="/resources" className="chip mt-6 inline-flex">
            Back to Resources
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container max-w-3xl py-10 md:py-14">
        <Link
          href="/resources"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Resources
        </Link>

        <article className="mt-6">
          <header>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-[2px] bg-secondary px-2 py-0.5 font-medium capitalize">
                {page.type === "skool-news" ? "News" : page.type}
              </span>
              {page.wordCount && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {readTime(page.wordCount)}
                </span>
              )}
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
            className="prose prose-neutral mt-8 max-w-none text-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_li]:text-muted-foreground [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_table]:text-sm [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-border [&_th]:bg-secondary [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold"
            dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
          />
        </article>

        {/* Bottom CTA */}
        <div className="mt-14 flex flex-col items-center gap-4 rounded-[4px] border border-border bg-card px-6 py-10 text-center">
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Ready to find the right Skool community for you?
          </p>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-[4px] bg-[#F8D481] px-8 text-sm font-bold text-[#202124] transition-transform active:scale-[0.97]">
            Browse all communities
          </Link>
          <a
            href="/go/signup"
            target="_blank" rel="sponsored noopener noreferrer"
            data-fast-goal="skool_click"
            data-fast-goal-source="resource_article_bottom"
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">
            Or launch your own community on Skool for $9/mo →
          </a>
        </div>
      </div>
    </SiteLayout>
  );
}
