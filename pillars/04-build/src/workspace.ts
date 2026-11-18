import { z } from "zod";
import {
  ARCHETYPES,
  follow,
  followList,
  known,
  type Goal,
  type PillarWorkspaceDef,
  type WorkspaceEntity,
} from "@bluslate/contracts";

/**
 * Product Design v1 (decision 0006): what exactly should exist? Needs → value
 * proposition → features ranked by RICE with an MVP line → business model.
 */

const str = (n: number) => z.string().max(n).default("");
const num = z.number().min(0).nullable().default(null);

export const ARCHETYPE_LABEL: Record<(typeof ARCHETYPES)[number], string> = {
  digital_subscription: "Digital subscription",
  physical_product: "Physical product",
  shop: "Shop",
  recurring_service: "Recurring service",
  marketplace: "Marketplace",
  mixed_b2b: "B2B / mixed",
};
export const MVP_TYPES = [
  "concierge (done by hand)",
  "landing page",
  "clickable prototype",
  "coded MVP",
  "physical prototype",
  "pilot with one customer",
] as const;
export const REVENUE_TYPES = [
  { value: "one_time", label: "One-time sale" },
  { value: "subscription", label: "Subscription" },
  { value: "usage", label: "Pay per use" },
  { value: "commission", label: "Commission" },
  { value: "freemium", label: "Freemium" },
  { value: "ads", label: "Ads" },
  { value: "rental", label: "Rental" },
  { value: "licence", label: "Licence" },
] as const;
type RevenueType = (typeof REVENUE_TYPES)[number]["value"];
export const BILLING = ["per use", "weekly", "monthly", "yearly", "one-off"] as const;
export const IMPACT = [
  { value: "0.25", label: "Tiny" },
  { value: "0.5", label: "Low" },
  { value: "1", label: "Medium" },
  { value: "2", label: "High" },
  { value: "3", label: "Massive" },
] as const;
export const CONFIDENCE = [
  { value: "50", label: "50% guess" },
  { value: "80", label: "80% some proof" },
  { value: "100", label: "100% proven" },
] as const;

const feature = z.object({
  id: z.string(),
  name: str(80),
  needId: z.string().default(""),
  reach: num,
  impact: z.enum(["0.25", "0.5", "1", "2", "3"]).default("1"),
  confidence: z.enum(["50", "80", "100"]).default("50"),
  effort: num,
  inScope: z.boolean().default(false),
});

export const buildStateSchema = z.object({
  needs: z
    .array(z.object({ id: z.string(), statement: str(160) }))
    .max(12)
    .default([]),
  forWho: str(140),
  jobs: z.array(z.string().max(60)).max(8).default([]),
  pains: z.array(z.string().max(60)).max(8).default([]),
  gains: z.array(z.string().max(60)).max(8).default([]),
  category: str(80),
  benefit: str(160),
  unlike: str(80),
  features: z.array(feature).max(20).default([]),
  teamSize: z.number().min(0.5).max(100).nullable().default(null),
  archetype: z.enum(ARCHETYPES).or(z.literal("")).default(""),
  mvpType: z.enum(MVP_TYPES).or(z.literal("")).default(""),
  revenueType: z
    .enum(REVENUE_TYPES.map((r) => r.value) as [RevenueType, ...RevenueType[]])
    .or(z.literal(""))
    .default(""),
  billing: z.enum(BILLING).or(z.literal("")).default(""),
});
export type BuildState = z.infer<typeof buildStateSchema>;
export type Feature = BuildState["features"][number];

// ─── Calculators ─────────────────────────────────────────────────────────────

/** RICE = reach × impact × confidence ÷ effort (person-weeks). */
export function rice(f: Feature): number | null {
  if (!known(f.reach) || !known(f.effort) || f.effort <= 0) return null;
  return (
    Math.round(((f.reach * Number(f.impact) * Number(f.confidence)) / 100 / f.effort) * 10) / 10
  );
}

export function rankedFeatures(s: BuildState) {
  return [...s.features]
    .map((f) => ({ f, score: rice(f) }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

export function mvp(s: BuildState) {
  const inScope = s.features.filter((f) => f.inScope && f.name.trim());
  const effort = inScope.reduce((a, f) => a + (f.effort ?? 0), 0);
  const weeks = known(s.teamSize) && s.teamSize > 0 ? Math.ceil(effort / s.teamSize) : null;
  const needs = s.needs.filter((n) => n.statement.trim());
  const covered = needs.filter((n) => inScope.some((f) => f.needId === n.id));
  return {
    inScope,
    effort,
    weeks,
    needs,
    covered,
    gaps: needs.filter((n) => !covered.includes(n)),
  };
}

export function valueStatement(s: BuildState): string {
  if (!s.forWho.trim() || !s.benefit.trim()) return "";
  const need = s.pains[0] ? ` who struggle with ${s.pains[0].toLowerCase()}` : "";
  const cat = s.category.trim()
    ? `${/^[aeiou]/i.test(s.category) ? "an" : "a"} ${s.category.trim()}`
    : "a product";
  const unlike = s.unlike.trim() ? ` Unlike ${s.unlike.trim()}, it's built for them.` : "";
  return `For ${s.forWho.trim()}${need}, we offer ${cat} that ${s.benefit.trim().replace(/\.$/, "")}.${unlike}`;
}

// ─── Workspace ───────────────────────────────────────────────────────────────

export const buildWorkspace: PillarWorkspaceDef<BuildState> = {
  pillar: "build",
  schema: buildStateSchema,
  aiHelpers: [
    "Suggest features for uncovered needs",
    "Generate an MVP mockup",
    "Test the MVP with personas",
    "Estimate effort",
  ],

  shared: {
    read: (s) => ({
      ...(s.forWho.trim() ? { segment: s.forWho.trim() } : {}),
      ...(s.category.trim() ? { category: s.category.trim() } : {}),
      ...(s.benefit.trim() ? { benefit: s.benefit.trim() } : {}),
      ...(s.unlike.trim() ? { alternative: s.unlike.trim() } : {}),
    }),
    write: (s, next, prev) => {
      const statements = followList(
        s.needs.map((n) => n.statement),
        next.needs,
        prev.needs,
      ).slice(0, 12);
      const byText = new Map(s.needs.map((n) => [n.statement.trim().toLowerCase(), n] as const));
      return {
        ...s,
        forWho: follow(s.forWho, next.segment?.slice(0, 140), prev.segment?.slice(0, 140)),
        category: follow(s.category, next.category?.slice(0, 80), prev.category?.slice(0, 80)),
        benefit: follow(s.benefit, next.benefit?.slice(0, 160), prev.benefit?.slice(0, 160)),
        unlike: follow(s.unlike, next.alternative?.slice(0, 80), prev.alternative?.slice(0, 80)),
        needs: statements.map(
          (statement, i) =>
            byText.get(statement.trim().toLowerCase()) ?? {
              id: `need-${i + 1}-${statement.length}`,
              statement: statement.slice(0, 160),
            },
        ),
      };
    },
  },

  initial(ctx) {
    const s = buildStateSchema.parse({});
    s.needs = (ctx.upstream.Need ?? [])
      .slice(0, 12)
      .map((n, i) => ({ id: `n${i + 1}`, statement: String(n.statement ?? "").slice(0, 160) }));
    const seg = ctx.upstream.Segment?.[0];
    const p = ctx.upstream.Problem?.at(-1);
    s.forWho = String(seg?.name ?? p?.who ?? "").slice(0, 140);
    if (typeof p?.pain === "string") s.pains = [p.pain.slice(0, 60)];
    const comp =
      ctx.upstream.Competitor?.find((c) => c.kind === "direct") ?? ctx.upstream.Competitor?.[0];
    if (comp?.name) s.unlike = String(comp.name).slice(0, 80);
    if (s.needs.length === 0 && typeof p?.pain === "string")
      s.needs = [{ id: "n1", statement: p.pain.slice(0, 160) }];
    return s;
  },

  goals(s) {
    const m = mvp(s);
    const top = rankedFeatures(s)[0];
    const vs = valueStatement(s);
    const goals: Goal[] = [
      {
        id: "value",
        title: "Value proposition",
        value: vs ? "Written" : null,
        detail: vs ? vs.slice(0, 90) : "Who, their pain and your benefit",
        done: Boolean(vs),
      },
      {
        id: "mvp",
        title: "MVP features",
        value: s.features.length ? `${m.inScope.length} of ${s.features.length}` : null,
        detail: "Above the MVP line",
        done: m.inScope.length > 0,
      },
      {
        id: "effort",
        title: "MVP effort",
        value: m.inScope.length ? `${m.effort} person-weeks` : null,
        detail: "Effort of the features in the MVP",
        evidence: "ASSUMED",
        done: m.inScope.length > 0 && m.effort > 0,
      },
      {
        id: "weeks",
        title: "Time to build",
        value: m.weeks === null ? null : `${m.weeks} weeks`,
        detail: "Effort ÷ team size",
        evidence: "ESTIMATE",
        done: m.weeks !== null,
      },
      {
        id: "coverage",
        title: "Needs covered",
        value: m.needs.length ? `${m.covered.length} of ${m.needs.length}` : null,
        detail: m.gaps[0] ? `Gap: ${m.gaps[0].statement.slice(0, 60)}` : "Every need has a feature",
        done: m.needs.length > 0 && m.gaps.length === 0,
      },
      {
        id: "top",
        title: "Top feature (RICE)",
        value: top && top.score !== null ? `${top.f.name || "Untitled"} · ${top.score}` : null,
        detail: "Reach × impact × confidence ÷ effort",
        evidence: "ESTIMATE",
        done: Boolean(top && top.score !== null),
      },
      {
        id: "model",
        title: "Business model",
        value:
          s.archetype || s.revenueType
            ? [
                s.archetype && ARCHETYPE_LABEL[s.archetype],
                REVENUE_TYPES.find((r) => r.value === s.revenueType)?.label,
              ]
                .filter(Boolean)
                .join(" · ")
            : null,
        detail: s.billing ? `Billed ${s.billing}` : "Archetype and how it earns",
        done: Boolean(s.archetype && s.revenueType),
      },
    ];
    return goals;
  },

  report(s) {
    const m = mvp(s);
    const vs = valueStatement(s);
    const lines: { label: string; value: string; evidence?: "ASSUMED" | "ESTIMATE" }[] = [];
    if (m.inScope.length)
      lines.push({
        label: "MVP scope",
        value: m.inScope.map((f) => f.name).join(", "),
        evidence: "ASSUMED",
      });
    if (m.inScope.length)
      lines.push({
        label: "Effort",
        value: `${m.effort} person-weeks${m.weeks !== null ? `, about ${m.weeks} weeks` : ""}`,
        evidence: "ESTIMATE",
      });
    if (s.mvpType) lines.push({ label: "First version", value: s.mvpType });
    if (s.archetype) lines.push({ label: "Business type", value: ARCHETYPE_LABEL[s.archetype] });
    if (s.revenueType)
      lines.push({
        label: "Revenue model",
        value: `${REVENUE_TYPES.find((r) => r.value === s.revenueType)?.label}${s.billing ? `, ${s.billing}` : ""}`,
      });
    if (m.gaps.length)
      lines.push({ label: "Needs not covered", value: m.gaps.map((g) => g.statement).join("; ") });
    return { headline: vs || null, lines };
  },

  entities(s) {
    const out: WorkspaceEntity[] = [];
    for (const f of s.features.filter((x) => x.name.trim())) {
      const score = rice(f);
      out.push({
        key: `feat:${f.id}`,
        type: "Feature",
        title: `${f.name}${f.inScope ? " (MVP)" : ""}`,
        evidenceLabel: "ASSUMED",
        data: {
          name: f.name,
          needIds: [],
          inScope: f.inScope,
          ...(known(f.effort) ? { effortPersonWeeks: f.effort } : {}),
          rice: {
            ...(known(f.reach) ? { reach: f.reach } : {}),
            impact: Number(f.impact),
            confidence: Number(f.confidence),
            ...(known(f.effort) ? { effort: f.effort } : {}),
          },
          ...(score !== null ? { priority: score } : {}),
        },
      });
    }
    if (s.archetype || s.mvpType)
      out.push({
        key: "offering",
        type: "Offering",
        title: s.archetype ? ARCHETYPE_LABEL[s.archetype] : "First version",
        evidenceLabel: "ASSUMED",
        data: {
          ...(s.archetype ? { archetype: s.archetype } : {}),
          mvpType: s.mvpType,
          featureIds: [],
          testResults: [],
        },
      });
    const vs = valueStatement(s);
    if (vs || s.jobs.length || s.pains.length || s.gains.length)
      out.push({
        key: "vp",
        type: "ValueProposition",
        title: vs.slice(0, 60) || "Value proposition",
        evidenceLabel: "ASSUMED",
        data: { jobs: s.jobs, pains: s.pains, gains: s.gains, statement: vs },
      });
    if (s.revenueType)
      out.push({
        key: "revenue",
        type: "RevenueModel",
        title: REVENUE_TYPES.find((r) => r.value === s.revenueType)!.label,
        evidenceLabel: "ASSUMED",
        data: { type: s.revenueType, billingPeriod: s.billing },
      });
    return out;
  },
};
