import { z } from "zod";
import {
  follow,
  followList,
  formatCount,
  formatMoney,
  known,
  type Goal,
  type PillarWorkspaceDef,
  type WorkspaceEntity,
} from "@bluslate/contracts";

/**
 * Market Research v1 (decision 0006): how big, reachable and contested is it?
 * A bottom-up sizing funnel (TAM → SAM → SOM) with ranges, a top-down
 * cross-check, and a competitor map. Numbers come from the calculator, never AI.
 */

const str = (n: number) => z.string().max(n).default("");
const num = z.number().min(0).nullable().default(null);
const pct = z.number().min(0).max(100).nullable().default(null);
const rating = z.number().int().min(1).max(5).nullable().default(null);

export const BANDS = [
  { value: "10", label: "Fairly sure (±10%)" },
  { value: "25", label: "Rough (±25%)" },
  { value: "50", label: "A guess (±50%)" },
] as const;
export const COMPETITOR_KINDS = [
  { value: "direct", label: "Direct" },
  { value: "indirect", label: "Indirect" },
  { value: "substitute", label: "Substitute" },
  { value: "do_nothing", label: "Do nothing" },
] as const;
export const PRICE_PERIODS = ["one-time", "per month", "per year", "per use"] as const;
export const TRENDS = ["growing fast", "growing", "stable", "shrinking"] as const;

const competitor = z.object({
  id: z.string(),
  name: str(80),
  kind: z.enum(["direct", "indirect", "substitute", "do_nothing"]).default("direct"),
  price: num,
  pricePeriod: z.enum(PRICE_PERIODS).default("per month"),
  priceLevel: rating,
  quality: rating,
  url: str(300),
});

export const marketStateSchema = z.object({
  geography: str(80),
  segment: str(140),
  customers: num,
  customersSource: str(300),
  valuePerCustomer: num,
  valueSource: str(300),
  reachPct: pct,
  winPct: pct,
  band: z.enum(["10", "25", "50"]).default("25"),
  marketValue: num,
  marketSource: str(300),
  segmentSharePct: pct,
  competitors: z.array(competitor).max(12).default([]),
  youPrice: rating,
  youQuality: rating,
  trend: z.enum(TRENDS).or(z.literal("")).default(""),
  trendNote: str(200),
});
export type MarketState = z.infer<typeof marketStateSchema>;

// ─── Calculators ─────────────────────────────────────────────────────────────

export interface Size {
  low: number;
  base: number;
  high: number;
}
const band = (base: number, b: number): Size => ({
  low: base * (1 - b),
  base,
  high: base * (1 + b),
});

/** Bottom-up sizing: TAM = customers × yearly value; SAM = TAM × reach; SOM = SAM × win share. */
export function sizing(s: MarketState) {
  const b = Number(s.band) / 100;
  const tam =
    known(s.customers) && known(s.valuePerCustomer) ? s.customers * s.valuePerCustomer : null;
  const sam = tam !== null && known(s.reachPct) ? (tam * s.reachPct) / 100 : null;
  const som = sam !== null && known(s.winPct) ? (sam * s.winPct) / 100 : null;
  const somCustomers =
    known(s.customers) && known(s.reachPct) && known(s.winPct)
      ? (s.customers * s.reachPct * s.winPct) / 10000
      : null;
  return {
    tam: tam === null ? null : band(tam, b),
    sam: sam === null ? null : band(sam, b),
    som: som === null ? null : band(som, b),
    somCustomers,
  };
}

/** Top-down cross-check: market value × segment share, and how far it is from bottom-up TAM. */
export function topDown(s: MarketState) {
  const td =
    known(s.marketValue) && known(s.segmentSharePct)
      ? (s.marketValue * s.segmentSharePct) / 100
      : null;
  const tam = sizing(s).tam?.base ?? null;
  const gapPct = td !== null && tam !== null && td > 0 ? ((tam - td) / td) * 100 : null;
  return { value: td, gapPct };
}

export function sourcesCited(s: MarketState): number {
  return [
    s.customersSource,
    s.valueSource,
    s.marketSource,
    ...s.competitors.map((c) => c.url),
  ].filter((x) => x.trim()).length;
}

/**
 * The market's place: the shared target market chosen in Customer Discovery
 * or here (decision 0012). `state.geography` is only kept for old workspaces.
 */
export function boundaryPlace(s: MarketState, startupGeography: string): string {
  return startupGeography.trim() || s.geography.trim();
}

const range = (x: Size, cur: string) => `${formatMoney(x.low, cur)}–${formatMoney(x.high, cur)}`;

// ─── Workspace ───────────────────────────────────────────────────────────────

export const marketWorkspace: PillarWorkspaceDef<MarketState> = {
  pillar: "market",
  schema: marketStateSchema,
  aiHelpers: [
    "Research market data with sources",
    "Find competitors",
    "Check my sizing",
    "Sensitivity tornado",
  ],

  shared: {
    read: (s) => {
      const z = sizing(s);
      return {
        ...(s.segment.trim() ? { segment: s.segment.trim() } : {}),
        ...(z.somCustomers !== null ? { marketCustomers: Math.round(z.somCustomers) } : {}),
      };
    },
    write: (s, next, prev) => {
      const names = followList(
        s.competitors.map((c) => c.name),
        next.alternatives,
        prev.alternatives,
      ).slice(0, 12);
      const byName = new Map(s.competitors.map((c) => [c.name.trim().toLowerCase(), c] as const));
      return {
        ...s,
        segment: follow(s.segment, next.segment?.slice(0, 140), prev.segment?.slice(0, 140)),
        valuePerCustomer: follow(s.valuePerCustomer, next.yearlyValue, prev.yearlyValue),
        competitors: names.map(
          (name, i) =>
            byName.get(name.trim().toLowerCase()) ?? {
              id: `alt-${name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .slice(0, 24)}-${i}`,
              name: name.slice(0, 80),
              kind: "indirect" as const,
              price: null,
              pricePeriod: "per month" as const,
              priceLevel: null,
              quality: null,
              url: "",
            },
        ),
      };
    },
  },

  initial(ctx) {
    const s = marketStateSchema.parse({});
    const seg = ctx.upstream.Segment?.[0];
    const p = ctx.upstream.Problem?.at(-1);
    s.segment = String(seg?.name ?? p?.who ?? "").slice(0, 140);
    const alts = Array.isArray(p?.alternatives)
      ? (p.alternatives as { name?: string; kind?: string }[])
      : [];
    s.competitors = alts.slice(0, 6).map((a, i) => ({
      id: `alt${i + 1}`,
      name: String(a.name ?? "").slice(0, 80),
      kind: a.kind === "do-nothing" ? "do_nothing" : a.kind === "diy" ? "substitute" : "indirect",
      price: null,
      pricePeriod: "per month",
      priceLevel: null,
      quality: null,
      url: "",
    }));
    return s;
  },

  goals(s, ctx) {
    const cur = ctx.startup.currency;
    const z = sizing(s);
    const td = topDown(s);
    const direct = s.competitors.filter((c) => c.kind === "direct" && c.name.trim()).length;
    const mapped = s.competitors.filter((c) => c.name.trim()).length;
    const goals: Goal[] = [
      {
        id: "tam",
        title: "TAM · total market",
        value: z.tam ? formatMoney(z.tam.base, cur) : null,
        detail: z.tam ? `${range(z.tam, cur)} a year` : "Customers × yearly value per customer",
        evidence: "ESTIMATE",
        done: z.tam !== null,
      },
      {
        id: "sam",
        title: "SAM · you can reach",
        value: z.sam ? formatMoney(z.sam.base, cur) : null,
        detail: z.sam
          ? `${range(z.sam, cur)} · ${s.reachPct}% of TAM`
          : "TAM × share you can reach",
        evidence: "ESTIMATE",
        done: z.sam !== null,
      },
      {
        id: "som",
        title: "SOM · you could win",
        value: z.som ? formatMoney(z.som.base, cur) : null,
        detail: z.som
          ? `${range(z.som, cur)} · ${s.winPct}% of SAM in 3 years`
          : "SAM × share you could win",
        evidence: "ESTIMATE",
        done: z.som !== null,
      },
      {
        id: "somCustomers",
        title: "Customers at SOM",
        value: z.somCustomers === null ? null : formatCount(z.somCustomers),
        detail: "Customers × reach × win",
        evidence: "ESTIMATE",
        done: z.somCustomers !== null,
      },
      {
        id: "crosscheck",
        title: "Top-down cross-check",
        value: td.gapPct === null ? null : `${td.gapPct > 0 ? "+" : ""}${Math.round(td.gapPct)}%`,
        detail:
          td.gapPct === null
            ? "Add a market value and segment share"
            : Math.abs(td.gapPct) <= 50
              ? "Bottom-up and top-down roughly agree"
              : "Big gap: check your definitions",
        done: td.gapPct !== null,
      },
      {
        id: "competitors",
        title: "Competitors mapped",
        value: `${mapped} (${direct} direct)`,
        detail: "Include substitutes and doing nothing",
        done: mapped >= 3,
      },
      {
        id: "sources",
        title: "Sources cited",
        value: String(sourcesCited(s)),
        detail: "Unsourced numbers stay ASSUMED",
        done: sourcesCited(s) >= 2,
      },
    ];
    return goals;
  },

  report(s, ctx) {
    const cur = ctx.startup.currency;
    const z = sizing(s);
    const lines: { label: string; value: string; evidence?: "ESTIMATE" | "ASSUMED" | "SOURCED" }[] =
      [];
    if (z.tam)
      lines.push({
        label: "TAM",
        value: `${formatMoney(z.tam.base, cur)} (${range(z.tam, cur)})`,
        evidence: "ESTIMATE",
      });
    if (z.sam)
      lines.push({
        label: "SAM",
        value: `${formatMoney(z.sam.base, cur)} (${range(z.sam, cur)})`,
        evidence: "ESTIMATE",
      });
    if (z.som)
      lines.push({
        label: "SOM",
        value: `${formatMoney(z.som.base, cur)} (${range(z.som, cur)})`,
        evidence: "ESTIMATE",
      });
    const comps = s.competitors.filter((c) => c.name.trim());
    if (comps.length)
      lines.push({
        label: "Competitors",
        value: comps.map((c) => `${c.name} (${c.kind.replace("_", " ")})`).join(", "),
        evidence: "ASSUMED",
      });
    if (s.trend)
      lines.push({
        label: "Market trend",
        value: `${s.trend}${s.trendNote ? ` — ${s.trendNote}` : ""}`,
        evidence: "ASSUMED",
      });
    lines.push({ label: "Sources cited", value: String(sourcesCited(s)) });
    return {
      headline: z.som
        ? `${s.segment || "The market"} in ${boundaryPlace(s, ctx.startup.geography) || "your area"}: about ${formatMoney(z.sam!.base, cur)} a year is reachable, and ${formatMoney(z.som.base, cur)} is winnable.`
        : null,
      lines,
    };
  },

  entities(s, ctx) {
    const cur = ctx.startup.currency;
    const z = sizing(s);
    const out: WorkspaceEntity[] = [];
    if (z.tam) {
      const lbh = (x: Size | null) =>
        x ? { low: Math.round(x.low), base: Math.round(x.base), high: Math.round(x.high) } : {};
      out.push({
        key: "size",
        type: "MarketSize",
        title: `TAM ${formatMoney(z.tam.base, cur)}`,
        evidenceLabel: "ESTIMATE",
        data: {
          boundary: {
            geography: boundaryPlace(s, ctx.startup.geography),
            segment: s.segment,
            period: "per year",
            currency: cur,
          },
          bottomUp: [
            {
              label: "Potential customers",
              value: s.customers!,
              unit: "people",
              formula: s.customersSource ? `source: ${s.customersSource}` : "assumed",
            },
            {
              label: "Yearly value per customer",
              value: s.valuePerCustomer!,
              unit: cur,
              formula: s.valueSource ? `source: ${s.valueSource}` : "assumed",
            },
            ...(known(s.reachPct) ? [{ label: "Reachable", value: s.reachPct, unit: "%" }] : []),
            ...(known(s.winPct)
              ? [{ label: "Winnable in 3 years", value: s.winPct, unit: "%" }]
              : []),
          ],
          topDown:
            known(s.marketValue) && known(s.segmentSharePct)
              ? [
                  {
                    label: "Market value",
                    value: s.marketValue,
                    unit: cur,
                    formula: s.marketSource,
                  },
                  { label: "Segment share", value: s.segmentSharePct, unit: "%" },
                ]
              : [],
          tam: lbh(z.tam),
          sam: lbh(z.sam),
          som: lbh(z.som),
        },
      });
    }
    for (const c of s.competitors.filter((x) => x.name.trim()))
      out.push({
        key: `comp:${c.id}`,
        type: "Competitor",
        title: c.name,
        evidenceLabel: "ASSUMED",
        data: {
          name: c.name,
          kind: c.kind,
          url: c.url,
          ...(known(c.price)
            ? { pricing: { amount: c.price, currency: cur, period: c.pricePeriod } }
            : {}),
          ...(c.priceLevel !== null ? { priceLevel: c.priceLevel } : {}),
          ...(c.quality !== null ? { quality: c.quality } : {}),
        },
      });
    return out;
  },
};
