import SiteLayout from "@/components/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Clock } from "lucide-react";
import { Link } from "wouter";

function readTime(wordCount: number | null | undefined): string {
  if (!wordCount) return "";
  const mins = Math.max(1, Math.round(wordCount / 200));
  return `${mins} min read`;
}

export default function FaqHub() {
  const { data: pages, isLoading } = trpc.content.list.useQuery({ type: "faq" });

  return (
    <SiteLayout>
      <div className="container py-10 md:py-14">
        <div className="mb-10 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">FAQ</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Frequently asked questions about Skool communities — pricing, joining, leaving, refunds,
            and how TrustSkore works.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[4px] border border-border p-5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="mt-3 h-5 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : !pages?.length ? (
          <p className="text-muted-foreground">No FAQ articles found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <Link key={page.slug} href={`/faq/${page.slug}`}>
                <div className="group flex h-full cursor-pointer flex-col rounded-[4px] border border-border p-5 transition-colors hover:bg-accent">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-[2px] bg-secondary px-2 py-0.5 font-medium capitalize">
                      FAQ
                    </span>
                    {page.wordCount && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {readTime(page.wordCount)}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-sm font-semibold leading-snug group-hover:underline group-hover:underline-offset-2">
                    {page.title}
                  </h2>
                  {page.metaDescription && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {page.metaDescription}
                    </p>
                  )}
                  <div className="mt-auto pt-4 text-xs text-muted-foreground">Read →</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
