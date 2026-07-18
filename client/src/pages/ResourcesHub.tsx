import SiteLayout from "@/components/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { BookOpen, Clock, ExternalLink } from "lucide-react";
import { Link } from "wouter";

function readTime(wordCount: number | null | undefined): string {
  if (!wordCount) return "";
  const mins = Math.max(1, Math.round(wordCount / 200));
  return `${mins} min read`;
}

function typeLabel(type: string) {
  if (type === "pillar") return "Pillar";
  return "Guide";
}

export default function ResourcesHub() {
  const { data: pages, isLoading } = trpc.content.resourcesList.useQuery();

  return (
    <SiteLayout>
      <div className="container py-10 md:py-14">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Resources</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            In-depth guides and reference articles on Skool communities: pricing, niches, growth
            strategy, and how to evaluate a community before joining.
          </p>
        </header>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[4px] border border-border bg-card p-5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="mt-3 h-6 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
                <Skeleton className="mt-4 h-3 w-20" />
              </div>
            ))}

          {!isLoading && pages?.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">No resources yet.</p>
          )}

          {pages?.map(page => (
            <Link
              key={page.id}
              href={`/resources/${page.slug}`}
              className="group flex flex-col rounded-[4px] border border-border bg-card p-5 transition-colors hover:border-foreground/30">
              <div className="flex items-center gap-2">
                <span className="rounded-[2px] bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {typeLabel(page.type)}
                </span>
              </div>
              <h2 className="mt-3 text-base font-semibold leading-snug group-hover:underline group-hover:underline-offset-2">
                {page.title}
              </h2>
              {page.metaDescription && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {page.metaDescription}
                </p>
              )}
              <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-muted-foreground">
                {page.wordCount && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {readTime(page.wordCount)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-foreground/70">
                  <BookOpen className="h-3 w-3" />
                  Read
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
