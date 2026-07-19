import { ArrowLeft, ChevronRight, ExternalLink, TrendingDown, TrendingUp, Users, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import LiveActivityToast, { type LiveActivityItem } from "@/components/LiveActivityToast";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link, useParams } from "wouter";
import CommunityCard from "@/components/CommunityCard";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import SiteLayout from "@/components/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  capitalize,
  formatCategory,
  formatGrowth,
  formatMembers,
  formatPrice,
  formatScore,
  getMrrBadge,
  getPriceType,
  SCORE_TIER_CLASSES,
  scoreTier,
} from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { useDatafast } from "@/hooks/useDatafast";

const CHART_INK = "oklch(0.2436 0.0048 247.9)";
const CHART_GRID = "oklch(0.9161 0.0015 84.57)";
const CHART_MUTED = "oklch(0.6538 0 0)";

const SUB_INDICATORS: {
  key: "growth_momentum" | "ranking_momentum" | "price_stability" | "owner_engagement";
  label: string;
  weight: string;
  description: string;
  noDataLabel?: string;
}[] = [
  {
    key: "growth_momentum",
    label: "Growth Momentum",
    weight: "35%",
    description: "How fast the member base grew over the recent window.",
  },
  {
    key: "ranking_momentum",
    label: "Ranking Momentum",
    weight: "30%",
    description: "Movement in Skool\u2019s discovery ranking over time.",
  },
  {
    key: "price_stability",
    label: "Price Stability",
    weight: "15%",
    description: "How consistent the entry price has stayed.",
  },
  {
    key: "owner_engagement",
    label: "Owner Engagement",
    weight: "20%",
    description: "How recently and frequently the founder is active in the community.",
    noDataLabel: "No data yet",
  },
];

function shortDate(value: string) {
  const d = new Date(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ChartCard({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="rounded-[4px] border border-border bg-card p-4 sm:p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {empty ? (
        <div className="mt-3 flex h-36 items-center justify-center sm:h-56">
          <p className="text-center text-xs text-muted-foreground">
            Tracking started recently. Chart will populate over the next few weeks.
          </p>
        </div>
      ) : (
        <div className="mt-3 h-36 sm:h-56">{children}</div>
      )}
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 4,
  border: `1px solid ${CHART_GRID}`,
  background: "#fff",
  fontSize: 12,
} as const;

export default function CommunityDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  const { data: community, isLoading } = trpc.communities.bySlug.useQuery(
    { slug },
    { enabled: Boolean(slug) },
  );

  const { data: mrrEstimate } = trpc.communities.mrrEstimate.useQuery(
    { slug },
    { enabled: Boolean(slug) },
  );

  const { data: founderPage } = trpc.content.founderByCommunitySlug.useQuery(
    { slug },
    { enabled: Boolean(slug) },
  );

  const { data: similar } = trpc.communities.similar.useQuery(
    {
      slug,
      language: community?.language ?? "english",
      category: community?.category ?? null,
    },
    { enabled: Boolean(community) },
  );

  const { track } = useDatafast();

  // Ref on the main CTA block; sticky bar appears only when this is off-screen
  const mainCtaRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const el = mainCtaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [community?.slug]);

  useEffect(() => {
    if (community) {
      document.title = `${community.displayName} · TrustSkore ${formatScore(community.trustSkore)} | TrustSkool`;
      // Track community page view
      track("community_view", {
        slug: community.slug,
        community_name: community.displayName.slice(0, 100),
        price_type: getPriceType(community.priceAmountCents, community.priceInterval),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [community?.slug]);

  // Period selector: 7 / 30 / 90 days
  const [period, setPeriod] = useState<7 | 30 | 90>(7);

  // Filter history arrays to the selected period window
  function filterByPeriod<T extends { date: string }>(arr: T[], days: number): T[] {
    if (!arr.length) return arr;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const filtered = arr.filter(p => p.date >= cutoffStr);
    // Always include at least the first available point so the chart isn't empty
    return filtered.length >= 2 ? filtered : arr.slice(-Math.min(arr.length, days));
  }

  const allMemberData = useMemo(
    () =>
      (community?.memberHistory ?? []).map(p => ({
        date: p.date,
        members: p.total_members,
      })),
    [community],
  );
  const allPriceData = useMemo(
    () =>
      (community?.priceHistory ?? []).map(p => ({
        date: p.date,
        price: (p.price_amount_cents ?? 0) / 100,
      })),
    [community],
  );
  const allRankData = useMemo(
    () =>
      (community?.rankHistory ?? []).map(p => ({
        date: p.date,
        rank: p.discovery_rank,
      })),
    [community],
  );

  const memberData = useMemo(() => filterByPeriod(allMemberData, period), [allMemberData, period]);
  const priceData  = useMemo(() => filterByPeriod(allPriceData, period),  [allPriceData,  period]);
  const rankData   = useMemo(() => filterByPeriod(allRankData, period),   [allRankData,   period]);

  // Available periods — only unlock 30d/90d when we have enough data
  const availablePeriods = useMemo(() => {
    const total = allMemberData.length;
    return [
      { label: "7d",  value: 7  as const, enabled: true },
      { label: "30d", value: 30 as const, enabled: total >= 10 },
      { label: "90d", value: 90 as const, enabled: total >= 30 },
    ];
  }, [allMemberData]);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container py-10">
          <Skeleton className="h-8 w-40" />
          <div className="mt-6 flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} className="h-40 rounded-[4px]" />
            ))}
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!community) {
    return (
      <SiteLayout>
        <div className="container py-24 text-center">
          <h1 className="text-2xl font-semibold">Community not found</h1>
          <p className="mt-2 text-muted-foreground">
            This community is not in the TrustSkool index (yet).
          </p>
          <Link href="/" className="chip mt-6 inline-flex">
            Back to rankings
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const breakdown = community.scoreBreakdown;
  const growth = community.growthRateBp;
  const GrowthIcon = growth >= 0 ? TrendingUp : TrendingDown;

  const priceType = getPriceType(community.priceAmountCents, community.priceInterval);
  const isFree = priceType === "free";
  const isTrending = community.growthRateBp > 0;

  /** CTA label for Join buttons, context-aware per price type */
  function ctaLabel(context: "short" | "long"): string {
    const name = community!.displayName;
    const price = Math.round((community!.priceAmountCents ?? 900) / 100);
    if (priceType === "free") return context === "short" ? `Join ${name}` : `Join ${name} (Free)`;
    if (priceType === "annual") return `Join for $${price}/yr`;
    if (priceType === "one_time") return `Join for $${price}`;
    return `Join for $${price}/mo`;
  }

  return (
    <SiteLayout>
      {/* Sticky bottom CTA bar — visible on mobile only when main CTA is scrolled off-screen */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-2 border-t border-border bg-background/95 px-3 py-2 backdrop-blur-sm transition-transform duration-200 md:hidden ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold leading-tight">{community.displayName}</p>
          <p className="text-[11px] text-muted-foreground">
            TrustSkore <span className="font-bold text-foreground">{formatScore(community.trustSkore)}</span>
          </p>
        </div>
        <a
          href={`/go/${community.slug}`}
          target="_blank" rel="sponsored noopener noreferrer"
          onClick={() => track("community_click", { slug: community.slug, community_name: community.displayName.slice(0, 100), price_type: priceType, source: "mobile_bar" })}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-[4px] bg-[#F8D481] px-3 text-xs font-bold text-[#202124] transition-transform active:scale-[0.97]">
          {ctaLabel("short")} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="container py-5 md:py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          {community.category ? (
            <>
              <Link
                href={`/categories/${community.category}`}
                className="transition-colors hover:text-foreground">
                {formatCategory(community.category)}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </>
          ) : (
            <>
              <Link href="/rankings" className="transition-colors hover:text-foreground">Rankings</Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </>
          )}
          <span className="max-w-[200px] truncate font-medium text-foreground sm:max-w-xs">
            {community.displayName}
          </span>
        </nav>

        {/* Fraud/scam flag banner */}
        {community.isFlagged && (
          <DisclaimerBanner
            level={community.isFlagged === "warning" ? "warning" : "caution"}
            message={
              community.isFlagged === "warning"
                ? (community.flagReason ?? "This community has been flagged following verified fraud reports and removed from active rankings. Its affiliate link has been suspended.")
                : (community.flagReason ?? "This community is currently under review following credible reports. TrustSkool has not verified these reports. Exercise caution before joining.")
            }
            cta={{ label: "Fraud policy", href: "/policy/fraud-response" }}
            className="mt-6"
          />
        )}

        {/* Header */}
        <header className="mt-4 flex flex-col gap-4 md:mt-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3 md:gap-4">
            {community.logoUrl ? (
              <img
                src={community.logoUrl}
                alt={`${community.displayName} logo`}
                fetchPriority="high"
                className="h-14 w-14 shrink-0 rounded-full border border-border object-cover md:h-16 md:w-16"
              />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-base font-semibold md:h-16 md:w-16 md:text-lg">
                {community.displayName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map(w => w[0]?.toUpperCase() ?? "")
                  .join("")}
              </span>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                  {community.displayName}
                </h1>
                {isTrending && (
                  <span className="badge-trending" aria-label="Trending">
                    <Zap className="h-3 w-3" />
                    Trending
                  </span>
                )}
                {isFree && <span className="badge-free">Free</span>}
              </div>
              {community.description && (
                <p className="mt-1 line-clamp-2 max-w-xl text-xs leading-relaxed text-muted-foreground sm:line-clamp-none sm:text-sm md:text-[15px]">
                  {community.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {formatMembers(community.totalMembers)} members
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 ${growth >= 0 ? "text-[oklch(0.5_0.12_155)]" : "text-[oklch(0.55_0.18_25)]"}`}>
                  <GrowthIcon className="h-4 w-4" /> {formatGrowth(growth)} / 30d
                </span>
                <span>{formatPrice(community.priceAmountCents, community.priceInterval)}</span>
                {community.category && (
                  <span className="inline-flex items-center gap-1">
                    {formatCategory(community.category)}
                    {(community as any).categoryRank && (community as any).categoryRank <= 100 && (
                      <span className="rounded-[3px] bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        #{(community as any).categoryRank} in category
                      </span>
                    )}
                  </span>
                )}
                <span>{capitalize(community.language)}</span>
                {getMrrBadge((community as any).mrrStatus) && (
                  <span
                    title={`Est. revenue: ${getMrrBadge((community as any).mrrStatus)!.range} (Skool-verified minimum)`}
                    className="inline-flex items-center gap-1 rounded-[3px] bg-[oklch(0.97_0.04_140)] px-1.5 py-0.5 text-[10px] font-semibold text-[oklch(0.45_0.12_140)]">
                    {getMrrBadge((community as any).mrrStatus)!.emoji} {getMrrBadge((community as any).mrrStatus)!.range}
                  </span>
                )}
                {(community as any).ownerLastActiveAt && (() => {
                  const daysSince = Math.floor((Date.now() - new Date((community as any).ownerLastActiveAt).getTime()) / 86_400_000);
                  const label = daysSince === 0 ? 'Founder active today' : daysSince === 1 ? 'Founder active yesterday' : `Founder active ${daysSince}d ago`;
                  const isRecent = daysSince <= 7;
                  const isStale = daysSince > 30;
                  return (
                    <span
                      title="Last time the community founder was active on Skool"
                      className={`inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold ${
                        isRecent
                          ? 'bg-[oklch(0.97_0.04_140)] text-[oklch(0.45_0.12_140)]'
                          : isStale
                          ? 'bg-[oklch(0.95_0.02_30)] text-[oklch(0.50_0.08_30)]'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                      {isRecent ? '🟢' : isStale ? '🔴' : '🟡'} {label}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Main CTA block — observed by IntersectionObserver to show/hide sticky bar */}
          <div ref={mainCtaRef} className="flex shrink-0 flex-col items-center gap-3 md:flex-col md:items-end">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-[4px] text-lg font-bold tabular-nums md:h-16 md:w-16 md:text-xl ${SCORE_TIER_CLASSES[scoreTier(community.trustSkore)]}`}>
                {formatScore(community.trustSkore)}
              </span>
              <div>
                <p className="text-sm font-semibold">TrustSkore</p>
                {breakdown?.isBootstrap ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">estimated · early data</p>
                ) : (
                  <p className="text-xs text-muted-foreground">out of 100</p>
                )}
              </div>
            </div>
            <a
              href={`/go/${community.slug}`}
              target="_blank" rel="sponsored noopener noreferrer"
              onClick={() => track("community_click", { slug: community.slug, community_name: community.displayName.slice(0, 100), price_type: priceType, source: "header" })}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[4px] bg-[#F8D481] px-6 text-sm font-bold text-[#202124] transition-transform active:scale-[0.97] md:w-auto">
              {ctaLabel("short")} <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </header>

        {/* Charts — Growth history first */}
        <section className="mt-10" aria-labelledby="charts-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 id="charts-heading" className="text-lg font-semibold">
              Growth history
            </h2>
            {/* Period selector — only shown when there’s enough data */}
            <div className="flex items-center gap-1 rounded-[4px] border border-border bg-muted/40 p-0.5">
              {availablePeriods.map(p => (
                <button
                  key={p.value}
                  disabled={!p.enabled}
                  onClick={() => setPeriod(p.value)}
                  className={`rounded-[3px] px-2.5 py-1 text-xs font-medium transition-colors ${
                    period === p.value
                      ? "bg-background text-foreground shadow-sm"
                      : p.enabled
                        ? "text-muted-foreground hover:text-foreground"
                        : "cursor-not-allowed text-muted-foreground/40"
                  }`}
                  title={!p.enabled ? `Not enough data for ${p.label} view yet` : undefined}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <ChartCard title="Members" empty={memberData.length < 2}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={memberData} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={CHART_GRID} strokeDasharray="0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={shortDate}
                    tick={{ fontSize: 11, fill: CHART_MUTED }}
                    tickLine={false}
                    axisLine={{ stroke: CHART_GRID }}
                    minTickGap={40}
                  />
                  <YAxis
                    tickFormatter={v => formatMembers(Number(v))}
                    tick={{ fontSize: 11, fill: CHART_MUTED }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={shortDate}
                    formatter={(value: number | string) => [Number(value).toLocaleString(), "Members"]}
                  />
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="members"
                    stroke={CHART_INK}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Price (USD)" empty={priceData.length < 2}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={CHART_GRID} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={shortDate}
                    tick={{ fontSize: 11, fill: CHART_MUTED }}
                    tickLine={false}
                    axisLine={{ stroke: CHART_GRID }}
                    minTickGap={40}
                  />
                  <YAxis
                    tickFormatter={v => `$${v}`}
                    tick={{ fontSize: 11, fill: CHART_MUTED }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={shortDate}
                    formatter={(value: number | string) => [
                      Number(value) === 0 ? "Free" : `$${Number(value).toFixed(2)}`,
                      "Price",
                    ]}
                  />
                  <Line
                    isAnimationActive={false}
                    type="stepAfter"
                    dataKey="price"
                    stroke={CHART_INK}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Discovery rank (lower is better)" empty={rankData.length < 2}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rankData} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={CHART_GRID} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={shortDate}
                    tick={{ fontSize: 11, fill: CHART_MUTED }}
                    tickLine={false}
                    axisLine={{ stroke: CHART_GRID }}
                    minTickGap={40}
                  />
                  <YAxis
                    reversed
                    tick={{ fontSize: 11, fill: CHART_MUTED }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={shortDate}
                    formatter={(value: number | string) => [`#${value}`, "Rank"]}
                  />
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="rank"
                    stroke={CHART_INK}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>

        {/* Score breakdown */}
        <section className="mt-10" aria-labelledby="breakdown-heading">
          <h2 id="breakdown-heading" className="text-lg font-semibold">
            TrustSkore breakdown
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {SUB_INDICATORS.map(ind => {
              // owner_engagement: null means no data yet (not zero/inactive) — show neutral state
              const rawValue = breakdown?.[ind.key];
              const hasData = rawValue != null;
              const value = rawValue ?? 50; // neutral 50 for display when no data
              const isNoData = ind.noDataLabel && !hasData;
              return (
                <div key={ind.key} className="rounded-[4px] border border-border bg-card p-5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-semibold">{ind.label}</h3>
                    <span className="text-xs text-muted-foreground">weight {ind.weight}</span>
                  </div>
                  {isNoData ? (
                    <>
                      <p className="mt-3 text-lg font-semibold text-muted-foreground">{ind.noDataLabel}</p>
                      <div
                        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
                        role="progressbar"
                        aria-valuenow={50}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${ind.label} — no data yet`}>
                        <div className="h-full w-1/2 rounded-full bg-muted-foreground/30" />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 text-3xl font-bold tabular-nums">{formatScore(value)}</p>
                      <div
                        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
                        role="progressbar"
                        aria-valuenow={Math.round(value)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={ind.label}>
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                        />
                      </div>
                    </>
                  )}
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {ind.description}
                  </p>
                </div>
              );
            })}
          </div>
          {breakdown?.isBootstrap && (
            <p className="mt-3 flex items-start gap-1.5 rounded-[4px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm.75 4.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5ZM8 11a.875.875 0 1 0 0-1.75A.875.875 0 0 0 8 11Z"/>
              </svg>
              <span>
                <strong className="font-semibold">Initial score estimated from community size.</strong> Refines with real growth data as tracking accumulates.
              </span>
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            How is this computed?{" "}
            <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
              Read the methodology
            </Link>
            .
          </p>
        </section>

        {/* MRR Estimate */}
        {mrrEstimate && (
          <section className="mt-10" aria-labelledby="mrr-heading">
            <div className="flex items-center gap-2">
              <h2 id="mrr-heading" className="text-lg font-semibold">Estimated Revenue</h2>
              <a
                href="/methodology#mrr"
                title="How is this estimated?"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                aria-label="Revenue estimate methodology">
                ?
              </a>
            </div>
            <div className="mt-3 rounded-[4px] border border-border bg-card p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-2xl font-bold tabular-nums tracking-tight">
                    {mrrEstimate.label}
                  </p>
                  {mrrEstimate.reinforced ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reinforced by creator’s public Skool revenue badge
                      {mrrEstimate.ownerCommunityCount > 1 && (
                        <> — estimated share across {mrrEstimate.ownerCommunityCount} communities this creator owns</>
                      )}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ceiling estimate from member count × price. No public creator revenue badge available yet.
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-[4px] border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  ESTIMATE
                </span>
              </div>
              {mrrEstimate.note && (
                <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                  {mrrEstimate.note}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Founder bio — SEO: rel=author, itemprop=author for structured data */}
        {founderPage && founderPage.bodyHtml && (
          <section className="mt-12" aria-labelledby="founder-heading" itemScope itemType="https://schema.org/Person">
            <h2 id="founder-heading" className="text-lg font-semibold">About the Founder</h2>
            <div
              className="prose prose-sm mt-4 max-w-none rounded-[4px] border border-border bg-card px-4 py-4 text-foreground sm:px-6 sm:py-5 [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:text-sm [&_ul]:text-muted-foreground"
              itemProp="description"
              dangerouslySetInnerHTML={{ __html: founderPage.bodyHtml }}
            />
            {founderPage.slug && (
              <p className="mt-3 text-xs text-muted-foreground">
                <Link
                  href={`/founders/${founderPage.slug}`}
                  className="underline underline-offset-2 hover:text-foreground"
                  rel="author">
                  View full founder profile →
                </Link>
              </p>
            )}
          </section>
        )}

        {/* Similar communities — SEO: internal links with descriptive anchor text */}
        {similar && similar.length > 0 && (
          <section className="mt-12" aria-labelledby="similar-heading">
            <h2 id="similar-heading" className="text-lg font-semibold">
              Similar communities you might like
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Other Skool communities in the same niche, ranked by TrustSkore.
            </p>
            <div className="mt-4 rounded-[4px] border border-border">
              {similar.map((c, i) => (
                <CommunityCard key={c.slug} community={c} rank={i + 1} />
              ))}
            </div>
          </section>
        )}

        {/* Bottom conversion CTA */}
        <div className="mt-10 flex flex-col items-center gap-3 rounded-[4px] border border-border bg-card px-4 py-8 text-center sm:mt-12 sm:gap-4 sm:px-6 sm:py-10">
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Ready to join <strong className="font-semibold text-foreground">{community.displayName}</strong>?
            {priceType === "free" && " No credit card required."}
            {priceType === "monthly" && " Check the latest pricing on Skool."}
            {priceType === "annual" && " Check the latest pricing on Skool."}
            {priceType === "one_time" && " One-time payment for lifetime access."}
            {priceType === "paid" && " Check the latest pricing and join directly on Skool."}
          </p>
          <a
            href={`/go/${community.slug}`}
            target="_blank" rel="sponsored noopener noreferrer"
            onClick={() => track("community_click", { slug: community.slug, community_name: community.displayName.slice(0, 100), price_type: priceType, source: "bottom_cta" })}
            className="inline-flex h-11 items-center gap-2 rounded-[4px] bg-[#F8D481] px-8 text-sm font-bold text-[#202124] transition-transform active:scale-[0.97]">
            {ctaLabel("long")} <ExternalLink className="h-4 w-4" />
          </a>
          <p className="text-xs text-muted-foreground">
            You'll be redirected to Skool. TrustSkool is not affiliated with Skool.
          </p>
        </div>
      </div>
      {/* Live activity toast: shows activity from similar communities in the same niche */}
      {similar && similar.length > 0 && (
        <LiveActivityToast
          communities={similar.map((c): LiveActivityItem => ({
            slug: c.slug,
            displayName: c.displayName ?? c.slug,
            logoUrl: c.logoUrl ?? null,
          }))}
        />
      )}
    </SiteLayout>
  );
}
