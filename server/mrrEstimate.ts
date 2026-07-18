/**
 * MRR Estimate Logic
 *
 * Derives an estimated monthly revenue range for a Skool community using:
 * 1. A naive per-community ceiling: totalMembers × priceAmountCents
 * 2. The owner's public Skool MRR badge tier bounds
 * 3. Intersection / multi-community allocation when the owner runs several communities
 *
 * All figures are in USD cents internally; the public API returns USD dollars.
 */

export type MrrStatus =
  | "none"
  | "clover"
  | "liftoff"   // observed in real data; treat same as rocket ($10k+)
  | "rocket"
  | "crown"
  | "diamond"
  | "red_diamond"
  | "goat"      // observed in real data; treat same as goated
  | "goated";

/** MRR tier bounds in USD cents (low inclusive, high exclusive / null = open-ended) */
const TIER_BOUNDS: Record<MrrStatus, { low: number; high: number | null }> = {
  none: { low: 0, high: 300_000 },           // $0 – $3,000
  clover: { low: 300_000, high: 1_000_000 },  // $3k – $10k
  liftoff: { low: 1_000_000, high: 3_000_000 }, // $10k – $30k (alias for rocket)
  rocket: { low: 1_000_000, high: 3_000_000 }, // $10k – $30k
  crown: { low: 3_000_000, high: 10_000_000 }, // $30k – $100k
  diamond: { low: 10_000_000, high: 30_000_000 }, // $100k – $300k
  red_diamond: { low: 30_000_000, high: 100_000_000 }, // $300k – $1M
  goat: { low: 100_000_000, high: null },    // $1M+ (alias for goated)
  goated: { low: 100_000_000, high: null },  // $1M+
};

export type MrrEstimateResult = {
  /** Lower bound in USD (whole dollars) */
  low: number;
  /** Upper bound in USD (whole dollars), null = open-ended (goated) */
  high: number | null;
  /** Human-readable label e.g. "$28k–$100k/month" */
  label: string;
  /** Whether the estimate is backed by the owner's MRR badge */
  reinforced: boolean;
  /** Extra note to display when ranges don't overlap or multi-community */
  note: string | null;
  /** Number of communities the owner operates (for multi-community note) */
  ownerCommunityCount: number;
};

function fmtUsd(cents: number): string {
  const dollars = Math.round(cents / 100);
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${Math.round(dollars / 1_000)}k`;
  return `$${dollars.toLocaleString()}`;
}

export type OwnedCommunityEntry = {
  slug: string;
  display_name: string;
  total_members: number;
  afl_percent: number | null;
};

/**
 * Compute the MRR estimate for a single community.
 *
 * @param slug - Community slug (to find this community in the owner's list)
 * @param priceAmountCents - Community price in cents (null = free)
 * @param totalMembers - Current member count
 * @param mrrStatus - Owner's Skool MRR badge (null = no profile scraped yet)
 * @param ownedCommunities - All communities the owner operates
 */
export function computeMrrEstimate(
  slug: string,
  priceAmountCents: number | null,
  totalMembers: number,
  mrrStatus: MrrStatus | null | undefined,
  ownedCommunities: OwnedCommunityEntry[] | null | undefined,
): MrrEstimateResult | null {
  // Free communities: only show estimate if owner has a non-null MRR badge
  const isPaid = priceAmountCents != null && priceAmountCents > 0;

  // Naive per-community ceiling in cents
  const naiveCeilingCents = isPaid ? totalMembers * priceAmountCents : null;

  // No owner profile scraped yet, or status is 'none' (no public badge established)
  const hasRevenueSignal = mrrStatus && mrrStatus !== "none" && ownedCommunities && ownedCommunities.length > 0;

  if (!hasRevenueSignal) {
    if (!isPaid || naiveCeilingCents == null) return null; // free + no badge → nothing to show
    const highDollars = Math.round(naiveCeilingCents / 100);
    return {
      low: 0,
      high: highDollars,
      label: `Up to ${fmtUsd(naiveCeilingCents)}/month`,
      reinforced: false,
      note: mrrStatus === "none"
        ? "Estimated from member count × price. Creator has no public Skool revenue badge yet."
        : "Estimated from member count × price. No public creator revenue badge available yet.",
      ownerCommunityCount: 0,
    };
  }

  const tier = TIER_BOUNDS[mrrStatus!];
  const communityCount = ownedCommunities.length;

  // --- Single-community owner ---
  if (communityCount === 1) {
    if (!isPaid || naiveCeilingCents == null) {
      // Free community, badge is the only signal
      const lowDollars = Math.round(tier.low / 100);
      const highDollars = tier.high != null ? Math.round(tier.high / 100) : null;
      const label =
        tier.high != null
          ? `${fmtUsd(tier.low)}–${fmtUsd(tier.high)}/month`
          : `${fmtUsd(tier.low)}+/month`;
      return {
        low: lowDollars,
        high: highDollars,
        label,
        reinforced: true,
        note: "Based on creator's public Skool revenue badge. Free community: no per-member pricing signal available.",
        ownerCommunityCount: communityCount,
      };
    }

    // Intersect [tier.low, tier.high] ∩ [0, naiveCeilingCents]
    const intersectLow = tier.low;
    const intersectHigh =
      tier.high != null ? Math.min(tier.high, naiveCeilingCents) : naiveCeilingCents;

    if (intersectLow > naiveCeilingCents) {
      // Ranges don't overlap — show tier range with explanatory note
      const lowDollars = Math.round(tier.low / 100);
      const highDollars = tier.high != null ? Math.round(tier.high / 100) : null;
      const label =
        tier.high != null
          ? `${fmtUsd(tier.low)}–${fmtUsd(tier.high)}/month`
          : `${fmtUsd(tier.low)}+/month`;
      return {
        low: lowDollars,
        high: highDollars,
        label,
        reinforced: true,
        note:
          "This creator's badge suggests higher revenue than member count and price alone would indicate, possibly from a pricing tier or offer not reflected in the public listing.",
        ownerCommunityCount: communityCount,
      };
    }

    const lowDollars = Math.round(intersectLow / 100);
    const highDollars = Math.round(intersectHigh / 100);
    const label = `${fmtUsd(intersectLow)}–${fmtUsd(intersectHigh)}/month`;
    return {
      low: lowDollars,
      high: highDollars,
      label,
      reinforced: true,
      note: null,
      ownerCommunityCount: communityCount,
    };
  }

  // --- Multi-community owner: allocate proportionally by naive ceiling share ---
  // Compute naive ceilings for all owned communities
  const ceilings = ownedCommunities.map(c => {
    const entry = ownedCommunities.find(x => x.slug === c.slug);
    // We don't have price data for sibling communities in this call,
    // so use total_members as a proxy for relative weight
    return { slug: c.slug, weight: entry?.total_members ?? 0 };
  });

  const totalWeight = ceilings.reduce((s, c) => s + c.weight, 0);
  const thisWeight = ceilings.find(c => c.slug === slug)?.weight ?? totalMembers;
  const share = totalWeight > 0 ? thisWeight / totalWeight : 1 / communityCount;

  const allocatedLow = Math.round(tier.low * share);
  const allocatedHigh = tier.high != null ? Math.round(tier.high * share) : null;

  // Intersect with naive ceiling if available
  const finalLow = allocatedLow;
  const finalHigh =
    naiveCeilingCents != null && allocatedHigh != null
      ? Math.min(allocatedHigh, naiveCeilingCents)
      : allocatedHigh ?? (naiveCeilingCents ?? null);

  const lowDollars = Math.round(finalLow / 100);
  const highDollars = finalHigh != null ? Math.round(finalHigh / 100) : null;
  const label =
    highDollars != null
      ? `${fmtUsd(finalLow)}–${fmtUsd(finalHigh!)}/month`
      : `${fmtUsd(finalLow)}+/month`;

  return {
    low: lowDollars,
    high: highDollars,
    label,
    reinforced: true,
    note: `Estimated share across ${communityCount} communities this creator owns.`,
    ownerCommunityCount: communityCount,
  };
}
