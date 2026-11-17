import { describe, expect, it } from "vitest";
import { breakEven, funnel, gtmStateSchema, waterfall } from "../src/workspace";

describe("pricing lab and funnel", () => {
  const s = {
    ...gtmStateSchema.parse({}),
    price: 1000,
    discountPct: 10,
    feesPct: 2,
    variableCost: 300,
    fixedMonthly: 50000,
    channels: [
      {
        id: "a",
        channel: "Instagram" as const,
        ring: "inner" as const,
        monthlyBudget: 20000,
        cac: 400,
      },
      {
        id: "b",
        channel: "Referrals" as const,
        ring: "inner" as const,
        monthlyBudget: 5000,
        cac: 100,
      },
    ],
  };

  it("walks from list price to contribution", () => {
    const w = waterfall(s)!;
    expect(w.net).toBeCloseTo(882);
    expect(w.contribution).toBeCloseTo(582);
    expect(w.marginPct).toBeCloseTo(58.2);
  });

  it("works out customers, blended CAC and break-even", () => {
    const f = funnel(s);
    expect(f.customers).toBe(100);
    expect(f.blendedCac).toBe(250);
    expect(breakEven(s).units).toBe(Math.ceil(75000 / 582));
  });

  it("has a default launch checklist", () => {
    expect(gtmStateSchema.parse({}).checklist.length).toBeGreaterThan(3);
  });
});
