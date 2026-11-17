import { z } from "zod";
import {
  formatMoney,
  formatPct,
  known,
  type Goal,
  type PillarWorkspaceDef,
  type WorkspaceEntity,
} from "@bluslate/contracts";

/**
 * Go-to-Market Plan v1 (decision 0006): who buys first, at what price, through
 * which channels? Positioning → Pricing Lab (waterfall, contribution) →
 * Bullseye channels (CAC, customers) → break-even → launch checklist.
 */

const str = (n: number) => z.string().max(n).default("");
const num = z.number().min(0).nullable().default(null);
const pct = z.number().min(0).max(100).nullable().default(null);

export const PRICE_METHODS = ["value-based", "competitor-based", "cost-plus"] as const;
export const PERIODS = ["per unit", "per month", "per year"] as const;
export const CHANNELS = [
  "Instagram",
  "Google search ads",
  "WhatsApp / communities",
  "Referrals",
  "Partnerships",
  "Direct sales",
  "Content / SEO",
  "Events",
  "Marketplaces",
  "Offline posters",
] as const;
export const RINGS = [
  { value: "inner", label: "Inner · test now" },
  { value: "middle", label: "Middle · maybe" },
  { value: "outer", label: "Outer · later" },
] as const;
const DEFAULT_CHECKLIST = [
  "First version ready to use",
  "Price and payment set up",
  "Launch message written",
  "First 10 customers lined up",
  "Support contact ready",
  "Legal basics checked",
];

const channel = z.object({
  id: z.string(),
  channel: z.enum(CHANNELS).default("Referrals"),
  ring: z.enum(["inner", "middle", "outer"]).default("inner"),
  monthlyBudget: num,
  cac: num,
});

export const gtmStateSchema = z.object({
  beachhead: str(140),
  need: str(160),
  category: str(80),
  benefit: str(160),
  alternative: str(80),
  differentiation: str(160),
  method: z.enum(PRICE_METHODS).or(z.literal("")).default(""),
  price: num,
  period: z.enum(PERIODS).default("per month"),
  discountPct: pct,
  feesPct: pct,
  variableCost: num,
  fixedMonthly: num,
  channels: z.array(channel).max(10).default([]),
  launchDate: str(10),
  checklist: z
    .array(z.object({ id: z.string(), item: str(80), done: z.boolean().default(false) }))
    .max(20)
    .default(DEFAULT_CHECKLIST.map((item, i) => ({ id: `c${i + 1}`, item, done: false }))),
});
export type GtmState = z.infer<typeof gtmStateSchema>;

// ─── Calculators ─────────────────────────────────────────────────────────────

/** Price waterfall: list price → discount → fees → variable cost → contribution per unit. */
export function waterfall(s: GtmState) {
  if (!known(s.price)) return null;
  const discount = (s.price * (s.discountPct ?? 0)) / 100;
  const afterDiscount = s.price - discount;
  const fees = (afterDiscount * (s.feesPct ?? 0)) / 100;
  const net = afterDiscount - fees;
  const variable = s.variableCost ?? 0;
  const contribution = net - variable;
  return {
    steps: [
      { label: "List price", amount: s.price },
      { label: "Discount", amount: -discount },
      { label: "Fees", amount: -fees },
      { label: "Variable cost", amount: -variable },
    ],
    net,
    contribution,
    marginPct: s.price > 0 ? (contribution / s.price) * 100 : null,
    costKnown: known(s.variableCost),
  };
}

export function funnel(s: GtmState) {
  const paid = s.channels.filter((c) => known(c.monthlyBudget) && known(c.cac) && (c.cac ?? 0) > 0);
  const budget = s.channels.reduce((a, c) => a + (c.monthlyBudget ?? 0), 0);
  const customers = paid.reduce((a, c) => a + (c.monthlyBudget ?? 0) / (c.cac ?? 1), 0);
  return {
    budget,
    customers: paid.length ? customers : null,
    blendedCac:
      paid.length && customers > 0
        ? paid.reduce((a, c) => a + (c.monthlyBudget ?? 0), 0) / customers
        : null,
  };
}

export function breakEven(s: GtmState) {
  const w = waterfall(s);
  const f = funnel(s);
  const units =
    w && w.contribution > 0 && known(s.fixedMonthly)
      ? Math.ceil((s.fixedMonthly + f.budget) / w.contribution)
      : null;
  const payback =
    w && w.contribution > 0 && f.blendedCac !== null ? f.blendedCac / w.contribution : null;
  return { units, payback };
}

export function positioning(s: GtmState): string {
  if (!s.beachhead.trim() || !s.benefit.trim()) return "";
  const need = s.need.trim()
    ? ` who need to ${s.need.trim().replace(/^to /i, "").replace(/\.$/, "").toLowerCase()}`
    : "";
  const cat = s.category.trim()
    ? ` is ${/^[aeiou]/i.test(s.category) ? "an" : "a"} ${s.category.trim()}`
    : " is the option";
  const vs = s.alternative.trim()
    ? ` Unlike ${s.alternative.trim()}, ${s.differentiation.trim().replace(/\.$/, "") || "it's made for them"}.`
    : "";
  return `For ${s.beachhead.trim()}${need}, we${cat} that ${s.benefit.trim().replace(/\.$/, "")}.${vs}`;
}

// ─── Workspace ───────────────────────────────────────────────────────────────

export const gtmWorkspace: PillarWorkspaceDef<GtmState> = {
  pillar: "gtm",
  schema: gtmStateSchema,
  aiHelpers: [
    "Test messages with personas",
    "Suggest a price range",
    "Find channels for this segment",
    "Draft a campaign",
  ],

  initial(ctx) {
    const s = gtmStateSchema.parse({});
    const u = ctx.upstream;
    s.beachhead = String(u.Segment?.[0]?.name ?? "").slice(0, 140);
    s.need = String(u.Need?.[0]?.statement ?? "").slice(0, 160);
    const comp = u.Competitor?.find((c) => c.kind === "direct") ?? u.Competitor?.[0];
    s.alternative = String(comp?.name ?? "").slice(0, 80);
    const costs = u.CostItem ?? [];
    const variable = costs
      .filter((c) => c.behaviour === "variable" && c.basis === "per_unit")
      .reduce((a, c) => a + Number(c.amount ?? 0), 0);
    const fixed = costs
      .filter((c) => c.behaviour === "fixed")
      .reduce((a, c) => a + Number(c.amount ?? 0), 0);
    if (variable) s.variableCost = variable;
    if (fixed) s.fixedMonthly = fixed;
    return s;
  },

  goals(s, ctx) {
    const cur = ctx.startup.currency;
    const w = waterfall(s);
    const f = funnel(s);
    const b = breakEven(s);
    const done = s.checklist.filter((c) => c.done).length;
    const goals: Goal[] = [
      {
        id: "price",
        title: "Price",
        value: known(s.price) ? `${formatMoney(s.price, cur)} ${s.period}` : null,
        detail: s.method ? `${s.method} pricing` : "Pick a method",
        evidence: "ASSUMED",
      },
      {
        id: "contribution",
        title: "Contribution per unit",
        value: w ? formatMoney(w.contribution, cur) : null,
        detail: w && !w.costKnown ? "Add variable cost" : "Net price − variable cost",
        evidence: "ESTIMATE",
      },
      {
        id: "margin",
        title: "Margin",
        value: w?.marginPct != null ? formatPct(w.marginPct) : null,
        evidence: "ESTIMATE",
        done: (w?.marginPct ?? 0) >= 30,
      },
      {
        id: "cac",
        title: "Blended CAC",
        value: f.blendedCac === null ? null : formatMoney(f.blendedCac, cur),
        detail: "Budget ÷ customers won",
        evidence: "ASSUMED",
      },
      {
        id: "customers",
        title: "New customers a month",
        value: f.customers === null ? null : String(Math.round(f.customers)),
        detail: f.budget ? `from ${formatMoney(f.budget, cur)} a month` : undefined,
        evidence: "ESTIMATE",
      },
      {
        id: "breakeven",
        title: "Break-even",
        value: b.units === null ? null : `${b.units} units/month`,
        detail: "(fixed + marketing) ÷ contribution",
        evidence: "ESTIMATE",
      },
      {
        id: "payback",
        title: "CAC payback",
        value: b.payback === null ? null : `${b.payback.toFixed(1)} units`,
        detail: "Purchases needed to earn back CAC",
        evidence: "ESTIMATE",
        done: b.payback !== null && b.payback <= 3,
      },
      {
        id: "launch",
        title: "Launch checklist",
        value: `${done} of ${s.checklist.length}`,
        detail: s.launchDate ? `Launch ${s.launchDate}` : "Set a launch date",
        done: done === s.checklist.length && s.checklist.length > 0,
      },
    ];
    return goals;
  },

  report(s, ctx) {
    const cur = ctx.startup.currency;
    const w = waterfall(s);
    const f = funnel(s);
    const b = breakEven(s);
    const lines: { label: string; value: string; evidence?: "ASSUMED" | "ESTIMATE" }[] = [];
    if (known(s.price))
      lines.push({
        label: "Price",
        value: `${formatMoney(s.price, cur)} ${s.period}${s.method ? ` (${s.method})` : ""}`,
        evidence: "ASSUMED",
      });
    if (w)
      lines.push({
        label: "Contribution per unit",
        value: `${formatMoney(w.contribution, cur)}${w.marginPct != null ? ` (${formatPct(w.marginPct)} margin)` : ""}`,
        evidence: "ESTIMATE",
      });
    const inner = s.channels.filter((c) => c.ring === "inner").map((c) => c.channel);
    if (inner.length)
      lines.push({ label: "Channels to test first", value: inner.join(", "), evidence: "ASSUMED" });
    if (f.customers !== null)
      lines.push({
        label: "Customers a month",
        value: `${Math.round(f.customers)} at ${formatMoney(f.blendedCac ?? 0, cur)} CAC`,
        evidence: "ESTIMATE",
      });
    if (b.units !== null)
      lines.push({ label: "Break-even", value: `${b.units} units a month`, evidence: "ESTIMATE" });
    if (s.launchDate)
      lines.push({
        label: "Launch",
        value: `${s.launchDate} · ${s.checklist.filter((c) => c.done).length}/${s.checklist.length} ready`,
      });
    return { headline: positioning(s) || null, lines };
  },

  entities(s, ctx) {
    const cur = ctx.startup.currency;
    const out: WorkspaceEntity[] = [];
    const pos = positioning(s);
    if (pos)
      out.push({
        key: "positioning",
        type: "Positioning",
        title: s.beachhead,
        evidenceLabel: "ASSUMED",
        data: {
          statement: pos,
          alternatives: s.alternative ? [s.alternative] : [],
          differentiation: s.differentiation,
        },
      });
    const w = waterfall(s);
    if (w)
      out.push({
        key: "price",
        type: "PricePlan",
        title: `${formatMoney(s.price!, cur)} ${s.period}`,
        evidenceLabel: "ASSUMED",
        data: {
          method: s.method,
          tiers: [{ name: "Standard", price: s.price!, currency: cur, period: s.period }],
          discounts:
            known(s.discountPct) && s.discountPct > 0
              ? [{ name: "Launch discount", pct: s.discountPct }]
              : [],
          waterfall: w.steps.map((x) => ({
            label: x.label,
            amount: Math.round(x.amount * 100) / 100,
          })),
          contributionPerUnit: Math.round(w.contribution * 100) / 100,
        },
      });
    if (s.channels.length)
      out.push({
        key: "channels",
        type: "ChannelPlan",
        title: `${s.channels.length} channels`,
        evidenceLabel: "ASSUMED",
        data: {
          channels: s.channels.map((c) => ({
            channel: c.channel,
            ring: c.ring,
            currency: cur,
            benchmarkIds: [],
            ...(known(c.monthlyBudget) ? { monthlyBudget: c.monthlyBudget } : {}),
            ...(known(c.cac) ? { expectedCac: c.cac } : {}),
          })),
        },
      });
    if (s.launchDate || s.checklist.some((c) => c.done))
      out.push({
        key: "launch",
        type: "LaunchPlan",
        title: s.launchDate || "Launch checklist",
        evidenceLabel: "ASSUMED",
        data: {
          ...(s.launchDate ? { date: s.launchDate } : {}),
          dependencies: [],
          checklist: s.checklist.map((c) => ({ item: c.item, done: c.done })),
        },
      });
    return out;
  },
};
