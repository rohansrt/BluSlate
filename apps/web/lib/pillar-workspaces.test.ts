import { describe, expect, it } from "vitest";
import { ENTITY_OWNER, ENTITY_SCHEMAS, PILLAR_IDS } from "@bluslate/contracts";
import { PILLAR_MODULES } from "./pillar-modules";
import { PILLAR_WORKSPACES } from "./pillar-workspaces";

const alone = { startup: { name: "Solo", geography: "Pune, IN", currency: "INR" }, upstream: {} };

describe("pillar workspaces (decision 0006)", () => {
  it("every pillar works alone: a fresh workspace parses and shows goals, AI slots and a report", () => {
    for (const id of PILLAR_IDS) {
      const def = PILLAR_WORKSPACES[id];
      expect(def.pillar, id).toBe(id);
      const s = def.initial(alone);
      expect(def.schema.safeParse(s).success, id).toBe(true);
      expect(def.goals(s, alone).length, id).toBeGreaterThanOrEqual(4);
      expect(def.aiHelpers.length, id).toBeGreaterThan(0);
      expect(def.report(s, alone)).toHaveProperty("lines");
    }
  });

  it("saved workspaces round-trip through the schema (what autosave stores)", () => {
    for (const id of PILLAR_IDS) {
      const def = PILLAR_WORKSPACES[id];
      const s = def.initial(alone);
      expect(def.schema.parse(JSON.parse(JSON.stringify(s))), id).toEqual(s);
    }
  });

  it("only publishes entity types the pillar owns, and every payload is a valid entity", () => {
    for (const id of PILLAR_IDS) {
      const def = PILLAR_WORKSPACES[id];
      for (const e of def.entities(def.initial(alone), alone)) {
        expect(ENTITY_OWNER[e.type], `${id} ${e.type}`).toBe(id);
        expect(PILLAR_MODULES[id].writes, id).toContain(e.type);
        expect(ENTITY_SCHEMAS[e.type].safeParse(e.data).success, `${id} ${e.key}`).toBe(true);
      }
    }
  });

  it("pre-fills downstream pillars from approved upstream entities", () => {
    const ctx = {
      ...alone,
      upstream: {
        Problem: [
          {
            who: "Students 3–8 km from campus",
            pain: "lose time getting to class",
            statement: "Students… lose time",
            alternatives: [{ name: "City bus", kind: "service" }],
          },
        ],
        Hypothesis: [{ statement: "They would pay ₹40 a day" }],
        Segment: [{ name: "Hostel students" }],
        CostItem: [
          { name: "Charging", behaviour: "variable", basis: "per_unit", amount: 20 },
          { name: "Rent", behaviour: "fixed", basis: "per_month", amount: 30000 },
        ],
      },
    };
    const customers = PILLAR_WORKSPACES.customers.initial(ctx);
    expect(customers.beliefs).toHaveLength(1);
    expect(PILLAR_WORKSPACES.market.initial(ctx).competitors[0]?.name).toBe("City bus");
    expect(PILLAR_WORKSPACES.gtm.initial(ctx).variableCost).toBe(20);
    expect(PILLAR_WORKSPACES.gtm.initial(ctx).fixedMonthly).toBe(30000);
  });
});
