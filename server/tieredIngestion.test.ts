import { describe, it, expect } from "vitest";
import {
  memberCountFloor,
  hasInsufficientHistory,
  computeTrustSkoreWithFloor,
  computeTrustSkore,
  isBootstrapScore,
  computeBreakdownWithBootstrap,
  BOOTSTRAP_MIN_MEMBERS,
  BOOTSTRAP_SNAPSHOT_THRESHOLD,
  BOOTSTRAP_GROWTH_MOMENTUM,
  BOOTSTRAP_RANKING_MOMENTUM,
} from "./trustskore";
import { TIER_THRESHOLDS, SLA_WINDOWS_MS } from "./tieredIngestion";

// ─── memberCountFloor ────────────────────────────────────────────────────────

describe("memberCountFloor", () => {
  it("returns 90 for 50k+ members", () => {
    expect(memberCountFloor(50_000)).toBe(90);
    expect(memberCountFloor(100_000)).toBe(90);
  });

  it("returns 87 for 25k–49999 members", () => {
    expect(memberCountFloor(25_000)).toBe(87);
    expect(memberCountFloor(49_999)).toBe(87);
  });

  it("returns 84 for 10k–24999 members", () => {
    expect(memberCountFloor(10_000)).toBe(84);
    expect(memberCountFloor(24_999)).toBe(84);
  });

  it("returns 80 for 5k–9999 members", () => {
    expect(memberCountFloor(5_000)).toBe(80);
    expect(memberCountFloor(9_999)).toBe(80);
  });

  it("returns 75 for 2k–4999 members", () => {
    expect(memberCountFloor(2_000)).toBe(75);
    expect(memberCountFloor(4_999)).toBe(75);
  });

  it("returns 70 for 1k–1999 members", () => {
    expect(memberCountFloor(1_000)).toBe(70);
    expect(memberCountFloor(1_999)).toBe(70);
  });

  it("returns 65 for 500–999 members", () => {
    expect(memberCountFloor(500)).toBe(65);
    expect(memberCountFloor(999)).toBe(65);
  });

  it("returns 60 for 200–499 members", () => {
    expect(memberCountFloor(200)).toBe(60);
    expect(memberCountFloor(499)).toBe(60);
  });

  it("returns 55 for 100–199 members", () => {
    expect(memberCountFloor(100)).toBe(55);
    expect(memberCountFloor(199)).toBe(55);
  });

  it("returns 50 (no floor) for <100 members", () => {
    expect(memberCountFloor(99)).toBe(50);
    expect(memberCountFloor(0)).toBe(50);
  });
});

// ─── hasInsufficientHistory ──────────────────────────────────────────────────

describe("hasInsufficientHistory", () => {
  it("returns true when both arrays are empty", () => {
    expect(hasInsufficientHistory([], [])).toBe(true);
  });

  it("returns true when both arrays have 1 point", () => {
    expect(hasInsufficientHistory([{ date: "2025-01-01" }], [{ date: "2025-01-01" }])).toBe(true);
  });

  it("returns false when memberHistory has ≥2 points", () => {
    const twoPoints = [{ date: "2025-01-01" }, { date: "2025-01-02" }];
    expect(hasInsufficientHistory(twoPoints, [])).toBe(false);
  });

  it("returns false when rankHistory has ≥2 points", () => {
    const twoPoints = [{ date: "2025-01-01" }, { date: "2025-01-02" }];
    expect(hasInsufficientHistory([], twoPoints)).toBe(false);
  });

  it("handles null/undefined gracefully", () => {
    expect(hasInsufficientHistory(null, undefined)).toBe(true);
  });
});

// ─── computeTrustSkoreWithFloor ──────────────────────────────────────────────

describe("computeTrustSkoreWithFloor", () => {
  const neutralBreakdown = { growth_momentum: 50, ranking_momentum: 50, price_stability: 100 };
  // neutral score = 50*0.45 + 50*0.35 + 100*0.20 = 22.5 + 17.5 + 20 = 60.0

  it("applies floor when history is insufficient and floor > raw score", () => {
    const score = computeTrustSkoreWithFloor(neutralBreakdown, 10_000, [], []);
    expect(score).toBe(84); // floor for 10k+ members (new tier)
  });

  it("uses raw score when history is sufficient (≥2 member points)", () => {
    const twoPoints = [{ date: "2025-01-01" }, { date: "2025-01-02" }];
    const score = computeTrustSkoreWithFloor(neutralBreakdown, 10_000, twoPoints, []);
    expect(score).toBe(60); // raw score, no floor applied
  });

  it("uses raw score when it exceeds the floor", () => {
    const highBreakdown = { growth_momentum: 90, ranking_momentum: 90, price_stability: 100 };
    // 90*0.45 + 90*0.35 + 100*0.20 = 40.5 + 31.5 + 20 = 92.0
    const score = computeTrustSkoreWithFloor(highBreakdown, 500, [], []);
    expect(score).toBe(92); // raw 92 > floor 65
  });

  it("applies floor for small community with insufficient history", () => {
    const score = computeTrustSkoreWithFloor(neutralBreakdown, 300, [], []);
    expect(score).toBe(60); // raw 60 >= floor 60 (200+ tier), Math.max returns 60
  });
});

// ─── isBootstrapScore ───────────────────────────────────────────────────────

describe("isBootstrapScore", () => {
  it("returns true for large community with 0 snapshots", () => {
    expect(isBootstrapScore(BOOTSTRAP_MIN_MEMBERS, [], [])).toBe(true);
    expect(isBootstrapScore(25_000, [], [])).toBe(true);
  });

  it("returns true for large community with 1 snapshot", () => {
    const onePoint = [{ date: "2025-01-01" }];
    expect(isBootstrapScore(5_000, onePoint, onePoint)).toBe(true);
  });

  it("returns true for large community with 2 snapshots (below threshold)", () => {
    const twoPoints = [{ date: "2025-01-01" }, { date: "2025-01-02" }];
    expect(isBootstrapScore(5_000, twoPoints, twoPoints)).toBe(true);
  });

  it("returns false for large community with 3+ snapshots (graduated)", () => {
    const threePoints = [
      { date: "2025-01-01" },
      { date: "2025-01-02" },
      { date: "2025-01-03" },
    ];
    expect(isBootstrapScore(5_000, threePoints, threePoints)).toBe(false);
  });

  it("returns false for small community regardless of snapshot count", () => {
    expect(isBootstrapScore(BOOTSTRAP_MIN_MEMBERS - 1, [], [])).toBe(false);
    expect(isBootstrapScore(500, [], [])).toBe(false);
    expect(isBootstrapScore(0, [], [])).toBe(false);
  });

  it("uses max of member/rank history lengths as snapshot count", () => {
    // 3 rank points but 0 member points → max=3 → graduated
    const threePoints = [
      { date: "2025-01-01" },
      { date: "2025-01-02" },
      { date: "2025-01-03" },
    ];
    expect(isBootstrapScore(5_000, [], threePoints)).toBe(false);
  });

  it("handles null/undefined gracefully", () => {
    expect(isBootstrapScore(5_000, null, undefined)).toBe(true);
  });
});

// ─── computeBreakdownWithBootstrap ──────────────────────────────────────────

describe("computeBreakdownWithBootstrap", () => {
  it("sets bootstrap sub-scores for large community with <3 snapshots", () => {
    const bd = computeBreakdownWithBootstrap({
      memberHistory: [],
      rankHistory: [],
      priceHistory: [],
      totalMembers: 5_000,
    });
    expect(bd.growth_momentum).toBe(BOOTSTRAP_GROWTH_MOMENTUM);
    expect(bd.ranking_momentum).toBe(BOOTSTRAP_RANKING_MOMENTUM);
    expect(bd.isBootstrap).toBe(true);
  });

  it("price_stability defaults to 100 (no history) even in bootstrap mode", () => {
    const bd = computeBreakdownWithBootstrap({
      memberHistory: [],
      rankHistory: [],
      priceHistory: [],
      totalMembers: 5_000,
    });
    expect(bd.price_stability).toBe(100);
  });

  it("uses real sub-scores once community has 3+ snapshots", () => {
    const threePoints = [
      { date: "2025-01-01", total_members: 5000 },
      { date: "2025-01-08", total_members: 5100 },
      { date: "2025-01-15", total_members: 5200 },
    ];
    const bd = computeBreakdownWithBootstrap({
      memberHistory: threePoints,
      rankHistory: [],
      priceHistory: [],
      totalMembers: 5_200,
    });
    expect(bd.isBootstrap).toBeFalsy();
    // Real growth momentum should differ from bootstrap value
    expect(bd.growth_momentum).not.toBe(BOOTSTRAP_GROWTH_MOMENTUM);
  });

  it("does NOT bootstrap small community with insufficient history", () => {
    const bd = computeBreakdownWithBootstrap({
      memberHistory: [],
      rankHistory: [],
      priceHistory: [],
      totalMembers: 500,
    });
    expect(bd.isBootstrap).toBeFalsy();
    expect(bd.growth_momentum).toBe(50); // neutral default
    expect(bd.ranking_momentum).toBe(50); // neutral default
  });

  it("bootstrap composite TrustSkore is around 80 (not hardcoded)", () => {
    const bd = computeBreakdownWithBootstrap({
      memberHistory: [],
      rankHistory: [],
      priceHistory: [],
      totalMembers: 5_000,
    });
    // 80*0.45 + 75*0.35 + 100*0.20 = 36 + 26.25 + 20 = 82.25
    const score = computeTrustSkore(bd);
    expect(score).toBeGreaterThanOrEqual(80);
    expect(score).toBeLessThanOrEqual(90);
  });
});

// ─── Tier thresholds and SLA windows ────────────────────────────────────────

describe("tier thresholds and SLA windows", () => {
  it("hot tier covers top 500 communities", () => {
    expect(TIER_THRESHOLDS.HOT_MAX_RANK).toBe(500);
  });

  it("warm tier covers rank 501-3000", () => {
    expect(TIER_THRESHOLDS.WARM_MAX_RANK).toBe(3000);
  });

  it("hot SLA window is 72 hours", () => {
    expect(SLA_WINDOWS_MS.hot).toBe(72 * 60 * 60 * 1000);
  });

  it("warm SLA window is 21 days", () => {
    expect(SLA_WINDOWS_MS.warm).toBe(21 * 24 * 60 * 60 * 1000);
  });

  it("cold SLA window is 60 days", () => {
    expect(SLA_WINDOWS_MS.cold).toBe(60 * 24 * 60 * 60 * 1000);
  });
});
