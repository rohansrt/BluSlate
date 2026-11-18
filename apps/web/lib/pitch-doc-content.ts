import type {
  EvidenceLabel,
  Goal,
  ProgressState,
  ReportBlock,
  WorkspaceEntity,
} from "@bluslate/contracts";
import { DOC_KIND_INFO, type DocKind } from "@/lib/pitch-doc-kinds";
import { PILLARS, type PillarId } from "@/lib/pillars";

/**
 * What goes into a pitch document (decision 0012). Pure: it takes each
 * pillar's report, goals and entities and returns the frozen content that is
 * stored and later rendered as PDF or XLSX. A section exists only for a
 * pillar with work in it. AI predictions are only added when the founder
 * asked for them, and are always marked as predictions.
 */

export interface DocLine {
  label: string;
  value: string;
  evidence?: EvidenceLabel;
}

export interface Prediction {
  headline: string;
  points: string[];
}

export interface DocSection {
  pillar: PillarId;
  number: number;
  title: string;
  question: string;
  state: ProgressState;
  headline: string | null;
  lines: DocLine[];
  goals: { title: string; value: string; done: boolean }[];
  /** Goals not met yet (listed so a reader sees the gaps). */
  open: string[];
  /** AI's best prediction for what's missing, when the founder asked for it. */
  prediction?: Prediction;
}

export type CanvasBoxId =
  | "partners"
  | "activities"
  | "resources"
  | "value"
  | "relationships"
  | "channels"
  | "segments"
  | "costs"
  | "revenue";

export interface CanvasBox {
  id: CanvasBoxId;
  title: string;
  items: string[];
  /** The items are AI predictions. */
  predicted?: boolean;
}

export interface FinancialRow {
  label: string;
  value: number;
  unit: string;
  from: string;
  evidence: EvidenceLabel;
}

export interface Financials {
  currency: string;
  assumptions: FinancialRow[];
  costs: { name: string; behaviour: string; basis: string; amount: number }[];
  months: {
    month: number;
    revenue: number | null;
    customers: number | null;
    cash: number | null;
  }[];
}

export interface DocContent {
  version: 1;
  kind: DocKind;
  title: string;
  startup: { name: string; market: string; currency: string; idea?: string };
  generatedAt: string;
  sections: DocSection[];
  /** Steps with no work in them: left out of the document. */
  leftOut: { pillar: PillarId; name: string }[];
  canvas?: CanvasBox[];
  financials?: Financials;
  aiFilled: boolean;
}

/** One pillar's work, as the builder needs it. */
export interface PillarSnapshot {
  pillar: PillarId;
  state: ProgressState;
  report: ReportBlock;
  goals: Goal[];
  entities: WorkspaceEntity[];
}

export interface AiFill {
  sections: { pillar: PillarId; headline: string; points: string[] }[];
  canvas: { box: CanvasBoxId; items: string[] }[];
}

export const CANVAS_TITLES: Record<CanvasBoxId, string> = {
  partners: "Key partners",
  activities: "Key activities",
  resources: "Key resources",
  value: "Value propositions",
  relationships: "Customer relationships",
  channels: "Channels",
  segments: "Customer segments",
  costs: "Cost structure",
  revenue: "Revenue streams",
};

/** Canvas order, left to right, top to bottom. */
export const CANVAS_ORDER: CanvasBoxId[] = [
  "partners",
  "activities",
  "resources",
  "value",
  "relationships",
  "channels",
  "segments",
  "costs",
  "revenue",
];

const pillarMeta = (id: PillarId) => PILLARS.find((p) => p.id === id)!;

/** The pillars a document draws on that aren't complete: what the AI prompt asks about. */
export function gapsFor(kind: DocKind, snapshots: PillarSnapshot[]) {
  return DOC_KIND_INFO[kind].pillars
    .map((id) => snapshots.find((s) => s.pillar === id)!)
    .filter((s) => s.state !== "complete")
    .map((s) => ({
      pillar: s.pillar,
      name: pillarMeta(s.pillar).name,
      state: s.state,
      missingGoals: s.goals.filter((g) => !g.done).map((g) => g.title),
    }));
}

function sectionFor(s: PillarSnapshot): DocSection {
  const meta = pillarMeta(s.pillar);
  return {
    pillar: s.pillar,
    number: meta.number,
    title: meta.name,
    question: meta.question,
    state: s.state,
    headline: s.report.headline,
    lines: s.report.lines.filter((l) => l.value && l.value !== "—"),
    goals: s.goals
      .filter((g) => g.value !== null)
      .map((g) => ({ title: g.title, value: g.value!, done: g.done })),
    open: s.goals.filter((g) => !g.done).map((g) => g.title),
  };
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))];

function entitiesOf(snapshots: PillarSnapshot[], type: string) {
  return snapshots.flatMap((s) => s.entities.filter((e) => e.type === type));
}

/** The nine canvas boxes from the steps' entities. */
export function canvasFrom(snapshots: PillarSnapshot[], currency: string): CanvasBox[] {
  const all = snapshots.filter((s) => s.state !== "empty");
  const of = (type: string) => entitiesOf(all, type).map((e) => e.data);
  const items: Record<CanvasBoxId, string[]> = {
    partners: of("Enabler").map((d) => str(d.name)),
    activities: of("Process").flatMap((d) =>
      Array.isArray(d.steps) ? (d.steps as { name?: unknown }[]).map((x) => str(x.name)) : [],
    ),
    resources: of("TeamRole").map((d) => str(d.title)),
    value: of("ValueProposition").flatMap((d) => [
      str(d.statement),
      ...(Array.isArray(d.gains) ? (d.gains as unknown[]).map(str) : []),
    ]),
    // Nothing in the steps asks this yet: AI can predict it when asked.
    relationships: [],
    channels: uniq([
      ...of("ChannelPlan").flatMap((d) =>
        Array.isArray(d.channels)
          ? (d.channels as { channel?: unknown }[]).map((c) => str(c.channel))
          : [],
      ),
      ...of("Segment").flatMap((d) =>
        Array.isArray(d.channels) ? (d.channels as unknown[]).map(str) : [],
      ),
    ]),
    segments: of("Segment").map((d) => str(d.name)),
    costs: of("CostItem").map((d) => {
      const amount = num(d.amount);
      return `${str(d.name)}${amount !== null ? ` (${currency} ${amount.toLocaleString("en-IN")}${str(d.behaviour) === "fixed" ? " a month" : " each"})` : ""}`;
    }),
    revenue: [
      ...of("RevenueModel").map((d) =>
        [str(d.type).replace(/_/g, " "), str(d.billingPeriod) && `billed ${str(d.billingPeriod)}`]
          .filter(Boolean)
          .join(", "),
      ),
      ...of("PricePlan").flatMap((d) =>
        Array.isArray(d.tiers)
          ? (d.tiers as { name?: unknown; price?: unknown; period?: unknown }[]).map(
              (t) =>
                `${str(t.name) || "Price"}: ${currency} ${num(t.price)?.toLocaleString("en-IN") ?? "?"} ${str(t.period)}`,
            )
          : [],
      ),
    ],
  };
  return CANVAS_ORDER.map((id) => ({
    id,
    title: CANVAS_TITLES[id],
    items: uniq(items[id]).slice(0, 8),
  })).filter((b) => b.items.length > 0);
}

/** Inputs and the monthly projection for the financial model. */
export function financialsFrom(snapshots: PillarSnapshot[], currency: string): Financials {
  const started = snapshots.filter((s) => s.state !== "empty");
  const assumptions: FinancialRow[] = [];
  const add = (
    label: string,
    value: number | null,
    unit: string,
    from: PillarId,
    evidence: EvidenceLabel = "ASSUMED",
  ) => {
    if (value !== null)
      assumptions.push({ label, value, unit, from: pillarMeta(from).name, evidence });
  };
  const size = entitiesOf(started, "MarketSize")[0]?.data;
  const base = (k: string) =>
    size && typeof size[k] === "object" && size[k]
      ? num((size[k] as { base?: unknown }).base)
      : null;
  add("TAM (a year)", base("tam"), currency, "market", "ESTIMATE");
  add("SAM (a year)", base("sam"), currency, "market", "ESTIMATE");
  add("SOM (a year)", base("som"), currency, "market", "ESTIMATE");

  const price = entitiesOf(started, "PricePlan")[0]?.data;
  if (price) {
    const tier = Array.isArray(price.tiers) ? (price.tiers as { price?: unknown }[])[0] : undefined;
    add("Price", num(tier?.price), currency, "gtm");
    add("Contribution per unit", num(price.contributionPerUnit), currency, "gtm", "ESTIMATE");
  }
  const channels = entitiesOf(started, "ChannelPlan")[0]?.data;
  if (channels && Array.isArray(channels.channels)) {
    const list = channels.channels as { monthlyBudget?: unknown; expectedCac?: unknown }[];
    const budget = list.reduce((a, c) => a + (num(c.monthlyBudget) ?? 0), 0);
    if (budget > 0) add("Marketing budget a month", budget, currency, "gtm");
  }
  const costs = entitiesOf(started, "CostItem").map((e) => ({
    name: str(e.data.name),
    behaviour: str(e.data.behaviour),
    basis: str(e.data.basis),
    amount: num(e.data.amount) ?? 0,
  }));
  const fixed = costs.filter((c) => c.behaviour === "fixed").reduce((a, c) => a + c.amount, 0);
  const payroll = entitiesOf(started, "TeamRole").reduce(
    (a, e) => a + (num(e.data.salary) ?? 0),
    0,
  );
  if (costs.length || payroll)
    add("Fixed costs a month (incl. team)", fixed + payroll, currency, "setup", "ESTIMATE");
  if (payroll) add("Team pay a month", payroll, currency, "setup");

  const series = (metric: string) => {
    const e = entitiesOf(started, "KpiSeries").find((k) => k.data.metric === metric);
    return Array.isArray(e?.data.points)
      ? (e!.data.points as { periodIndex: number; value: number }[])
      : [];
  };
  const cash = series("cash");
  const revenue = series("revenue");
  const customers = series("customers");
  const monthsN = Math.max(cash.length, revenue.length, customers.length);
  const at = (xs: { periodIndex: number; value: number }[], m: number) =>
    xs.find((p) => p.periodIndex === m)?.value ?? null;
  const months = Array.from({ length: monthsN }, (_, i) => {
    const m = (cash[i] ?? revenue[i] ?? customers[i])!.periodIndex;
    return { month: m, revenue: at(revenue, m), customers: at(customers, m), cash: at(cash, m) };
  });
  return { currency, assumptions, costs, months };
}

/** Summaries of completed work, for the AI prompt. */
export function summariesFor(snapshots: PillarSnapshot[]) {
  return snapshots
    .filter((s) => s.state !== "empty")
    .map((s) => ({
      pillar: s.pillar,
      summary: [
        s.report.headline ?? "",
        ...s.report.lines.map((l) => `${l.label}: ${l.value}`),
        ...s.goals.filter((g) => g.value !== null).map((g) => `${g.title}: ${g.value}`),
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 4000),
    }));
}

export function buildDocContent({
  kind,
  startup,
  snapshots,
  fill,
  now,
}: {
  kind: DocKind;
  startup: DocContent["startup"];
  snapshots: PillarSnapshot[];
  /** AI predictions, only when the founder asked for them. */
  fill?: AiFill | null;
  now: Date;
}): DocContent {
  const info = DOC_KIND_INFO[kind];
  const mine = info.pillars.map((id) => snapshots.find((s) => s.pillar === id)!);
  const sections: DocSection[] = [];
  const leftOut: DocContent["leftOut"] = [];
  for (const s of mine) {
    const predicted = fill?.sections.find((f) => f.pillar === s.pillar);
    const prediction =
      predicted && s.state !== "complete"
        ? { headline: predicted.headline, points: predicted.points }
        : undefined;
    if (s.state === "empty" && !prediction) {
      leftOut.push({ pillar: s.pillar, name: pillarMeta(s.pillar).name });
      continue;
    }
    const section = sectionFor(s);
    if (s.state === "empty") {
      section.headline = null;
      section.lines = [];
      section.goals = [];
    }
    sections.push(prediction ? { ...section, prediction } : section);
  }

  const content: DocContent = {
    version: 1,
    kind,
    title: info.title,
    startup,
    generatedAt: now.toISOString(),
    sections,
    leftOut,
    aiFilled: Boolean(fill),
  };
  if (kind === "canvas") {
    const boxes = canvasFrom(mine, startup.currency);
    for (const f of fill?.canvas ?? []) {
      if (boxes.some((b) => b.id === f.box) || f.items.length === 0) continue;
      boxes.push({
        id: f.box,
        title: CANVAS_TITLES[f.box],
        items: f.items.slice(0, 4),
        predicted: true,
      });
    }
    content.canvas = CANVAS_ORDER.map((id) => boxes.find((b) => b.id === id)).filter(
      (b): b is CanvasBox => Boolean(b),
    );
  }
  if (kind === "financials") content.financials = financialsFrom(mine, startup.currency);
  return content;
}

/** Canvas boxes with nothing in them: what the AI is asked to predict. */
export function missingCanvasBoxes(snapshots: PillarSnapshot[], currency: string): CanvasBoxId[] {
  const have = new Set(canvasFrom(snapshots, currency).map((b) => b.id));
  return CANVAS_ORDER.filter((id) => !have.has(id));
}
