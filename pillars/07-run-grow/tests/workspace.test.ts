import { describe, expect, it } from "vitest";
import { outcomes, runGrowStateSchema, simulate } from "../src/workspace";

const base = {
  ...runGrowStateSchema.parse({}),
  startingCash: 500000,
  price: 1000,
  variableCost: 300,
  fixedMonthly: 60000,
  marketingBudget: 20000,
  cac: 400,
  churnPct: 5,
  horizon: "12" as const,
};

describe("monthly model", () => {
  it("is deterministic and keeps the cash identity each month", () => {
    const a = simulate(base);
    expect(simulate(base)).toEqual(a);
    let cash = 500000;
    for (const m of a) {
      cash += m.revenue - m.costs;
      expect(m.cash).toBeCloseTo(cash);
    }
  });

  it("needs a price and starting cash before it runs", () => {
    expect(simulate({ ...base, price: null })).toEqual([]);
  });

  it("a harsher market is never better", () => {
    const easy = outcomes(simulate({ ...base, difficulty: "optimistic" }))!;
    const hard = outcomes(simulate({ ...base, difficulty: "harsh" }))!;
    expect(hard.last.cash).toBeLessThanOrEqual(easy.last.cash);
  });

  it("applies a lever only from its month", () => {
    const before = simulate(base);
    const after = simulate({ ...base, priceLeverMonth: 6, newPrice: 1200 });
    expect(after.slice(0, 5)).toEqual(before.slice(0, 5));
    expect(after[5]!.revenue).not.toBe(before[5]!.revenue);
  });
});
