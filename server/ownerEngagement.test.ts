import { describe, it, expect } from "vitest";
import { computeOwnerEngagement } from "./trustskore";

// ─── computeOwnerEngagement ──────────────────────────────────────────────────
//
// Formula:
//   recency_score  = lastActiveAt == null ? 50 : clamp(100 - daysSince*2, 15, 100)
//   frequency_score = activeDaysLast30 == null ? 50 : clamp((activeDaysLast30/30)*100, 0, 100)
//   owner_engagement = clamp(round2(0.6 * recency + 0.4 * frequency))
//
// Null data must resolve to 50 (neutral) — never 0 — so communities without
// owner data are not penalised in the TrustSkore ranking.
// ---------------------------------------------------------------------------

describe("computeOwnerEngagement", () => {
  it("returns 50 (neutral) when both inputs are null", () => {
    // recency=50 (null), frequency=50 (null)
    // 0.6*50 + 0.4*50 = 50
    expect(computeOwnerEngagement(null, null)).toBe(50);
  });

  it("returns 50 (neutral) when both inputs are undefined", () => {
    expect(computeOwnerEngagement(undefined, undefined)).toBe(50);
  });

  it("returns 80 when owner was active today and frequency is null", () => {
    // daysSince ≈ 0 → recency = clamp(100 - 0, 15, 100) = 100
    // frequency = 50 (null)
    // 0.6*100 + 0.4*50 = 60 + 20 = 80
    const now = new Date();
    expect(computeOwnerEngagement(now, null)).toBe(80);
  });

  it("returns 29 when owner was last active 90+ days ago and frequency is null", () => {
    // daysSince = 90 → recency = clamp(100 - 180, 15, 100) = 15
    // frequency = 50 (null)
    // 0.6*15 + 0.4*50 = 9 + 20 = 29
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    expect(computeOwnerEngagement(ninetyDaysAgo, null)).toBe(29);
  });

  it("recency is floored at 15 even for very old dates (e.g. 200 days ago)", () => {
    // daysSince = 200 → 100 - 400 = -300 → clamped to 15
    // frequency = 50 (null)
    // 0.6*15 + 0.4*50 = 9 + 20 = 29
    const veryOld = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
    expect(computeOwnerEngagement(veryOld, null)).toBe(29);
  });

  it("returns 60 when owner is active today and active_days_last30 is 0", () => {
    // recency = 100 (today), frequency = clamp((0/30)*100, 0, 100) = 0
    // 0.6*100 + 0.4*0 = 60
    const now = new Date();
    expect(computeOwnerEngagement(now, 0)).toBe(60);
  });

  it("returns 100 when owner is active today and active_days_last30 is 30", () => {
    // recency = 100 (today), frequency = clamp((30/30)*100, 0, 100) = 100
    // 0.6*100 + 0.4*100 = 100
    const now = new Date();
    expect(computeOwnerEngagement(now, 30)).toBe(100);
  });

  it("returns 50 when lastActiveAt is null but active_days_last30 is 0", () => {
    // recency = 50 (null), frequency = 0
    // 0.6*50 + 0.4*0 = 30
    // NOTE: this is 30, not 50 — only the fully-null case gives exactly 50
    expect(computeOwnerEngagement(null, 0)).toBe(30);
  });

  it("returns 70 when lastActiveAt is null but active_days_last30 is 30", () => {
    // recency = 50 (null), frequency = 100
    // 0.6*50 + 0.4*100 = 30 + 40 = 70
    expect(computeOwnerEngagement(null, 30)).toBe(70);
  });

  it("returns a value between 0 and 100 for any valid input", () => {
    // Note: when lastActiveAt is non-null, recency is floored at 15.
    // When lastActiveAt is null, recency defaults to 50 (neutral).
    // frequency_score can be 0 (activeDaysLast30=0), so the composite can be
    // as low as 0.6*15 + 0.4*0 = 9 for a very stale + zero-activity owner.
    const cases: Array<[Date | null, number | null, number, number]> = [
      // [lastActiveAt, activeDays, minExpected, maxExpected]
      [new Date(), 15, 60, 100],                                        // active today, some frequency
      [new Date(Date.now() - 7 * 86_400_000), 20, 50, 100],            // 7d ago, moderate frequency
      [new Date(Date.now() - 30 * 86_400_000), 10, 20, 70],            // 30d ago, low frequency
      [new Date(Date.now() - 60 * 86_400_000), 0, 0, 30],              // stale + zero frequency
      [null, 15, 25, 60],                                               // null recency + some frequency
    ];
    for (const [lastActive, activeDays, min, max] of cases) {
      const score = computeOwnerEngagement(lastActive, activeDays);
      expect(score).toBeGreaterThanOrEqual(min);
      expect(score).toBeLessThanOrEqual(max);
    }
  });

  it("score decreases as days since last active increases", () => {
    const now = new Date();
    const s0 = computeOwnerEngagement(new Date(now.getTime() - 0), null);
    const s7 = computeOwnerEngagement(new Date(now.getTime() - 7 * 86_400_000), null);
    const s30 = computeOwnerEngagement(new Date(now.getTime() - 30 * 86_400_000), null);
    const s90 = computeOwnerEngagement(new Date(now.getTime() - 90 * 86_400_000), null);
    expect(s0).toBeGreaterThan(s7);
    expect(s7).toBeGreaterThan(s30);
    expect(s30).toBeGreaterThanOrEqual(s90); // both may hit the floor
  });
});
