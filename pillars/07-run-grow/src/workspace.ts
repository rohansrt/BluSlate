import { z } from "zod";
import {
  follow,
  formatMoney,
  known,
  type Goal,
  type PillarWorkspaceDef,
  type WorkspaceEntity,
} from "@bluslate/contracts";

/**
 * Launch & Growth v1 (decision 0006): what happens over time? A simple,
 * deterministic monthly model (the full sim kernel comes later). Every output
 * is SYNTHETIC: a what-if, never a prediction.
 */

const str = (n: number) => z.string().max(n).default("");
const num = z.number().min(0).nullable().default(null);
const pct = z.number().min(0).max(100).nullable().default(null);

export const HORIZONS = ["6", "12", "24"] as const;
export const DIFFICULTY = ["optimistic", "realistic", "harsh"] as const;
const MULT = {
  optimistic: { cac: 0.85, churn: 0.8 },
  realistic: { cac: 1, churn: 1 },
  harsh: { cac: 1.3, churn: 1.3 },
};

export const runGrowStateSchema = z.object({
  scenarioName: str(80),
  horizon: z.enum(HORIZONS).default("12"),
  difficulty: z.enum(DIFFICULTY).default("realistic"),
  startingCash: num,
  startingCustomers: num,
  price: num,
  purchasesPerMonth: z.number().min(0).nullable().default(1),
  variableCost: num,
  fixedMonthly: num,
  marketingBudget: num,
  cac: num,
  churnPct: pct,
  referralPct: pct,
  marketCap: num,
  priceLeverMonth: z.number().int().min(1).max(24).nullable().default(null),
  newPrice: num,
  budgetLeverMonth: z.number().int().min(1).max(24).nullable().default(null),
  newBudget: num,
});
export type RunGrowState = z.infer<typeof runGrowStateSchema>;

export interface Month {
  month: number;
  customers: number;
  newCustomers: number;
  revenue: number;
  costs: number;
  cash: number;
}

/** Can the model run? It needs a price and starting cash at least. */
export function missingInputs(s: RunGrowState): string[] {
  const m: string[] = [];
  if (!known(s.startingCash)) m.push("starting cash");
  if (!known(s.price)) m.push("price");
  if (!known(s.cac) && !known(s.startingCustomers)) m.push("CAC or starting customers");
  return m;
}

export function simulate(s: RunGrowState): Month[] {
  if (missingInputs(s).length) return [];
  const d = MULT[s.difficulty];
  const H = Number(s.horizon);
  let customers = s.startingCustomers ?? 0;
  let cash = s.startingCash ?? 0;
  const out: Month[] = [];
  for (let m = 1; m <= H; m++) {
    const priceChange = s.priceLeverMonth !== null && known(s.newPrice) && m >= s.priceLeverMonth;
    const price = priceChange ? s.newPrice! : s.price!;
    const budget =
      s.budgetLeverMonth !== null && known(s.newBudget) && m >= s.budgetLeverMonth
        ? s.newBudget!
        : (s.marketingBudget ?? 0);
    const cac = (s.cac ?? 0) * d.cac;
    let churn = ((s.churnPct ?? 0) * d.churn) / 100;
    // Customers remember: a price rise churns some price-sensitive customers that month (§5.5).
    if (priceChange && m === s.priceLeverMonth && s.newPrice! > s.price! && s.price! > 0)
      churn += Math.min(0.3, (s.newPrice! / s.price! - 1) / 2);
    const acquired = cac > 0 ? budget / cac : 0;
    const referred = (customers * (s.referralPct ?? 0)) / 100;
    const room = known(s.marketCap) ? Math.max(0, s.marketCap - customers) : Infinity;
    const newCustomers = Math.min(acquired + referred, room);
    customers = Math.max(0, customers - customers * Math.min(1, churn) + newCustomers);
    const units = customers * (s.purchasesPerMonth ?? 1);
    const revenue = units * price;
    const costs = units * (s.variableCost ?? 0) + (s.fixedMonthly ?? 0) + budget;
    cash += revenue - costs;
    out.push({ month: m, customers, newCustomers, revenue, costs, cash });
  }
  return out;
}

export function outcomes(months: Month[]) {
  if (!months.length) return null;
  const runOut = months.find((m) => m.cash < 0)?.month ?? null;
  const breakEven = months.find((m) => m.revenue >= m.costs)?.month ?? null;
  const last = months.at(-1)!;
  const lowest = months.reduce((a, m) => (m.cash < a.cash ? m : a));
  return { runOut, breakEven, last, lowest };
}

const sumBy = (
  xs: Record<string, unknown>[] | undefined,
  f: (x: Record<string, unknown>) => number,
) => (xs ?? []).reduce((a, x) => a + (Number.isFinite(f(x)) ? f(x) : 0), 0);

export const runGrowWorkspace: PillarWorkspaceDef<RunGrowState> = {
  pillar: "run-grow",
  schema: runGrowStateSchema,
  aiHelpers: [
    "Why did this move?",
    "Market events and competitor moves",
    "Board meeting review",
    "Suggest a what-if",
  ],

  shared: {
    read: (s) => ({
      ...(known(s.price) ? { price: s.price } : {}),
      ...(known(s.variableCost) ? { variableCost: s.variableCost } : {}),
      ...(known(s.fixedMonthly) ? { fixedMonthly: s.fixedMonthly } : {}),
    }),
    write: (s, next, prev) => ({
      ...s,
      price: follow(s.price, next.price, prev.price),
      variableCost: follow(s.variableCost, next.variableCost, prev.variableCost),
      fixedMonthly: follow(s.fixedMonthly, next.fixedMonthly, prev.fixedMonthly),
      marketingBudget: follow(s.marketingBudget, next.marketingBudget, prev.marketingBudget),
      cac: follow(s.cac, next.cac, prev.cac),
      marketCap: follow(s.marketCap, next.marketCustomers, prev.marketCustomers),
    }),
  },

  initial(ctx) {
    const s = runGrowStateSchema.parse({});
    const u = ctx.upstream;
    s.scenarioName = "Base case";
    const plan = u.PricePlan?.at(-1) as
      | { tiers?: { price?: number }[]; waterfall?: { label?: string; amount?: number }[] }
      | undefined;
    const price = plan?.tiers?.[0]?.price;
    if (typeof price === "number") s.price = price;
    const variable = plan?.waterfall?.find((w) => w.label === "Variable cost")?.amount;
    if (typeof variable === "number" && variable !== 0) s.variableCost = Math.abs(variable);
    const fixed =
      sumBy(
        u.CostItem?.filter((c) => c.behaviour === "fixed"),
        (c) => Number(c.amount),
      ) + sumBy(u.TeamRole, (r) => Number(r.salary ?? 0));
    if (fixed) s.fixedMonthly = fixed;
    const channels = (u.ChannelPlan?.at(-1)?.channels ?? []) as {
      monthlyBudget?: number;
      expectedCac?: number;
    }[];
    const budget = channels.reduce((a, c) => a + (c.monthlyBudget ?? 0), 0);
    if (budget) s.marketingBudget = budget;
    const won = channels.reduce(
      (a, c) => a + (c.monthlyBudget && c.expectedCac ? c.monthlyBudget / c.expectedCac : 0),
      0,
    );
    if (won > 0) s.cac = Math.round(budget / won);
    return s;
  },

  goals(s, ctx) {
    const cur = ctx.startup.currency;
    const months = simulate(s);
    const o = outcomes(months);
    const missing = missingInputs(s);
    const goals: Goal[] = [
      {
        id: "runway",
        title: "Runway",
        value: o
          ? o.runOut
            ? `Cash runs out in month ${o.runOut}`
            : `Lasts all ${s.horizon} months`
          : null,
        detail: o
          ? o.runOut
            ? "Plan funding before then"
            : undefined
          : `Needs ${missing.join(", ")}`,
        evidence: "SYNTHETIC",
        done: Boolean(o),
      },
      {
        id: "breakeven",
        title: "Break-even month",
        value: o ? (o.breakEven ? `Month ${o.breakEven}` : "Not within horizon") : null,
        detail: "First month revenue ≥ costs",
        evidence: "SYNTHETIC",
        done: Boolean(o),
      },
      {
        id: "customers",
        title: `Customers at month ${s.horizon}`,
        value: o ? Math.round(o.last.customers).toLocaleString("en-IN") : null,
        evidence: "SYNTHETIC",
        done: Boolean(o),
      },
      {
        id: "revenue",
        title: "Monthly revenue at the end",
        value: o ? formatMoney(o.last.revenue, cur) : null,
        evidence: "SYNTHETIC",
        done: Boolean(o),
      },
      {
        id: "lowest",
        title: "Lowest cash point",
        value: o ? formatMoney(o.lowest.cash, cur) : null,
        detail: o ? `Month ${o.lowest.month}` : "How much funding you'd need",
        evidence: "SYNTHETIC",
        done: Boolean(o),
      },
      {
        id: "cash",
        title: `Cash at month ${s.horizon}`,
        value: o ? formatMoney(o.last.cash, cur) : null,
        evidence: "SYNTHETIC",
        done: Boolean(o),
      },
    ];
    return goals;
  },

  report(s, ctx) {
    const cur = ctx.startup.currency;
    const o = outcomes(simulate(s));
    if (!o) return { headline: null, lines: [] };
    const lines = [
      {
        label: "Scenario",
        value: `${s.scenarioName || "Untitled"} · ${s.horizon} months · ${s.difficulty}`,
      },
      {
        label: "Break-even",
        value: o.breakEven ? `Month ${o.breakEven}` : "Not within horizon",
        evidence: "SYNTHETIC" as const,
      },
      {
        label: "Lowest cash",
        value: `${formatMoney(o.lowest.cash, cur)} (month ${o.lowest.month})`,
        evidence: "SYNTHETIC" as const,
      },
      {
        label: `At month ${s.horizon}`,
        value: `${Math.round(o.last.customers)} customers, ${formatMoney(o.last.revenue, cur)} revenue a month, ${formatMoney(o.last.cash, cur)} cash`,
        evidence: "SYNTHETIC" as const,
      },
    ];
    if (s.priceLeverMonth && known(s.newPrice))
      lines.push({
        label: "Lever",
        value: `Price → ${formatMoney(s.newPrice, cur)} from month ${s.priceLeverMonth}`,
        evidence: "SYNTHETIC",
      });
    if (s.budgetLeverMonth && known(s.newBudget))
      lines.push({
        label: "Lever",
        value: `Marketing → ${formatMoney(s.newBudget, cur)} from month ${s.budgetLeverMonth}`,
        evidence: "SYNTHETIC",
      });
    return {
      headline: o.runOut
        ? `In this what-if, cash runs out in month ${o.runOut}. You'd need about ${formatMoney(-o.lowest.cash + (s.startingCash ?? 0), cur)} more, or a cheaper plan.`
        : `In this what-if, cash lasts all ${s.horizon} months${o.breakEven ? ` and the business breaks even in month ${o.breakEven}` : ""}.`,
      lines,
    };
  },

  entities(s) {
    const months = simulate(s);
    const out: WorkspaceEntity[] = [
      {
        key: "scenario",
        type: "Scenario",
        title: s.scenarioName || "Base case",
        evidenceLabel: "SYNTHETIC",
        data: {
          name: s.scenarioName || "Base case",
          mode: "sandbox",
          horizonMonths: Number(s.horizon),
          difficulty: s.difficulty,
        },
      },
    ];
    if (!months.length) return out;
    const series = (metric: string, f: (m: Month) => number): WorkspaceEntity => ({
      key: `kpi:${metric}`,
      type: "KpiSeries",
      title: `${metric} by month`,
      evidenceLabel: "SYNTHETIC",
      data: {
        metric,
        points: months.map((m) => ({ periodIndex: m.month, value: Math.round(f(m)) })),
      },
    });
    out.push(
      series("cash", (m) => m.cash),
      series("customers", (m) => m.customers),
      series("revenue", (m) => m.revenue),
    );
    return out;
  },
};
