import { Bookmark, ExternalLink, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useSearch } from "wouter";
import SiteLayout from "@/components/SiteLayout";
import WatchlistButton from "@/components/WatchlistButton";
import { getDataConfidence } from "@/lib/dataConfidence";
import { capitalize, formatCategory, formatGrowth, formatMembers, formatPrice, formatScore } from "@/lib/format";
import { trpc } from "@/lib/trpc";

export default function Compare() {
  const search = useSearch();
  const slugs = useMemo(() => {
    const value = new URLSearchParams(search).get("slugs") ?? "";
    return Array.from(new Set(value.split(",").map(v => v.trim()).filter(Boolean))).slice(0, 4);
  }, [search]);
  const { data: communities, isLoading } = trpc.communities.bySlugs.useQuery(
    { slugs },
    { enabled: slugs.length > 0 },
  );

  useEffect(() => {
    document.title = "Compare Skool communities · TrustSkool";
  }, []);

  const remove = (slug: string) => {
    const next = slugs.filter(item => item !== slug);
    window.history.replaceState({}, "", next.length ? `/compare?slugs=${encodeURIComponent(next.join(","))}` : "/compare");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const rows = [
    { label: "TrustSkore", value: (c: NonNullable<typeof communities>[number]) => formatScore(c.trustSkore) },
    { label: "Data confidence", value: (c: NonNullable<typeof communities>[number]) => `${getDataConfidence(c).level} (${getDataConfidence(c).score}%)` },
    { label: "Members", value: (c: NonNullable<typeof communities>[number]) => formatMembers(c.totalMembers) },
    { label: "30-day growth", value: (c: NonNullable<typeof communities>[number]) => formatGrowth(c.growthRateBp) },
    { label: "Price", value: (c: NonNullable<typeof communities>[number]) => formatPrice(c.priceAmountCents, c.priceInterval) },
    { label: "Category", value: (c: NonNullable<typeof communities>[number]) => formatCategory(c.category) || "—" },
    { label: "Language", value: (c: NonNullable<typeof communities>[number]) => capitalize(c.language) },
    { label: "Growth momentum", value: (c: NonNullable<typeof communities>[number]) => c.scoreBreakdown ? formatScore(c.scoreBreakdown.growth_momentum) : "—" },
    { label: "Ranking momentum", value: (c: NonNullable<typeof communities>[number]) => c.scoreBreakdown ? formatScore(c.scoreBreakdown.ranking_momentum) : "—" },
    { label: "Price stability", value: (c: NonNullable<typeof communities>[number]) => c.scoreBreakdown ? formatScore(c.scoreBreakdown.price_stability) : "—" },
    { label: "Founder engagement", value: (c: NonNullable<typeof communities>[number]) => c.scoreBreakdown?.owner_engagement != null ? formatScore(c.scoreBreakdown.owner_engagement) : "No data" },
  ];

  return (
    <SiteLayout>
      <div className="container py-8 md:py-12">
        <p className="text-sm font-semibold text-muted-foreground">Decision tool</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Compare Skool communities</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Compare up to four saved communities. This URL can be bookmarked or shared.</p>

        {slugs.length < 2 ? (
          <div className="mt-10 rounded-[4px] border border-dashed border-border bg-card px-6 py-16 text-center">
            <Bookmark className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Choose at least two communities</h2>
            <p className="mt-2 text-sm text-muted-foreground">Select communities from your watchlist to create a comparison.</p>
            <Link href="/watchlist" className="mt-5 inline-flex h-10 items-center rounded-[4px] bg-foreground px-4 text-sm font-semibold text-background">Open watchlist</Link>
          </div>
        ) : isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading comparison…</p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-[4px] border border-border bg-card">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-44 bg-muted/30 p-4 text-xs uppercase tracking-wide text-muted-foreground">Metric</th>
                  {(communities ?? []).map(community => (
                    <th key={community.slug} className="min-w-48 p-4 align-top">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/community/${community.slug}`} className="font-semibold hover:underline">{community.displayName}</Link>
                        <button type="button" onClick={() => remove(community.slug)} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${community.displayName}`}><X className="h-4 w-4" /></button>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <WatchlistButton community={community} compact />
                        <a href={`/go/${community.slug}`} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex h-9 items-center gap-1 rounded-[4px] bg-[#F8D481] px-3 text-xs font-bold text-[#202124]">Visit <ExternalLink className="h-3.5 w-3.5" /></a>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <th className="bg-muted/30 p-4 text-xs font-medium text-muted-foreground">{row.label}</th>
                    {(communities ?? []).map(community => <td key={community.slug} className="p-4 font-medium tabular-nums">{row.value(community)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
