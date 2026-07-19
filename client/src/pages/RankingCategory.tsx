import SiteLayout from "@/components/SiteLayout";
import { trpc } from "@/lib/trpc";
import { SKOOL_CATEGORIES } from "@shared/appConfig";
import {
  formatMembers,
  formatPrice,
  formatScore,
  scoreTier,
  SCORE_TIER_CLASSES,
} from "@/lib/format";
import { Link, useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { ExternalLink, Medal, Trophy } from "lucide-react";
import { skoolCommunityUrl } from "@shared/appConfig";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" aria-label="1st place" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" aria-label="2nd place" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" aria-label="3rd place" />;
  return (
    <span className="flex h-5 w-5 items-center justify-center text-xs font-semibold text-muted-foreground">
      {rank}
    </span>
  );
}

function Avatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        loading="lazy"
        className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-xs font-semibold text-foreground">
      {initials}
    </span>
  );
}

export default function RankingCategory() {
  const params = useParams<{ category: string }>();
  const category = params.category ?? "";

  const catInfo = SKOOL_CATEGORIES.find(c => c.slug === category);
  const label = catInfo?.label ?? category.replace(/\b\w/g, c => c.toUpperCase());
  const emoji = catInfo?.emoji ?? "🏆";

  const { data, isLoading } = trpc.rankings.byCategory.useQuery(
    { category },
    { enabled: Boolean(category) },
  );

  const rankings = data?.rankings ?? [];
  const snapshotMonth = data?.snapshotMonth ?? null;

  useEffect(() => {
    if (label) {
      document.title = `Best ${label} Skool Communities · TrustSkool Rankings`;
    }
  }, [label]);

  const formattedMonth = snapshotMonth
    ? new Date(snapshotMonth + "-01").toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <SiteLayout>
      <div className="container py-10 md:py-14">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            TrustSkool
          </Link>
          <span>/</span>
          <Link href="/rankings" className="hover:text-foreground transition-colors">
            Rankings
          </Link>
          <span>/</span>
          <span className="text-foreground">{label}</span>
        </div>

        {/* Header */}
        <div className="mb-6 max-w-2xl">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            <span aria-hidden="true">{emoji}</span>
            <span>Best {label} Communities on Skool</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Ranked by TrustSkore · Updated monthly
            {formattedMonth && (
              <> · Last updated: <span className="text-foreground font-medium">{formattedMonth}</span></>
            )}
          </p>
        </div>

        {/* Rankings list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : rankings.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/30 p-8 text-center">
            <p className="text-muted-foreground">No rankings available for this category yet.</p>
            <Link href="/rankings" className="mt-4 inline-flex text-sm underline underline-offset-2 hover:text-foreground transition-colors">
              ← Back to all rankings
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map(r => {
              const tier = scoreTier(r.trustSkoreAtSnapshot);
              const tierClass = SCORE_TIER_CLASSES[tier];
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 transition-all hover:border-primary/30 hover:shadow-sm">
                  {/* Rank */}
                  <div className="flex w-6 shrink-0 items-center justify-center">
                    <RankBadge rank={r.rankPosition} />
                  </div>

                  {/* Avatar */}
                  <Avatar name={r.displayName} logoUrl={r.logoUrl} />

                  {/* Name + price */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/community/${r.communitySlug}`}
                      className="block truncate text-sm font-semibold text-card-foreground hover:text-primary transition-colors">
                      {r.displayName}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatMembers(r.totalMembersAtSnapshot)} members ·{" "}
                      {formatPrice(r.priceAmountCents, r.priceInterval)}
                    </p>
                  </div>

                  {/* TrustSkore */}
                  <div className="shrink-0 text-right">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${tierClass}`}>
                      {formatScore(r.trustSkoreAtSnapshot)}
                    </span>
                  </div>

                  {/* External link */}
                  <a
                    href={skoolCommunityUrl(r.communitySlug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Join ${r.displayName} on Skool`}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* Methodology note */}
        <div className="mt-10 rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">About these rankings</p>
          <p>
            TrustSkore is an algorithmic composite of member growth momentum, discovery-rank
            trajectory, and price stability. Only communities with at least 100 members are
            included. TrustSkore is still early for most communities (few tracked snapshots yet),
            so early rankings may look more settled than they are.{" "}
            <Link
              href="/methodology"
              className="underline underline-offset-2 hover:text-foreground transition-colors">
              Read the full methodology →
            </Link>
          </p>
        </div>

        {/* Back link */}
        <div className="mt-6">
          <Link
            href="/rankings"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← All category rankings
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
