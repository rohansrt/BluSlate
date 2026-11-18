import { describe, expect, it } from "vitest";
import type { WorkspaceContext } from "@bluslate/contracts";
import { PILLAR_WORKSPACES } from "@/lib/pillar-workspaces";
import { PILLAR_IDS, type PillarId } from "@/lib/pillars";
import { changedFacts } from "@/lib/shared-facts";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ctx: WorkspaceContext = {
  startup: { name: "Riya's idea", geography: "Pune, India", currency: "INR" },
  upstream: {},
};
const fresh = (p: PillarId): any => PILLAR_WORKSPACES[p].initial(ctx);

/** What the app does on save: copy changed facts from one step into every other. */
function propagate(
  from: PillarId,
  before: any,
  after: any,
  targets: Partial<Record<PillarId, any>>,
) {
  const src = PILLAR_WORKSPACES[from].shared!;
  const { next, prev } = changedFacts(src.read(before, ctx), src.read(after, ctx));
  const out: Partial<Record<PillarId, any>> = {};
  for (const p of PILLAR_IDS) {
    if (p === from) continue;
    const def = PILLAR_WORKSPACES[p];
    const state = targets[p] ?? fresh(p);
    out[p] = def.shared?.write ? def.schema.parse(def.shared.write(state, next, prev)) : state;
  }
  return out;
}

describe("every goal says when it is complete (decision 0012)", () => {
  it.each(PILLAR_IDS)("%s", (p) => {
    const goals = PILLAR_WORKSPACES[p].goals(fresh(p), ctx);
    expect(goals.length).toBeGreaterThan(0);
    for (const g of goals) expect(typeof g.done).toBe("boolean");
  });
});

describe("shared facts between steps", () => {
  it("the segment typed in Problem Discovery fills Customer, Market, Product and GTM", () => {
    const before = fresh("discover");
    const after = { ...before, who: "College students in Pune" };
    const out = propagate("discover", before, after, {});
    expect(out.customers.segments[0].name).toBe("College students in Pune");
    expect(out.market.segment).toBe("College students in Pune");
    expect(out.build.forWho).toBe("College students in Pune");
    expect(out.gtm.beachhead).toBe("College students in Pune");
  });

  it("a field the founder changed is not overwritten", () => {
    const before = { ...fresh("discover"), who: "Students" };
    const after = { ...before, who: "College students" };
    const market = { ...fresh("market"), segment: "Hostel students only" };
    const out = propagate("discover", before, after, { market });
    expect(out.market.segment).toBe("Hostel students only");
  });

  it("the problem goes both ways between Problem and Customer Discovery", () => {
    const before = fresh("customers");
    const after = { ...before, problem: "Getting to college costs too much" };
    expect(propagate("customers", before, after, {}).discover.pain).toBe(
      "Getting to college costs too much",
    );
  });

  it("willingness to pay becomes the yearly value per customer in Market Research", () => {
    const before = fresh("customers");
    const after = {
      ...before,
      segments: [
        {
          id: "s1",
          name: "Students",
          kind: "b2c",
          roles: [],
          channels: [],
          wtpLow: 100,
          wtpHigh: 300,
        },
      ],
    };
    expect(propagate("customers", before, after, {}).market.valuePerCustomer).toBe(2400);
  });

  it("today's alternatives become competitors, without losing the ones added in Market", () => {
    const before = fresh("discover");
    const after = {
      ...before,
      alternatives: [
        { id: "a1", name: "Auto-rickshaw", kind: "service" },
        { id: "a2", name: "Walking", kind: "do-nothing" },
      ],
    };
    const market = fresh("market");
    market.competitors = [
      {
        id: "m1",
        name: "Bounce",
        kind: "direct",
        price: null,
        pricePeriod: "per month",
        priceLevel: null,
        quality: null,
        url: "",
      },
    ];
    const names = propagate("discover", before, after, { market }).market.competitors.map(
      (c: { name: string }) => c.name,
    );
    expect(names).toEqual(["Bounce", "Auto-rickshaw", "Walking"]);
  });

  it("costs from Operations Setup fill Go-to-Market and Launch & Growth", () => {
    const before = fresh("setup");
    const after = {
      ...before,
      costs: [
        { id: "c1", name: "Rent", behaviour: "fixed", basis: "per_month", amount: 20000 },
        { id: "c2", name: "Battery", behaviour: "variable", basis: "per_unit", amount: 40 },
      ],
    };
    const out = propagate("setup", before, after, {});
    expect(out.gtm.fixedMonthly).toBe(20000);
    expect(out.gtm.variableCost).toBe(40);
    expect(out["run-grow"].fixedMonthly).toBe(20000);
    expect(out["run-grow"].variableCost).toBe(40);
  });

  it("the price is shared between Go-to-Market and Launch & Growth", () => {
    const before = fresh("gtm");
    const out = propagate("gtm", before, { ...before, price: 499 }, {});
    expect(out["run-grow"].price).toBe(499);
  });

  it("nothing changes when no shared fact changed", () => {
    const before = fresh("market");
    const { next } = changedFacts(
      PILLAR_WORKSPACES.market.shared!.read(before, ctx),
      PILLAR_WORKSPACES.market.shared!.read({ ...before, trend: "growing" }, ctx),
    );
    expect(next).toEqual({});
  });
});
