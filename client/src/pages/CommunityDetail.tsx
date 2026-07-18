import { ArrowLeft, ExternalLink, TrendingDown, TrendingUp, Users, Zap } from "lucide-react";
import { useEffect, useMemo } from "react";
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
import SiteLayout from "@/components/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  capitalize,
  formatCategory,
  formatGrowth,
  formatMembers,
  formatPrice,
  formatScore,
  SCORE_TIER_CLASSES,
  scoreTier,
} from "@/lib/format";
import { trpc } from "@/lib/trpc";

const CHART_INK = "oklch(0.2436 0.0048 247.9)";
const CHART_GRID = "oklch(0.9161 0.0015 84.57)";
const CHART_MUTED = "oklch(0.6538 0 0)";

const SUB_INDICATORS: {
  key: "growth_momentum" | "ranking_momentum" | "price_stability";
  label: string;
  weight: string;
  description: string;
}[] = [
  {
    key: "growth_momentum",
    label: "Growth Momentum",
    weight: "45%",
    description: "How fast the member base grew over the recent window.",
  },
  {
    key: "ranking_momentum",
    label: "Ranking Momentum",
    weight: "35%",
    description: "Movement in Skool's discovery ranking over time.",
  },
  {
    key: "price_stability",
    label: "Price Stability",
    weight: "20%",
    description: "How consistent the entry price has stayed.",
  },
];

function shortDate(value: string) {
  const d = new Date(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[4px] border border-border bg-card p-4 sm:p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 h-56">{children}</div>
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

  const { data: similar } = trpc.communities.similar.useQuery(
    {
      slug,
      language: community?.language ?? "english",
      category: community?.category ?? null,
    },
    { enabled: Boolean(community) },
  );

  useEffect(() => {
    if (community) {
      document.title = `${community.displayName} — TrustSkore ${formatScore(community.trustSkore)} | TrustSkool`;
    }
  }, [community]);

  const memberData = useMemo(
    () =>
      (community?.memberHistory ?? []).map(p => ({
        date: p.date,
        members: p.total_members,
      })),
    [community],
  );
  const priceData = useMemo(
    () =>
      (community?.priceHistory ?? []).map(p => ({
        date: p.date,
        price: (p.price_amount_cents ?? 0) / 100,
      })),
    [community],
  );
  const rankData = useMemo(
    () =>
      (community?.rankHistory ?? []).map(p => ({
        date: p.date,
        rank: p.discovery_rank,
      })),
    [community],
  );

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

  const isFree = !community.priceAmountCents || community.priceAmountCents === 0;
  const isTrending = community.growthRateBp > 0;

  return (
    <SiteLayout>
      {/* Sticky mobile CTA bar */}
      <div className="sticky top-16 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-sm md:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{community.displayName}</p>
          <p className="text-xs text-muted-foreground">
            TrustSkore <span className="font-bold text-foreground">{formatScore(community.trustSkore)}</span>
          </p>
        </div>
        <a
          href={`/go/${community.slug}`}
          rel="sponsored noopener noreferrer"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[4px] bg-[#F8D481] px-4 text-sm font-bold text-[#202124] transition-transform active:scale-[0.97]">
          {isFree ? "Join Free" : "Start on Skool for $9"} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="container py-8 md:py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to rankings
        </Link>

        {/* Header */}
        <header className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            {community.logoUrl ? (
              <img
                src={community.logoUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-lg font-semibold">
                {community.displayName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map(w => w[0]?.toUpperCase() ?? "")
                  .join("")}
              </span>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {community.displayName}
                </h1>
                {isTrending && (
                  <span className="badge-trending" aria-label="Trending">
                    <Zap className="h-3 w-3" />
                    Trending
                  </span>
                )}
                {isFree && (
                  <span className="badge-free">Free</span>
                )}
              </div>
              {community.description && (
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                  {community.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {formatMembers(community.totalMembers)} members
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 ${growth >= 0 ? "text-[oklch(0.5_0.12_155)]" : "text-[oklch(0.55_0.18_25)]"}`}>
                  <GrowthIcon className="h-4 w-4" /> {formatGrowth(growth)} / 30d
                </span>
                <span>{formatPrice(community.priceAmountCents, community.priceInterval)}</span>
                {community.category && <span>{formatCategory(community.category)}</span>}
                <span>{capitalize(community.language)}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-[4px] text-xl font-bold tabular-nums ${SCORE_TIER_CLASSES[scoreTier(community.trustSkore)]}`}>
                {formatScore(community.trustSkore)}
              </span>
              <div>
                <p className="text-sm font-semibold">TrustSkore</p>
                <p className="text-xs text-muted-foreground">out of 100</p>
              </div>
            </div>
            <a
              href={`/go/${community.slug}`}
              rel="sponsored noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-[4px] bg-[#F8D481] px-6 text-sm font-bold text-[#202124] transition-transform active:scale-[0.97]">
              {isFree ? "Join Free" : "Start on Skool for $9"} <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </header>

        {/* Score breakdown */}
        <section className="mt-10" aria-labelledby="breakdown-heading">
          <h2 id="breakdown-heading" className="text-lg font-semibold">
            TrustSkore breakdown
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {SUB_INDICATORS.map(ind => {
              const value = breakdown?.[ind.key] ?? 0;
              return (
                <div key={ind.key} className="rounded-[4px] border border-border bg-card p-5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-semibold">{ind.label}</h3>
                    <span className="text-xs text-muted-foreground">weight {ind.weight}</span>
                  </div>
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
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {ind.description}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            How is this computed?{" "}
            <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
              Read the methodology
            </Link>
            .
          </p>
        </section>

        {/* Charts */}
        <section className="mt-10" aria-labelledby="charts-heading">
          <h2 id="charts-heading" className="text-lg font-semibold">
            Growth history
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <ChartCard title="Members">
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

            <ChartCard title="Price (USD)">
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

            <ChartCard title="Discovery rank (lower is better)">
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

        {/* Similar communities */}
        {similar && similar.length > 0 && (
          <section className="mt-12" aria-labelledby="similar-heading">
            <h2 id="similar-heading" className="text-lg font-semibold">
              Similar communities
            </h2>
            <div className="mt-4 rounded-[4px] border border-border">
              {similar.map((c, i) => (
                <CommunityCard key={c.slug} community={c} rank={i + 1} />
              ))}
            </div>
          </section>
        )}

        {/* Bottom conversion CTA */}
        <div className="mt-12 flex flex-col items-center gap-4 rounded-[4px] border border-border bg-card px-6 py-10 text-center">
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Ready to join <strong className="font-semibold text-foreground">{community.displayName}</strong>?
            {isFree
              ? " It's free — no credit card required."
              : " Check the latest pricing and join directly on Skool."}
          </p>
          <a
            href={`/go/${community.slug}`}
            rel="sponsored noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-[4px] bg-[#F8D481] px-8 text-sm font-bold text-[#202124] transition-transform active:scale-[0.97]">
            {isFree ? `Join ${community.displayName} — Free` : `Start on Skool for $9/mo`} <ExternalLink className="h-4 w-4" />
          </a>
          <p className="text-xs text-muted-foreground">
            You'll be redirected to Skool. TrustSkool is not affiliated with Skool.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
