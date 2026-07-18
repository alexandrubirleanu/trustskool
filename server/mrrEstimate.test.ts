import { describe, expect, it } from "vitest";
import { computeMrrEstimate, type OwnedCommunityEntry } from "./mrrEstimate";

const singleOwned = (slug: string, members: number, aflPct: number | null = 40): OwnedCommunityEntry[] => [
  { slug, display_name: "Test Community", total_members: members, afl_percent: aflPct },
];

describe("computeMrrEstimate", () => {
  // ─── No owner profile ───────────────────────────────────────────────────────

  it("returns null for a free community with no owner profile", () => {
    expect(computeMrrEstimate("test", null, 1000, null, null)).toBeNull();
  });

  it("returns a naive ceiling for a paid community with no owner profile", () => {
    const result = computeMrrEstimate("test", 2000, 100, null, null); // $20/mo × 100 members
    expect(result).not.toBeNull();
    expect(result!.reinforced).toBe(false);
    expect(result!.high).toBe(2000); // $20 × 100 = $2,000
    expect(result!.low).toBe(0);
    expect(result!.label).toMatch(/Up to/);
  });

  // ─── Single-community owner ──────────────────────────────────────────────────

  it("returns tier range for a free community with a badge (single owner)", () => {
    const result = computeMrrEstimate("test", null, 5000, "crown", singleOwned("test", 5000));
    expect(result).not.toBeNull();
    expect(result!.reinforced).toBe(true);
    // crown tier: $30k–$100k
    expect(result!.low).toBe(30_000);
    expect(result!.high).toBe(100_000);
  });

  it("intersects tier and naive ceiling for a paid single-community owner", () => {
    // clover tier: $3k–$10k; naive ceiling: 100 members × $50/mo = $5k
    const result = computeMrrEstimate("test", 5000, 100, "clover", singleOwned("test", 100));
    expect(result).not.toBeNull();
    expect(result!.reinforced).toBe(true);
    // intersection of [$3k, $10k] ∩ [0, $5k] → [$3k, $5k]
    expect(result!.low).toBe(3_000);
    expect(result!.high).toBe(5_000);
    expect(result!.note).toBeNull();
  });

  it("shows tier range with note when tier exceeds naive ceiling", () => {
    // diamond tier: $100k–$300k; naive ceiling: 10 members × $10/mo = $100
    const result = computeMrrEstimate("test", 1000, 10, "diamond", singleOwned("test", 10));
    expect(result).not.toBeNull();
    expect(result!.reinforced).toBe(true);
    // tier.low ($100k) > naive ceiling ($100) → no overlap, show tier range
    expect(result!.low).toBe(100_000);
    expect(result!.high).toBe(300_000);
    expect(result!.note).toMatch(/badge suggests higher revenue/);
  });

  // ─── Multi-community owner ───────────────────────────────────────────────────

  it("allocates proportionally for multi-community owner", () => {
    const owned: OwnedCommunityEntry[] = [
      { slug: "big", display_name: "Big Community", total_members: 9000, afl_percent: 40 },
      { slug: "small", display_name: "Small Community", total_members: 1000, afl_percent: 40 },
    ];
    // crown tier: $30k–$100k; big community has 90% of weight
    const result = computeMrrEstimate("big", 5000, 9000, "crown", owned);
    expect(result).not.toBeNull();
    expect(result!.reinforced).toBe(true);
    expect(result!.note).toMatch(/2 communities/);
    // allocated low for big: 3_000_000 * 0.9 = 2_700_000 cents = $27k
    expect(result!.low).toBe(27_000);
  });

  // ─── Badge name normalization ─────────────────────────────────────────────────

  it("handles liftoff badge (alias for rocket tier)", () => {
    const result = computeMrrEstimate("test", null, 5000, "liftoff", singleOwned("test", 5000));
    expect(result).not.toBeNull();
    expect(result!.reinforced).toBe(true);
    // rocket/liftoff tier: $10k–$30k
    expect(result!.low).toBe(10_000);
    expect(result!.high).toBe(30_000);
  });

  it("handles goat badge (alias for goated tier)", () => {
    const result = computeMrrEstimate("test", null, 5000, "goat", singleOwned("test", 5000));
    expect(result).not.toBeNull();
    expect(result!.reinforced).toBe(true);
    // goat/goated tier: $1M+
    expect(result!.low).toBe(1_000_000);
    expect(result!.high).toBeNull();
    expect(result!.label).toMatch(/\+\/month/);
  });

  // ─── Label formatting ─────────────────────────────────────────────────────────

  it("formats label as range for bounded tiers", () => {
    const result = computeMrrEstimate("test", null, 5000, "clover", singleOwned("test", 5000));
    expect(result!.label).toMatch(/\$3k–\$10k\/month/);
  });

  it("formats label with + for open-ended goated tier", () => {
    const result = computeMrrEstimate("test", null, 5000, "goated", singleOwned("test", 5000));
    expect(result!.label).toMatch(/\$1\.0M\+\/month/);
  });
});
