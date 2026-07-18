import { describe, expect, it } from "vitest";
import { skoolCommunityUrl, SKOOL_REF_CODE, SKOOL_SIGNUP_URL } from "../shared/appConfig";
import { buildClickEmail } from "./emailNotify";
import { toCommunityRow, type PipelineCommunityRecord } from "./ingestion";
import {
  computeBreakdown,
  computeGrowthMomentum,
  computeGrowthRatePct,
  computePriceStability,
  computeRankingMomentum,
  computeTrustSkore,
} from "./trustskore";

const members = (points: [string, number][]) =>
  points.map(([date, total_members]) => ({ date, total_members }));

describe("TrustSkore engine", () => {
  it("computes positive growth rate over 30 days", () => {
    const pct = computeGrowthRatePct(
      members([
        ["2026-06-15", 1000],
        ["2026-07-15", 1100],
      ]),
    );
    expect(pct).toBeCloseTo(10, 5);
  });

  it("growth momentum is neutral (50) with no history and rises with growth", () => {
    expect(computeGrowthMomentum([])).toBe(50);
    const growing = computeGrowthMomentum(
      members([
        ["2026-06-15", 1000],
        ["2026-07-15", 1200],
      ]),
    );
    expect(growing).toBeGreaterThan(80);
    const shrinking = computeGrowthMomentum(
      members([
        ["2026-06-15", 1000],
        ["2026-07-15", 900],
      ]),
    );
    expect(shrinking).toBeLessThan(50);
  });

  it("ranking momentum rewards rank improvement (lower = better)", () => {
    const improving = computeRankingMomentum([
      { date: "2026-06-15", discovery_rank: 100 },
      { date: "2026-07-15", discovery_rank: 40 },
    ]);
    const worsening = computeRankingMomentum([
      { date: "2026-06-15", discovery_rank: 40 },
      { date: "2026-07-15", discovery_rank: 100 },
    ]);
    expect(improving).toBeGreaterThan(75);
    expect(worsening).toBeLessThan(25);
  });

  it("price stability is 100 for unchanged/free prices and drops on changes", () => {
    expect(
      computePriceStability([
        { date: "2026-06-15", price_amount_cents: null },
        { date: "2026-07-15", price_amount_cents: null },
      ]),
    ).toBe(100);
    const changed = computePriceStability([
      { date: "2026-05-15", price_amount_cents: 4900 },
      { date: "2026-06-15", price_amount_cents: 5900 },
      { date: "2026-07-15", price_amount_cents: 6900 },
    ]);
    expect(changed).toBeLessThan(100);
  });

  it("TrustSkore is the weighted sum of the breakdown, clamped 0-100", () => {
    const score = computeTrustSkore({ growth_momentum: 100, ranking_momentum: 100, price_stability: 100 });
    expect(score).toBe(100);
    const mixed = computeTrustSkore({ growth_momentum: 80, ranking_momentum: 60, price_stability: 100 });
    expect(mixed).toBeCloseTo(80 * 0.45 + 60 * 0.35 + 100 * 0.2, 2);
  });
});

describe("Ingestion mapping", () => {
  const record: PipelineCommunityRecord = {
    id: "abc123",
    slug: "test-community",
    url: "https://www.skool.com/test-community",
    display_name: "Test Community",
    description: "A test community",
    total_members: 1500,
    price_amount_cents: 4900,
    price_currency: "usd",
    price_interval: "month",
    logo_url: "https://example.com/logo.png",
    language: "English",
    category: "business",
    member_history: members([
      ["2026-06-15", 1000],
      ["2026-07-15", 1500],
    ]),
    price_history: [
      { date: "2026-06-15", price_amount_cents: 4900 },
      { date: "2026-07-15", price_amount_cents: 4900 },
    ],
    rank_history: [
      { date: "2026-06-15", discovery_rank: 50 },
      { date: "2026-07-15", discovery_rank: 30 },
    ],
  };

  it("maps a pipeline record and computes missing scores", () => {
    const row = toCommunityRow(record);
    expect(row.externalId).toBe("abc123");
    expect(row.slug).toBe("test-community");
    expect(row.language).toBe("english");
    expect(row.trustSkore).toBeGreaterThan(50);
    expect(row.scoreBreakdown?.price_stability).toBe(100);
    expect(row.growthRateBp).toBe(5000); // +50% = 5000 bp
  });

  it("keeps pipeline-provided trust_score as source of truth", () => {
    const row = toCommunityRow({
      ...record,
      trust_score: 87.5,
      score_breakdown: { growth_momentum: 90, ranking_momentum: 85, price_stability: 88 },
    });
    expect(row.trustSkore).toBe(87.5);
    expect(row.scoreBreakdown?.growth_momentum).toBe(90);
  });
});

describe("Click tracking config", () => {
  it("builds redirect URLs with the affiliate ref code from one config source", () => {
    expect(skoolCommunityUrl("my-community")).toBe(
      `https://www.skool.com/my-community/about?ref=${SKOOL_REF_CODE}`,
    );
    expect(SKOOL_SIGNUP_URL).toBe(`https://www.skool.com/signup?ref=${SKOOL_REF_CODE}`);
  });

  it("click email includes community name, slug, timestamp and referrer", () => {
    const email = buildClickEmail({
      slug: "my-community",
      displayName: "My <Community>",
      referrer: "https://trustskool.com/community/my-community",
      timestamp: new Date("2026-07-18T10:00:00Z"),
      totalMembers: 1500,
      priceAmountCents: 4900,
      priceInterval: "month",
      language: "english",
      clickCount: 7,
    });
    expect(email.subject).toBe("[TrustSkool] Outbound click \u2014 My <Community>");
    expect(email.html).toContain("My &lt;Community&gt;");
    expect(email.html).toContain("my-community");
    expect(email.html).toContain("2026-07-18T10:00:00.000Z");
    expect(email.text).toContain("https://trustskool.com/community/my-community");
    // New enrichment fields
    expect(email.html).toContain("1,500"); // members formatted
    expect(email.html).toContain("$49/month"); // price formatted
    expect(email.html).toContain("English"); // language capitalised
    expect(email.html).toContain("<strong>7</strong>"); // click count
    expect(email.text).toContain("Members    : 1,500");
    expect(email.text).toContain("Price      : $49/month");
    expect(email.text).toContain("Language   : English");
    expect(email.text).toContain("Clicks     : 7");
  });

  it("click email shows Free for null/zero price", () => {
    const email = buildClickEmail({
      slug: "free-community",
      displayName: "Free Community",
      referrer: null,
      timestamp: new Date("2026-07-18T10:00:00Z"),
      priceAmountCents: null,
      clickCount: 1,
    });
    expect(email.html).toContain("Free");
    expect(email.text).toContain("Price      : Free");
  });
});
