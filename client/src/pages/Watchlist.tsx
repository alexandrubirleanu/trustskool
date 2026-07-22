import { ArrowRight, Bookmark, Check, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import SiteLayout from "@/components/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchlist } from "@/hooks/useWatchlist";
import { formatGrowth, formatMembers, formatPrice, formatScore } from "@/lib/format";
import { trpc } from "@/lib/trpc";

function Change({ current, previous, suffix = "" }: { current: number; previous: number; suffix?: string }) {
  const delta = current - previous;
  if (delta === 0) return <span className="text-muted-foreground">No change</span>;
  return (
    <span className={delta > 0 ? "text-[oklch(0.5_0.12_155)]" : "text-[oklch(0.55_0.18_25)]"}>
      {delta > 0 ? "+" : ""}{delta.toLocaleString()}{suffix} since saved
    </span>
  );
}

export default function Watchlist() {
  const watchlist = useWatchlist();
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<string[]>([]);
  const { data: communities, isLoading } = trpc.communities.bySlugs.useQuery(
    { slugs: watchlist.slugs },
    { enabled: watchlist.slugs.length > 0 },
  );

  useEffect(() => {
    document.title = "Your Skool community watchlist · TrustSkool";
  }, []);

  const savedBySlug = useMemo(
    () => new Map(watchlist.entries.map(entry => [entry.slug, entry])),
    [watchlist.entries],
  );

  const toggleSelected = (slug: string) => {
    setSelected(current =>
      current.includes(slug)
        ? current.filter(item => item !== slug)
        : current.length < 4
          ? [...current, slug]
          : current,
    );
  };

  const compare = () => {
    if (selected.length >= 2) navigate(`/compare?slugs=${encodeURIComponent(selected.join(","))}`);
  };

  return (
    <SiteLayout>
      <div className="container py-8 md:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Saved locally · no account required</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Your watchlist</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Track price, members, growth and TrustSkore changes on this device. Select two to four communities to compare them side by side.
            </p>
          </div>
          <button
            type="button"
            onClick={compare}
            disabled={selected.length < 2}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[4px] bg-[#F8D481] px-5 text-sm font-bold text-[#202124] disabled:cursor-not-allowed disabled:opacity-40">
            Compare {selected.length > 0 ? selected.length : ""} <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {watchlist.count === 0 ? (
          <div className="mt-10 rounded-[4px] border border-dashed border-border bg-card px-6 py-16 text-center">
            <Bookmark className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Nothing saved yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Open a community and press Watch to start tracking it.
            </p>
            <Link href="/" className="mt-5 inline-flex h-10 items-center rounded-[4px] bg-foreground px-4 text-sm font-semibold text-background">
              Browse communities
            </Link>
          </div>
        ) : isLoading ? (
          <div className="mt-8 space-y-3">
            {watchlist.entries.map(entry => <Skeleton key={entry.slug} className="h-36 w-full" />)}
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {(communities ?? []).map(community => {
              const saved = savedBySlug.get(community.slug);
              if (!saved) return null;
              const checked = selected.includes(community.slug);
              return (
                <article key={community.slug} className={`rounded-[4px] border bg-card p-4 sm:p-5 ${checked ? "border-foreground" : "border-border"}`}>
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSelected(community.slug)}
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border ${checked ? "border-foreground bg-foreground text-background" : "border-border"}`}
                      aria-label={`${checked ? "Remove" : "Add"} ${community.displayName} ${checked ? "from" : "to"} comparison`}>
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </button>
                    {community.logoUrl && <img src={community.logoUrl} alt="" className="h-11 w-11 rounded-full border border-border object-cover" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <Link href={`/community/${community.slug}`} className="font-semibold hover:underline">
                            {community.displayName}
                          </Link>
                          <p className="mt-1 text-xs text-muted-foreground">Saved {new Date(saved.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => watchlist.refresh(community)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-border hover:bg-accent"
                            title="Use current values as the new baseline">
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => watchlist.toggle(community)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                            title="Remove from watchlist">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                        <div><p className="text-xs text-muted-foreground">Members</p><p className="font-semibold">{formatMembers(community.totalMembers)}</p><p className="mt-0.5 text-[11px]"><Change current={community.totalMembers} previous={saved.snapshot.totalMembers} /></p></div>
                        <div><p className="text-xs text-muted-foreground">Price</p><p className="font-semibold">{formatPrice(community.priceAmountCents, community.priceInterval)}</p><p className="mt-0.5 text-[11px]">{community.priceAmountCents === saved.snapshot.priceAmountCents ? <span className="text-muted-foreground">No change</span> : <span className="text-[oklch(0.55_0.18_25)]">Price changed</span>}</p></div>
                        <div><p className="text-xs text-muted-foreground">30d growth</p><p className="font-semibold">{formatGrowth(community.growthRateBp)}</p><p className="mt-0.5 text-[11px]"><Change current={community.growthRateBp / 100} previous={saved.snapshot.growthRateBp / 100} suffix=" pts" /></p></div>
                        <div><p className="text-xs text-muted-foreground">TrustSkore</p><p className="font-semibold">{formatScore(community.trustSkore)}</p><p className="mt-0.5 text-[11px]"><Change current={Number(community.trustSkore.toFixed(1))} previous={Number(saved.snapshot.trustSkore.toFixed(1))} /></p></div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
