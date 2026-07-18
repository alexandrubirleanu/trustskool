import SiteLayout from "@/components/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Newspaper } from "lucide-react";
import { Link } from "wouter";

export default function SkoolNews() {
  const { data: pages, isLoading } = trpc.content.newsList.useQuery();

  return (
    <SiteLayout>
      <div className="container py-10 md:py-14">
        <header className="max-w-2xl">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Newspaper className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-widest">Skool News</span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl md:text-4xl">
            What's happening on Skool
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Platform updates, community trends, and notable events in the Skool ecosystem.
          </p>
        </header>

        <div className="mt-10 flex flex-col gap-4">
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-[4px] border border-border bg-card p-5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-6 w-2/3" />
                <Skeleton className="mt-2 h-4 w-full" />
              </div>
            ))}

          {!isLoading && pages?.length === 0 && (
            <p className="text-sm text-muted-foreground">No news articles yet.</p>
          )}

          {pages?.map(page => (
            <Link
              key={page.id}
              href={`/news/${page.slug}`}
              className="group flex flex-col gap-2 rounded-[4px] border border-border bg-card p-5 transition-colors hover:border-foreground/30">
              {page.publishedAt && (
                <time
                  dateTime={new Date(page.publishedAt).toISOString()}
                  className="text-xs text-muted-foreground">
                  {new Date(page.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              )}
              <h2 className="text-base font-semibold leading-snug group-hover:underline group-hover:underline-offset-2">
                {page.title}
              </h2>
              {page.metaDescription && (
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {page.metaDescription}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
