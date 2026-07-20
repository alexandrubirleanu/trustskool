import { describe, it, expect } from "vitest";
import { mrrBadgeFloor, computeTrustSkoreWithFloor } from "./trustskore";

// ─── mrrBadgeFloor ───────────────────────────────────────────────────────────
//
// Permanent TrustSkore floor based on Skool-verified MRR badge.
// Unlike memberCountFloor (bootstrap-only), this floor is always applied.
//
// Tier mapping:
//   clover      ($3k+/mo)   → 75
//   rocket      ($10k+/mo)  → 82
//   liftoff     ($10k+/mo)  → 82  (alias for rocket)
//   crown       ($30k+/mo)  → 88
//   diamond     ($100k+/mo) → 93
//   red_diamond ($300k+/mo) → 97
//   goated      ($1M+/mo)   → 99
//   goat        ($1M+/mo)   → 99  (alias for goated)
//   none / null             →  0  (no floor)
// ---------------------------------------------------------------------------

describe("mrrBadgeFloor", () => {
  it("returns 75 for clover ($3k+/mo)", () => {
    expect(mrrBadgeFloor("clover")).toBe(75);
  });

  it("returns 82 for rocket ($10k+/mo)", () => {
    expect(mrrBadgeFloor("rocket")).toBe(82);
  });

  it("returns 82 for liftoff (alias for rocket)", () => {
    expect(mrrBadgeFloor("liftoff")).toBe(82);
  });

  it("returns 88 for crown ($30k+/mo)", () => {
    expect(mrrBadgeFloor("crown")).toBe(88);
  });

  it("returns 93 for diamond ($100k+/mo)", () => {
    expect(mrrBadgeFloor("diamond")).toBe(93);
  });

  it("returns 97 for red_diamond ($300k+/mo)", () => {
    expect(mrrBadgeFloor("red_diamond")).toBe(97);
  });

  it("returns 99 for goated ($1M+/mo)", () => {
    expect(mrrBadgeFloor("goated")).toBe(99);
  });

  it("returns 99 for goat (alias for goated)", () => {
    expect(mrrBadgeFloor("goat")).toBe(99);
  });

  it("returns 0 for none (no badge)", () => {
    expect(mrrBadgeFloor("none")).toBe(0);
  });

  it("returns 0 for null", () => {
    expect(mrrBadgeFloor(null)).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(mrrBadgeFloor(undefined)).toBe(0);
  });

  it("returns 0 for unknown string", () => {
    expect(mrrBadgeFloor("unknown_badge")).toBe(0);
  });

  it("floors are strictly increasing across tiers", () => {
    const tiers = ["clover", "rocket", "crown", "diamond", "red_diamond", "goated"] as const;
    const floors = tiers.map(mrrBadgeFloor);
    for (let i = 1; i < floors.length; i++) {
      expect(floors[i]).toBeGreaterThan(floors[i - 1]);
    }
  });
});

// ─── computeTrustSkoreWithFloor + MRR badge integration ─────────────────────
//
// The MRR badge floor is always applied (unlike memberCountFloor which is
// bootstrap-only). A community scoring below its badge floor gets lifted;
// one already above the floor is unchanged.
// ---------------------------------------------------------------------------

const neutralBreakdown = {
  growth_momentum: 50,
  ranking_momentum: 50,
  price_stability: 50,
  owner_engagement: 50,
};

// Sufficient history: 3 snapshots → memberCountFloor is NOT applied
const sufficientHistory = [
  { date: "2026-01-01" },
  { date: "2026-02-01" },
  { date: "2026-03-01" },
];

describe("computeTrustSkoreWithFloor — MRR badge floor integration", () => {
  it("lifts a low-scoring community with clover badge to at least 75", () => {
    // Neutral breakdown → raw ≈ 50; clover floor = 75
    const score = computeTrustSkoreWithFloor(
      neutralBreakdown,
      100,
      sufficientHistory,
      sufficientHistory,
      "test-clover",
      "clover",
    );
    expect(score).toBeGreaterThanOrEqual(75);
  });

  it("lifts a low-scoring community with diamond badge to at least 93", () => {
    const score = computeTrustSkoreWithFloor(
      neutralBreakdown,
      100,
      sufficientHistory,
      sufficientHistory,
      "test-diamond",
      "diamond",
    );
    expect(score).toBeGreaterThanOrEqual(93);
  });

  it("lifts a low-scoring community with goated badge to at least 99", () => {
    const score = computeTrustSkoreWithFloor(
      neutralBreakdown,
      100,
      sufficientHistory,
      sufficientHistory,
      "test-goated",
      "goated",
    );
    expect(score).toBeGreaterThanOrEqual(99);
  });

  it("does not lower a community already above the badge floor", () => {
    // High breakdown → raw ≈ 90; clover floor = 75 — should not reduce
    const highBreakdown = {
      growth_momentum: 95,
      ranking_momentum: 90,
      price_stability: 85,
      owner_engagement: 90,
    };
    const score = computeTrustSkoreWithFloor(
      highBreakdown,
      50_000,
      sufficientHistory,
      sufficientHistory,
      "test-high",
      "clover",
    );
    expect(score).toBeGreaterThan(75);
  });

  it("applies no floor when mrrStatus is null", () => {
    // Neutral breakdown → raw ≈ 50; no badge → score stays near 50
    const score = computeTrustSkoreWithFloor(
      neutralBreakdown,
      100,
      sufficientHistory,
      sufficientHistory,
      "test-null-mrr",
      null,
    );
    expect(score).toBeLessThan(75);
  });

  it("applies no floor when mrrStatus is 'none'", () => {
    const score = computeTrustSkoreWithFloor(
      neutralBreakdown,
      100,
      sufficientHistory,
      sufficientHistory,
      "test-none-mrr",
      "none",
    );
    expect(score).toBeLessThan(75);
  });

  it("applies MRR badge floor even when history is sufficient (permanent, not bootstrap-only)", () => {
    // This is the key distinction: badge floor is always applied, not just during bootstrap
    const score = computeTrustSkoreWithFloor(
      neutralBreakdown,
      500_000, // large community with sufficient history
      sufficientHistory,
      sufficientHistory,
      "test-permanent",
      "crown",
    );
    expect(score).toBeGreaterThanOrEqual(88);
  });

  it("MRR badge floor and memberCountFloor coexist: highest wins", () => {
    // Insufficient history → memberCountFloor applies; also has clover badge
    // memberCountFloor(100) ≈ 45+31*(2/5) ≈ 57.4; clover floor = 75 → 75 wins
    const score = computeTrustSkoreWithFloor(
      neutralBreakdown,
      100,
      [], // insufficient history
      [],
      "test-both-floors",
      "clover",
    );
    expect(score).toBeGreaterThanOrEqual(75);
  });
});
