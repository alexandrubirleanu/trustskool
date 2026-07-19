import SiteLayout from "@/components/SiteLayout";
import { trpc } from "@/lib/trpc";
import { SKOOL_CATEGORIES } from "@shared/appConfig";
import { formatScore, scoreTier, SCORE_TIER_CLASSES } from "@/lib/format";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { Trophy } from "lucide-react";

export default function Rankings() {
  const { data: summary, isLoading } = trpc.rankings.summary.useQuery();

  useEffect(() => {
    document.title = "Skool Community Rankings by Category | TrustSkool";
  }, []);

  // Build a lookup map from the summary data
  const summaryMap = new Map(
    (summary ?? []).map(s => [s.category, s]),
  );

  return (
    <SiteLayout>
      <div className="container py-10 md:py-14">
        {/* Header */}
        <div className="mb-8 max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              TrustSkool
            </Link>
            <span>/</span>
            <span className="text-foreground">Rankings</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Skool Community Rankings
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Top communities in each Skool category, ranked by TrustSkore. Updated monthly from
            real member growth and discovery-rank data.
          </p>
        </div>

        {/* Category grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SKOOL_CATEGORIES.map(cat => {
              const info = summaryMap.get(cat.slug);
              return (
                <Link
                  key={cat.slug}
                  href={`/rankings/${cat.slug}`}
                  className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" aria-hidden="true">{cat.emoji}</span>
                      <span className="text-base font-semibold text-card-foreground group-hover:text-primary transition-colors">
                        {cat.label}
                      </span>
                    </div>
                    <Trophy className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary/60 transition-colors" />
                  </div>
                  {info ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Top community:{" "}
                        <span className="font-medium text-foreground">
                          {info.topCommunity ?? "—"}
                        </span>
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{info.count} communities ranked</span>
                        {info.snapshotMonth && (
                          <span>
                            {info.snapshotMonth.replace("-", " / ")}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No snapshot yet</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Methodology note */}
        <div className="mt-12 rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">How rankings work</p>
          <p>
            Rankings are computed monthly from TrustSkore — an algorithmic composite of member
            growth momentum, discovery-rank trajectory, and price stability. Only communities with
            at least 100 members are included. TrustSkore is still early for most communities (few
            tracked snapshots yet), so early rankings may look more settled than they are.{" "}
            <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Read the full methodology →
            </Link>
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
