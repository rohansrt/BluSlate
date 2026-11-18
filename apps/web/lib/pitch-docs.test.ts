import { describe, expect, it } from "vitest";
import type { WorkspaceContext } from "@bluslate/contracts";
import { goalProgress } from "@bluslate/contracts";
import { PILLAR_WORKSPACES } from "@/lib/pillar-workspaces";
import { PILLAR_IDS, type PillarId } from "@/lib/pillars";
import {
  buildDocContent,
  gapsFor,
  missingCanvasBoxes,
  type PillarSnapshot,
} from "@/lib/pitch-doc-content";
import { DOC_KINDS } from "@/lib/pitch-doc-kinds";
import { pdfText, renderPdf } from "@/lib/pitch-docs-pdf";
import { renderXlsx } from "@/lib/pitch-docs-xlsx";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ctx: WorkspaceContext = {
  startup: { name: "Riya's idea", geography: "Pune, India", currency: "INR", idea: "E-bikes" },
  upstream: {},
};

function snapshots(edit: Partial<Record<PillarId, (s: any) => any>> = {}): PillarSnapshot[] {
  return PILLAR_IDS.map((pillar) => {
    const def = PILLAR_WORKSPACES[pillar];
    const state = def.schema.parse((edit[pillar] ?? ((s: any) => s))(def.initial(ctx)));
    const goals = def.goals(state, ctx);
    return {
      pillar,
      state: goalProgress(goals).state,
      report: def.report(state, ctx),
      goals,
      entities: def.entities(state, ctx),
    };
  });
}

const startup = { name: "Riya's idea", market: "Pune, India", currency: "INR", idea: "E-bikes" };
const now = new Date("2026-11-19T10:00:00Z");

const withCosts = snapshots({
  setup: (s) => ({
    ...s,
    team: [{ id: "r1", title: "Founder", monthlyPay: 30000, equityPct: null, hoursPerWeek: null }],
    costs: [{ id: "c1", name: "Rent", behaviour: "fixed", basis: "per_month", amount: 20000 }],
    enablers: [{ id: "e1", name: "Battery supplier", category: "supplier" }],
  }),
  gtm: (s) => ({ ...s, price: 499, variableCost: 120 }),
});

describe("pitch documents only contain the steps with work in them (decision 0012)", () => {
  it("leaves out empty steps and lists them", () => {
    const c = buildDocContent({ kind: "plan", startup, snapshots: withCosts, now });
    const included = c.sections.map((s) => s.pillar);
    expect(included).toContain("setup");
    expect(included).toContain("gtm");
    expect(included).not.toContain("build");
    expect(c.leftOut.map((l) => l.pillar)).toContain("build");
    expect(c.aiFilled).toBe(false);
  });

  it("adds AI predictions only when asked, marked as predictions", () => {
    const fill = {
      sections: [
        { pillar: "build" as const, headline: "Likely a rental app", points: ["Probably"] },
      ],
      canvas: [{ box: "relationships" as const, items: ["Likely personal support"] }],
    };
    const plan = buildDocContent({ kind: "plan", startup, snapshots: withCosts, fill, now });
    const build = plan.sections.find((s) => s.pillar === "build");
    expect(build?.prediction?.headline).toBe("Likely a rental app");
    expect(plan.leftOut.map((l) => l.pillar)).not.toContain("build");
    expect(plan.aiFilled).toBe(true);
    const canvas = buildDocContent({ kind: "canvas", startup, snapshots: withCosts, fill, now });
    expect(canvas.canvas?.find((b) => b.id === "relationships")?.predicted).toBe(true);
  });

  it("names the incomplete steps a document depends on", () => {
    const gaps = gapsFor("financials", withCosts).map((g) => g.pillar);
    expect(gaps).toEqual(expect.arrayContaining(["market", "run-grow"]));
  });

  it("builds canvas boxes from the steps' entities", () => {
    const c = buildDocContent({ kind: "canvas", startup, snapshots: withCosts, now });
    const ids = c.canvas!.map((b) => b.id);
    expect(ids).toEqual(expect.arrayContaining(["partners", "resources", "costs", "revenue"]));
    expect(missingCanvasBoxes(withCosts, "INR")).toContain("segments");
  });

  it("puts costs and prices into the financial model", () => {
    const c = buildDocContent({ kind: "financials", startup, snapshots: withCosts, now });
    expect(c.financials!.costs).toEqual([
      { name: "Rent", behaviour: "fixed", basis: "per_month", amount: 20000 },
    ]);
    expect(c.financials!.assumptions.find((a) => a.label === "Price")?.value).toBe(499);
  });
});

describe("rendering", () => {
  it("maps text to what the PDF font can draw", () => {
    expect(pdfText("₹4.2 lakh · 3 × 2 ≈ 6 “ok”")).toBe('Rs 4.2 lakh | 3 x 2 ~ 6 "ok"');
  });

  it.each(DOC_KINDS)(
    "renders %s",
    async (kind) => {
      const c = buildDocContent({ kind, startup, snapshots: withCosts, now });
      const buf = kind === "financials" ? await renderXlsx(c) : await renderPdf(c);
      expect(buf.length).toBeGreaterThan(1000);
      expect(buf.subarray(0, 4).toString("latin1")).toBe(
        kind === "financials" ? "PK\u0003\u0004" : "%PDF",
      );
    },
    30_000,
  );
});
