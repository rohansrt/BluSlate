import { describe, expect, it } from "vitest";
import { marketStateSchema, marketWorkspace, sizing, topDown } from "../src/workspace";

const ctx = { startup: { name: "x", geography: "Pune, IN", currency: "INR" }, upstream: {} };

describe("market sizing", () => {
  const s = {
    ...marketStateSchema.parse({}),
    customers: 50000,
    valuePerCustomer: 12000,
    reachPct: 20,
    winPct: 5,
    band: "25" as const,
  };

  it("computes TAM → SAM → SOM with a ±25% range", () => {
    const z = sizing(s);
    expect(z.tam).toEqual({ low: 450_000_000, base: 600_000_000, high: 750_000_000 });
    expect(z.sam!.base).toBe(120_000_000);
    expect(z.som!.base).toBe(6_000_000);
    expect(z.somCustomers).toBe(500);
  });

  it("stays unknown until the inputs exist", () => {
    expect(sizing(marketStateSchema.parse({})).tam).toBeNull();
    expect(
      marketWorkspace.goals(marketStateSchema.parse({}), ctx).find((g) => g.id === "tam")!.value,
    ).toBeNull();
  });

  it("fills the TAM goal as soon as it can be calculated", () => {
    expect(marketWorkspace.goals(s, ctx).find((g) => g.id === "tam")!.value).toBe("₹60 crore");
  });

  it("cross-checks against a top-down figure", () => {
    expect(topDown({ ...s, marketValue: 1_000_000_000, segmentSharePct: 50 }).gapPct).toBe(20);
  });
});
