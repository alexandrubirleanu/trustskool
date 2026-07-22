import { describe, expect, it } from "vitest";
import { getDataConfidence } from "../client/src/lib/dataConfidence";

describe("getDataConfidence", () => {
  it("labels bootstrapped communities with little history as early data", () => {
    const result = getDataConfidence({
      memberHistory: [{}, {}],
      scoreBreakdown: { isBootstrap: true },
    });
    expect(result.level).toBe("Early");
    expect(result.isBootstrap).toBe(true);
  });

  it("rewards long history and founder activity", () => {
    const history = Array.from({ length: 30 }, () => ({}));
    const result = getDataConfidence({
      memberHistory: history,
      priceHistory: history,
      rankHistory: history,
      ownerLastActiveAt: new Date(),
      ownerActiveDaysLast30: 20,
      scoreBreakdown: { isBootstrap: false },
    });
    expect(result.level).toBe("High");
    expect(result.score).toBe(100);
  });
});
