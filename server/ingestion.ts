import { z } from "zod";
import type { InsertCommunity } from "../drizzle/schema";
import { serverConfig } from "./config";
import { logIngestionRun, upsertCommunity } from "./dbCommunities";
import { computeBreakdownWithBootstrap, computeGrowthRatePct, computeTrustSkoreWithFloor } from "./trustskore";

/**
 * Data ingestion from the external GitHub Actions pipeline.
 * The pipeline commits a JSON dataset to the repo; we fetch the raw file,
 * validate every record, upsert into the database and (re)compute TrustSkore.
 */

const historyPoint = z.object({ date: z.string() }).passthrough();

export const communityRecordSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  url: z.string().url(),
  display_name: z.string().min(1),
  description: z.string().nullish(),
  total_members: z.number().int().nonnegative(),
  price_amount_cents: z.number().int().nullable().optional(),
  price_currency: z.string().nullable().optional(),
  price_interval: z.string().nullable().optional(),
  logo_url: z.string().nullish(),
  language: z.string().min(1).default("english"),
  category: z.string().nullable().optional(),
  trust_score: z.number().min(0).max(100).optional(),
  score_breakdown: z
    .object({
      growth_momentum: z.number().min(0).max(100),
      ranking_momentum: z.number().min(0).max(100),
      price_stability: z.number().min(0).max(100),
    })
    .optional(),
  member_history: z
    .array(historyPoint.extend({ total_members: z.number().int().nonnegative() }))
    .optional()
    .default([]),
  price_history: z
    .array(historyPoint.extend({ price_amount_cents: z.number().int().nullable() }))
    .optional()
    .default([]),
  rank_history: z
    .array(historyPoint.extend({ discovery_rank: z.number().int().positive() }))
    .optional()
    .default([]),
  /** Owner affiliate commission % for this community (from owner_badges pipeline data) */
  afl_percent: z.number().min(0).max(100).nullable().optional(),
  /** Owner MRR badge from Skool */
  mrr_status: z.string().nullable().optional(),
  /** Owner display name */
  owner_name: z.string().nullable().optional(),
  /** Owner 30-day active streak */
  active_30d_streak: z.number().int().nonnegative().nullable().optional(),
});

export type PipelineCommunityRecord = z.infer<typeof communityRecordSchema>;

export function getDatasetUrl(): string {
  return serverConfig.datasetUrl;
}

/** Map a validated pipeline record to an InsertCommunity row, computing scores when missing */
export function toCommunityRow(record: PipelineCommunityRecord): InsertCommunity {
  const memberHistory = record.member_history ?? [];
  const priceHistory = record.price_history ?? [];
  const rankHistory = record.rank_history ?? [];

  // Always compute the bootstrap-aware breakdown so the isBootstrap flag is set
  // correctly. If the pipeline provides a score_breakdown but the community
  // qualifies for bootstrap (>= 2,000 members, < 3 snapshots), we override the
  // pipeline's neutral 50/50 sub-scores with the bootstrap values — the pipeline
  // doesn't know about our bootstrap rule and would otherwise produce a
  // misleading mediocre score for a large established community.
  const computedBreakdown = computeBreakdownWithBootstrap({
    memberHistory,
    priceHistory,
    rankHistory,
    totalMembers: record.total_members,
  });
  // Use the computed (bootstrap-aware) breakdown unless the pipeline already
  // has a non-bootstrap score AND the community has graduated (>= 3 snapshots).
  const breakdown = computedBreakdown.isBootstrap
    ? computedBreakdown                   // bootstrap: always use our values
    : (record.score_breakdown ?? computedBreakdown); // graduated: prefer pipeline
  // Recompute the composite score from the final breakdown so it's always
  // internally consistent (breakdown sub-scores always add up to the displayed score).
  const trustSkore = computeTrustSkoreWithFloor(breakdown, record.total_members, memberHistory, rankHistory);
  const growthRateBp = Math.round(computeGrowthRatePct(memberHistory) * 100);

  return {
    externalId: record.id,
    slug: record.slug,
    url: record.url,
    displayName: record.display_name,
    description: record.description ?? null,
    totalMembers: record.total_members,
    priceAmountCents: record.price_amount_cents ?? null,
    priceCurrency: record.price_currency ?? null,
    priceInterval: record.price_interval ?? null,
    logoUrl: record.logo_url ?? null,
    language: (record.language || "english").toLowerCase(),
    category: record.category ?? null,
    trustSkore,
    scoreBreakdown: breakdown,
    memberHistory,
    priceHistory,
    rankHistory,
    growthRateBp,
    aflPercent: record.afl_percent ?? null,
    mrrStatus: record.mrr_status ?? null,
    ownerName: record.owner_name ?? null,
    active30dStreak: record.active_30d_streak ?? null,
  };
}

export interface IngestionResult {
  ok: boolean;
  source: string;
  total: number;
  upserted: number;
  skipped: number;
  errors: string[];
}

export async function runIngestion(datasetUrl?: string): Promise<IngestionResult> {
  const source = datasetUrl || getDatasetUrl();
  const result: IngestionResult = { ok: false, source, total: 0, upserted: 0, skipped: 0, errors: [] };

  let raw: unknown;
  try {
    const res = await fetch(source, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Dataset fetch failed: HTTP ${res.status}`);
    raw = await res.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.errors.push(message);
    await logIngestionRun({ source, status: "error", communitiesUpserted: 0, message });
    return result;
  }

  const list = Array.isArray(raw) ? raw : (raw as { communities?: unknown[] })?.communities;
  if (!Array.isArray(list)) {
    const message = "Dataset is not an array (nor an object with a communities array)";
    result.errors.push(message);
    await logIngestionRun({ source, status: "error", communitiesUpserted: 0, message });
    return result;
  }

  result.total = list.length;
  for (const item of list) {
    const parsed = communityRecordSchema.safeParse(item);
    if (!parsed.success) {
      result.skipped++;
      if (result.errors.length < 10) {
        const slug = (item as { slug?: string })?.slug ?? "unknown";
        result.errors.push(`Record ${slug}: ${parsed.error.issues[0]?.message ?? "invalid"}`);
      }
      continue;
    }
    try {
      await upsertCommunity(toCommunityRow(parsed.data));
      result.upserted++;
    } catch (err) {
      result.skipped++;
      if (result.errors.length < 10) {
        result.errors.push(`Upsert ${parsed.data.slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  result.ok = result.upserted > 0 || result.total === 0;
  await logIngestionRun({
    source,
    status: result.ok ? "success" : "error",
    communitiesUpserted: result.upserted,
    message: result.errors.length
      ? `total=${result.total} upserted=${result.upserted} skipped=${result.skipped}; ${result.errors.join(" | ")}`
      : `total=${result.total} upserted=${result.upserted} skipped=${result.skipped}`,
  });
  return result;
}
