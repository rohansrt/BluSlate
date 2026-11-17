import { z } from "zod";
import {
  formatMoney,
  known,
  type Goal,
  type PillarWorkspaceDef,
  type WorkspaceEntity,
} from "@bluslate/contracts";

/**
 * Operations Setup v1 (decision 0006): how will it be delivered? Process with
 * owners and throughput, team, costs, providers and risks → unit cost,
 * monthly fixed cost, capacity, bottleneck and launch lead time.
 */

const str = (n: number) => z.string().max(n).default("");
const num = z.number().min(0).nullable().default(null);
const rating = z.number().int().min(1).max(5).nullable().default(null);

export const OWNERS = ["founder", "team", "partner"] as const;
export const ENABLER_CATEGORIES = [
  "supplier",
  "technology",
  "logistics",
  "payments",
  "space",
  "legal & finance",
  "marketing",
] as const;
export const WORKING_DAYS = 26;

const step = z.object({
  id: z.string(),
  name: str(80),
  owner: z.enum(OWNERS).default("founder"),
  perDay: num,
});
const role = z.object({
  id: z.string(),
  title: str(80),
  monthlyPay: num,
  equityPct: z.number().min(0).max(100).nullable().default(null),
  hoursPerWeek: num,
});
const cost = z.object({
  id: z.string(),
  name: str(80),
  behaviour: z.enum(["fixed", "variable"]).default("fixed"),
  basis: z.enum(["per_unit", "per_customer", "per_month"]).default("per_month"),
  amount: num,
});
const enabler = z.object({
  id: z.string(),
  name: str(80),
  category: z.enum(ENABLER_CATEGORIES).default("supplier"),
  price: num,
  leadTimeDays: num,
  reliability: rating,
  url: str(300),
});
const risk = z.object({
  id: z.string(),
  risk: str(120),
  likelihood: rating,
  impact: rating,
  plan: str(160),
});

export const setupStateSchema = z.object({
  unitName: str(40),
  steps: z.array(step).max(12).default([]),
  team: z.array(role).max(12).default([]),
  costs: z.array(cost).max(20).default([]),
  enablers: z.array(enabler).max(12).default([]),
  setupWeeks: num,
  risks: z.array(risk).max(10).default([]),
});
export type SetupState = z.infer<typeof setupStateSchema>;

// ─── Calculators ─────────────────────────────────────────────────────────────

export function unitEconomics(s: SetupState) {
  const valid = s.costs.filter((c) => c.name.trim() && known(c.amount));
  const fixedCosts = valid
    .filter((c) => c.behaviour === "fixed")
    .reduce((a, c) => a + (c.amount ?? 0), 0);
  const payroll = s.team.reduce((a, r) => a + (r.monthlyPay ?? 0), 0);
  const variablePerUnit = valid
    .filter((c) => c.behaviour === "variable" && c.basis === "per_unit")
    .reduce((a, c) => a + (c.amount ?? 0), 0);
  const variablePerCustomer = valid
    .filter((c) => c.behaviour === "variable" && c.basis === "per_customer")
    .reduce((a, c) => a + (c.amount ?? 0), 0);
  return {
    monthlyFixed: valid.length || payroll ? fixedCosts + payroll : null,
    payroll,
    variablePerUnit: valid.some((c) => c.behaviour === "variable") ? variablePerUnit : null,
    variablePerCustomer,
  };
}

/** The slowest step sets capacity (units per day). */
export function capacity(s: SetupState) {
  const rated = s.steps.filter((x) => x.name.trim() && known(x.perDay));
  if (rated.length === 0) return null;
  const b = rated.reduce((m, x) => ((x.perDay ?? 0) < (m.perDay ?? 0) ? x : m));
  return { perDay: b.perDay ?? 0, perMonth: (b.perDay ?? 0) * WORKING_DAYS, bottleneck: b.name };
}

export function leadTimeDays(s: SetupState): number | null {
  const longest = Math.max(0, ...s.enablers.map((e) => e.leadTimeDays ?? 0));
  const setup = (s.setupWeeks ?? 0) * 7;
  return longest || setup ? longest + setup : null;
}

export function topRisk(s: SetupState) {
  return (
    s.risks
      .filter((r) => r.risk.trim() && r.likelihood !== null && r.impact !== null)
      .map((r) => ({ r, score: (r.likelihood ?? 0) * (r.impact ?? 0) }))
      .sort((a, b) => b.score - a.score)[0] ?? null
  );
}

// ─── Workspace ───────────────────────────────────────────────────────────────

export const setupWorkspace: PillarWorkspaceDef<SetupState> = {
  pillar: "setup",
  schema: setupStateSchema,
  aiHelpers: [
    "Get synthetic quotes",
    "Find real providers",
    "Map who does what",
    "Spot operating risks",
  ],

  initial(ctx) {
    const s = setupStateSchema.parse({});
    const features = (ctx.upstream.Feature ?? []).filter((f) => f.inScope);
    s.steps = features.slice(0, 6).map((f, i) => ({
      id: `s${i + 1}`,
      name: String(f.name ?? "").slice(0, 80),
      owner: "founder",
      perDay: null,
    }));
    return s;
  },

  goals(s, ctx) {
    const cur = ctx.startup.currency;
    const u = unitEconomics(s);
    const cap = capacity(s);
    const lead = leadTimeDays(s);
    const risk = topRisk(s);
    const unit = s.unitName || "unit";
    const goals: Goal[] = [
      {
        id: "fixed",
        title: "Monthly fixed costs",
        value: u.monthlyFixed === null ? null : formatMoney(u.monthlyFixed, cur),
        detail: u.payroll
          ? `incl. ${formatMoney(u.payroll, cur)} team pay`
          : "Rent, tools, salaries…",
        evidence: "ESTIMATE",
      },
      {
        id: "unitCost",
        title: `Variable cost per ${unit}`,
        value: u.variablePerUnit === null ? null : formatMoney(u.variablePerUnit, cur),
        detail: "Sum of per-unit costs",
        evidence: "ESTIMATE",
      },
      {
        id: "capacity",
        title: "Capacity",
        value: cap ? `${cap.perDay} ${unit}s/day` : null,
        detail: cap
          ? `≈ ${cap.perMonth} a month · bottleneck: ${cap.bottleneck}`
          : "Slowest step sets the pace",
        evidence: "ASSUMED",
      },
      {
        id: "team",
        title: "Team",
        value: s.team.length
          ? `${s.team.length} ${s.team.length === 1 ? "person" : "people"}`
          : null,
        detail: u.payroll ? `${formatMoney(u.payroll, cur)} a month` : undefined,
      },
      {
        id: "lead",
        title: "Time to get ready",
        value: lead === null ? null : `${lead} days`,
        detail: "Longest provider lead time + set-up",
        evidence: "ESTIMATE",
      },
      {
        id: "providers",
        title: "Providers lined up",
        value: String(s.enablers.filter((e) => e.name.trim()).length),
        done: s.enablers.length >= 2,
      },
      {
        id: "risk",
        title: "Top risk",
        value: risk ? risk.r.risk.slice(0, 40) : null,
        detail: risk ? `likelihood × impact = ${risk.score}` : "Likelihood × impact",
      },
    ];
    return goals;
  },

  report(s, ctx) {
    const cur = ctx.startup.currency;
    const u = unitEconomics(s);
    const cap = capacity(s);
    const lead = leadTimeDays(s);
    const lines: { label: string; value: string; evidence?: "ESTIMATE" | "ASSUMED" }[] = [];
    if (s.steps.length)
      lines.push({
        label: "Process",
        value: s.steps.map((x) => `${x.name} (${x.owner})`).join(" → "),
      });
    if (u.monthlyFixed !== null)
      lines.push({
        label: "Monthly fixed costs",
        value: formatMoney(u.monthlyFixed, cur),
        evidence: "ESTIMATE",
      });
    if (u.variablePerUnit !== null)
      lines.push({
        label: `Variable cost per ${s.unitName || "unit"}`,
        value: formatMoney(u.variablePerUnit, cur),
        evidence: "ESTIMATE",
      });
    if (cap)
      lines.push({
        label: "Capacity",
        value: `${cap.perDay}/day, bottleneck ${cap.bottleneck}`,
        evidence: "ASSUMED",
      });
    if (s.team.length)
      lines.push({
        label: "Team",
        value: s.team
          .map((r) => r.title)
          .filter(Boolean)
          .join(", "),
      });
    if (s.enablers.length)
      lines.push({
        label: "Providers",
        value: s.enablers.map((e) => `${e.name} (${e.category})`).join(", "),
        evidence: "ASSUMED",
      });
    if (lead !== null)
      lines.push({ label: "Ready in", value: `${lead} days`, evidence: "ESTIMATE" });
    const r = topRisk(s);
    if (r)
      lines.push({
        label: "Top risk",
        value: `${r.r.risk}${r.r.plan ? ` — plan: ${r.r.plan}` : ""}`,
      });
    return {
      headline:
        u.monthlyFixed !== null || cap
          ? `Delivering costs ${u.monthlyFixed !== null ? `${formatMoney(u.monthlyFixed, cur)} a month fixed` : "an unknown fixed amount"}${u.variablePerUnit !== null ? ` plus ${formatMoney(u.variablePerUnit, cur)} per ${s.unitName || "unit"}` : ""}${cap ? `, with room for ${cap.perDay} a day` : ""}.`
          : null,
      lines,
    };
  },

  entities(s, ctx) {
    const cur = ctx.startup.currency;
    const out: WorkspaceEntity[] = [];
    if (s.steps.some((x) => x.name.trim()))
      out.push({
        key: "process",
        type: "Process",
        title: `${s.steps.length} steps`,
        evidenceLabel: "ASSUMED",
        data: {
          steps: s.steps
            .filter((x) => x.name.trim())
            .map((x) => ({
              name: x.name,
              owner: { kind: x.owner === "partner" ? "enabler" : "founder" },
              inputs: [],
              outputs: [],
            })),
        },
      });
    const cap = capacity(s);
    if (cap)
      out.push({
        key: "capacity",
        type: "Capacity",
        title: `${cap.perDay}/day`,
        evidenceLabel: "ASSUMED",
        data: {
          stages: s.steps
            .filter((x) => known(x.perDay))
            .map((x) => ({ name: x.name, throughputPerDay: x.perDay! })),
          bottleneck: cap.bottleneck,
        },
      });
    for (const r of s.team.filter((x) => x.title.trim()))
      out.push({
        key: `role:${r.id}`,
        type: "TeamRole",
        title: r.title,
        evidenceLabel: "ASSUMED",
        data: {
          title: r.title,
          currency: cur,
          ...(known(r.monthlyPay) ? { salary: r.monthlyPay } : {}),
          ...(known(r.equityPct) ? { equityPct: r.equityPct } : {}),
          ...(known(r.hoursPerWeek) ? { capacityHours: r.hoursPerWeek } : {}),
        },
      });
    for (const c of s.costs.filter((x) => x.name.trim() && known(x.amount)))
      out.push({
        key: `cost:${c.id}`,
        type: "CostItem",
        title: c.name,
        evidenceLabel: "ASSUMED",
        data: {
          name: c.name,
          behaviour: c.behaviour,
          basis: c.basis,
          amount: c.amount!,
          currency: cur,
        },
      });
    for (const e of s.enablers.filter((x) => x.name.trim()))
      out.push({
        key: `enabler:${e.id}`,
        type: "Enabler",
        title: e.name,
        evidenceLabel: "ASSUMED",
        data: {
          name: e.name,
          category: e.category,
          kind: "real",
          url: e.url,
          quote: {
            currency: cur,
            ...(known(e.price) ? { price: e.price } : {}),
            ...(known(e.leadTimeDays) ? { leadTimeDays: e.leadTimeDays } : {}),
            ...(e.reliability !== null ? { reliability: e.reliability } : {}),
          },
        },
      });
    return out;
  },
};
