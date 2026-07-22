export type ConfidenceCommunity = {
  memberHistory?: unknown[] | null;
  priceHistory?: unknown[] | null;
  rankHistory?: unknown[] | null;
  ownerLastActiveAt?: string | Date | null;
  ownerActiveDaysLast30?: number | null;
  scoreBreakdown?: { isBootstrap?: boolean } | null;
  lastScrapedAt?: string | Date | null;
  ingestedAt?: string | Date | null;
};

export function getDataConfidence(community: ConfidenceCommunity) {
  const snapshots = Math.max(
    community.memberHistory?.length ?? 0,
    community.priceHistory?.length ?? 0,
    community.rankHistory?.length ?? 0,
  );
  const hasOwnerData = Boolean(
    community.ownerLastActiveAt || community.ownerActiveDaysLast30 != null,
  );
  const isBootstrap = Boolean(community.scoreBreakdown?.isBootstrap);

  let score = Math.min(60, snapshots * 5);
  if (snapshots >= 7) score += 10;
  if (snapshots >= 30) score += 10;
  if (hasOwnerData) score += 15;
  if (!isBootstrap) score += 5;
  score = Math.min(100, score);

  const level = score >= 75 ? "High" : score >= 45 ? "Medium" : "Early";
  const explanation = isBootstrap
    ? `${snapshots} tracked snapshot${snapshots === 1 ? "" : "s"}; score still uses an early-data estimate.`
    : `${snapshots} tracked snapshot${snapshots === 1 ? "" : "s"}${hasOwnerData ? " plus founder activity data" : ""}.`;

  return { score, level, snapshots, hasOwnerData, isBootstrap, explanation };
}
