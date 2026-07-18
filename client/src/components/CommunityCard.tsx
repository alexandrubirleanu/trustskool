import { ChevronRight, TrendingDown, TrendingUp, Users, Zap } from "lucide-react";
import { Link } from "wouter";
import { useDatafast } from "@/hooks/useDatafast";
import {
  formatCategory,
  formatGrowth,
  formatMembers,
  formatPrice,
  formatScore,
  getPriceType,
  SCORE_TIER_CLASSES,
  scoreTier,
  capitalize,
} from "@/lib/format";

export interface CommunityListItem {
  slug: string;
  displayName: string;
  description: string | null;
  totalMembers: number;
  priceAmountCents: number | null;
  priceInterval: string | null;
  logoUrl: string | null;
  language: string;
  category: string | null;
  trustSkore: number;
  growthRateBp: number;
}

function Avatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} community logo`}
        loading="lazy"
        className="h-10 w-10 shrink-0 rounded-full border border-border object-cover sm:h-12 sm:w-12"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-xs font-semibold text-foreground sm:h-12 sm:w-12 sm:text-sm">
      {initials}
    </span>
  );
}

export default function CommunityCard({
  community,
  rank,
}: {
  community: CommunityListItem;
  rank: number;
}) {
  const growth = community.growthRateBp;
  const GrowthIcon = growth >= 0 ? TrendingUp : TrendingDown;
  const { track } = useDatafast();
  const priceType = getPriceType(community.priceAmountCents, community.priceInterval);

  return (
    <Link
      href={`/community/${community.slug}`}
      onClick={() =>
        track("community_click", {
          slug: community.slug,
          community_name: community.displayName.slice(0, 100),
          price_type: priceType,
        })
      }
      className="group flex items-center gap-3 border-b border-border bg-card px-3 py-3 transition-colors first:rounded-t-[4px] last:rounded-b-[4px] last:border-b-0 hover:bg-accent sm:gap-4 sm:px-5 sm:py-4">
      <span className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground tabular-nums sm:w-7 sm:text-sm">
        {rank}
      </span>

      <Avatar name={community.displayName} logoUrl={community.logoUrl} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className="truncate text-[15px] font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}>
            {community.displayName}
          </h3>
          {community.growthRateBp > 0 && (
            <span className="badge-trending" aria-label="Trending">
              <Zap className="h-2.5 w-2.5" />
              Trending
            </span>
          )}
          {priceType === "free" && <span className="badge-free">Free</span>}
        </div>
        {community.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
            {community.description}
          </p>
        )}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0 text-xs text-muted-foreground sm:mt-1 sm:gap-x-3">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {formatMembers(community.totalMembers)}
          </span>
          <span>{formatPrice(community.priceAmountCents, community.priceInterval)}</span>
          <span
            className={`inline-flex items-center gap-1 ${growth >= 0 ? "text-[oklch(0.5_0.12_155)]" : "text-[oklch(0.55_0.18_25)]"}`}>
            <GrowthIcon className="h-3 w-3" />
            {formatGrowth(growth)}
          </span>
          {community.category && (
            <span className="hidden sm:inline">{formatCategory(community.category)}</span>
          )}
          <span className="hidden md:inline">{capitalize(community.language)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={`flex h-10 w-10 flex-col items-center justify-center rounded-[4px] text-sm font-bold tabular-nums sm:h-11 sm:w-11 ${SCORE_TIER_CLASSES[scoreTier(community.trustSkore)]}`}
          title={`TrustSkore ${formatScore(community.trustSkore)}`}>
          {formatScore(community.trustSkore)}
        </span>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </div>
    </Link>
  );
}
