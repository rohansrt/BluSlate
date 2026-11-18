import { z } from "zod";
import {
  follow,
  type Goal,
  type PillarWorkspaceDef,
  type ReportBlock,
  type WorkspaceContext,
  type WorkspaceEntity,
} from "@bluslate/contracts";

/**
 * Problem Discovery v1 workspace (SPEC.md, decision 0006). Turns an idea into
 * a solution-free problem, compares framings and ranks the beliefs to test.
 * Everything here is deterministic; AI slots are placeholders.
 */

const str = (n: number) => z.string().max(n).default("");
const rating = z.number().int().min(1).max(5).nullable().default(null);
const weight = (d: number) => z.number().int().min(0).max(5).default(d);

export const FREQUENCY_BANDS = [
  { value: "daily", label: "Every day", phrase: "every day" },
  { value: "most-days", label: "Most days", phrase: "almost every day" },
  { value: "weekly", label: "Weekly", phrase: "every week" },
  { value: "monthly", label: "Monthly", phrase: "every month" },
  { value: "few-times-a-year", label: "A few times a year", phrase: "a few times a year" },
  { value: "once", label: "Once, at a big moment", phrase: "at one big moment" },
] as const;
type Band = (typeof FREQUENCY_BANDS)[number]["value"];
const BAND_VALUES = FREQUENCY_BANDS.map((b) => b.value) as [Band, ...Band[]];

export const ALT_KINDS = ["diy", "product", "service", "do-nothing"] as const;
export const COST_KINDS = ["time", "money", "stress", "risk", "missed chances"] as const;
export const WHY_NOW_KINDS = [
  "new technology",
  "price drop",
  "rule change",
  "behaviour change",
  "an event",
] as const;
export const ADVANTAGES = [
  "access to these people",
  "know-how",
  "technical skill",
  "right location",
  "a network",
] as const;
export const BUDGET_BANDS = ["savings only", "small", "medium", "large", "not sure"] as const;
export const EXPERIENCE = ["I live it", "seen it close up", "not yet"] as const;
export const HYP_KINDS = ["desirability", "viability", "feasibility"] as const;
export const TEST_METHODS = [
  "interviews",
  "survey",
  "observation",
  "desk research",
  "smoke test",
  "pre-order",
] as const;
export const CRITERIA = [
  { key: "severity", label: "Severity", low: "Small annoyance", high: "Serious loss" },
  { key: "frequency", label: "Frequency", low: "Rarely", high: "Daily" },
  { key: "urgency", label: "Urgency", low: "Accepted it", high: "Looking for a fix" },
  {
    key: "workaroundStrength",
    label: "Today's workaround",
    low: "Nothing works",
    high: "Works well",
  },
  { key: "feasibility", label: "Feasible for you", low: "Out of reach", high: "Can start now" },
] as const;
export type CriterionKey = (typeof CRITERIA)[number]["key"];

const alternative = z.object({
  id: z.string(),
  name: str(60),
  kind: z.enum(ALT_KINDS).default("service"),
});
const opportunity = z.object({
  id: z.string(),
  title: str(80),
  severity: rating,
  frequency: rating,
  urgency: rating,
  workaroundStrength: rating,
  feasibility: rating,
});
const hypothesis = z.object({
  id: z.string(),
  statement: str(240),
  kind: z.enum(HYP_KINDS).default("desirability"),
  risk: rating,
  uncertainty: rating,
  testMethod: z.enum(TEST_METHODS).or(z.literal("")).default(""),
  success: str(160),
});

export const DEFAULT_WEIGHTS = {
  severity: 3,
  frequency: 2,
  urgency: 2,
  workaroundStrength: 1,
  feasibility: 2,
};

export const discoverStateSchema = z.object({
  pain: str(280),
  who: str(140),
  frequencyBand: z.enum(BAND_VALUES).or(z.literal("")).default(""),
  severity: rating,
  costKinds: z.array(z.enum(COST_KINDS)).default([]),
  costOfPain: str(200),
  alternatives: z.array(alternative).max(6).default([]),
  whyNowKinds: z.array(z.enum(WHY_NOW_KINDS)).default([]),
  whyNow: str(200),
  whyNowUnknown: z.boolean().default(false),
  parkedSolution: str(200),
  experience: z.enum(EXPERIENCE).or(z.literal("")).default(""),
  advantages: z.array(z.enum(ADVANTAGES)).default([]),
  budgetBand: z.enum(BUDGET_BANDS).or(z.literal("")).default(""),
  opportunities: z.array(opportunity).max(5).default([]),
  focusId: z.string().default(""),
  weights: z
    .object({
      severity: weight(3),
      frequency: weight(2),
      urgency: weight(2),
      workaroundStrength: weight(1),
      feasibility: weight(2),
    })
    .default(DEFAULT_WEIGHTS),
  hypotheses: z.array(hypothesis).max(12).default([]),
});
export type DiscoverState = z.infer<typeof discoverStateSchema>;
export type Opportunity = DiscoverState["opportunities"][number];
export type Hypothesis = DiscoverState["hypotheses"][number];

// ─── Calculators (pure, SPEC.md §9) ──────────────────────────────────────────

const GENERIC_SOLUTION = [
  "app",
  "application",
  "platform",
  "website",
  "portal",
  "marketplace",
  "software",
  "saas",
  "ai",
  "chatbot",
  "device",
  "gadget",
  "subscription",
  "startup",
  "solution",
];
const VAGUE_WHO = [
  "everyone",
  "anyone",
  "people",
  "users",
  "customers",
  "consumers",
  "public",
  "society",
  "all",
];

const words = (t: string) => t.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) ?? [];

/** Solution words found in text: generic ones, plus the founder's own parked solution words. */
export function solutionSignals(text: string, parkedSolution = "", who = ""): string[] {
  const w = new Set(words(text));
  const whoWords = new Set(words(who));
  const parked = words(parkedSolution).filter((x) => x.length >= 4 && !whoWords.has(x));
  const hits = [...GENERIC_SOLUTION, ...parked].filter((x) => w.has(x));
  if (/\bwe will\b|\bour\b|\ba way to\b/i.test(text)) hits.push("we/our");
  return [...new Set(hits)];
}

export interface Check {
  id: string;
  title: string;
  pass: boolean;
  message: string;
}

export function problemChecks(s: DiscoverState): Check[] {
  const sig = solutionSignals(s.pain, s.parkedSolution, s.who);
  const whoWords = words(s.who);
  const vague = whoWords.length > 0 && whoWords.every((x) => VAGUE_WHO.includes(x) || x.length < 3);
  return [
    {
      id: "C1",
      title: "No solution in it",
      pass: s.pain.trim().length > 0 && sig.length === 0,
      message: s.pain.trim()
        ? `This mentions a solution (${sig.map((x) => `"${x}"`).join(", ")}). Describe what goes wrong, not what you'll build.`
        : "Describe the problem in one sentence.",
    },
    {
      id: "C2",
      title: "Specific people",
      pass: whoWords.length >= 3 && !vague,
      message: "Who exactly? Add where they are or what they have in common.",
    },
    {
      id: "C3",
      title: "How often",
      pass: s.frequencyBand !== "",
      message: "How often does it happen?",
    },
    {
      id: "C4",
      title: "Alternative named",
      pass: s.alternatives.some((a) => a.name.trim()),
      message: "Everyone does something today, even nothing. Add at least one.",
    },
    {
      id: "C5",
      title: "Cost stated",
      pass: s.costOfPain.trim().length > 0 || s.severity !== null,
      message: "What does living with it cost them?",
    },
    {
      id: "C6",
      title: "Why now",
      pass: s.whyNow.trim().length > 0 || s.whyNowKinds.length > 0 || s.whyNowUnknown,
      message: 'Why now? Or mark it "I don\'t know yet".',
    },
  ];
}

function joinOr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} or ${items.at(-1)}`;
}

export function composeStatement(s: DiscoverState): string {
  if (!s.pain.trim()) return "";
  const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
  const who = s.who.trim() || "People";
  const band = FREQUENCY_BANDS.find((b) => b.value === s.frequencyBand);
  let out = `${who} ${lower(s.pain.trim().replace(/\.$/, ""))}${band ? ` ${band.phrase}` : ""}.`;
  const alts = s.alternatives
    .filter((a) => a.name.trim())
    .slice(0, 3)
    .map((a) => (a.kind === "do-nothing" ? "putting up with it" : lower(a.name.trim())));
  if (alts.length) {
    out += ` Today they get by with ${joinOr(alts)}`;
    out += s.costOfPain.trim()
      ? `, which costs them ${lower(s.costOfPain.trim().replace(/\.$/, ""))}.`
      : ".";
  }
  return out;
}

/** Weighted score 1–5 (SPEC §9.3). Workaround strength is inverted into a gap. Null until fully rated. */
export function opportunityScore(o: Opportunity, w: DiscoverState["weights"]): number | null {
  const vals = CRITERIA.map((c) => o[c.key]);
  if (vals.some((v) => v === null)) return null;
  const sumW = CRITERIA.reduce((a, c) => a + w[c.key], 0);
  if (sumW <= 0) return null;
  const total = CRITERIA.reduce((a, c) => {
    const v = o[c.key] as number;
    return a + w[c.key] * (c.key === "workaroundStrength" ? 6 - v : v);
  }, 0);
  return total / sumW;
}

export function rankOpportunities(s: DiscoverState) {
  return s.opportunities
    .map((o, i) => ({ o, i, score: opportunityScore(o, s.weights) }))
    .sort(
      (a, b) =>
        (b.score ?? -1) - (a.score ?? -1) || (b.o.severity ?? 0) - (a.o.severity ?? 0) || a.i - b.i,
    );
}

/** Does the top option stay on top when any one weight moves by 1? (SPEC §9.4) */
export function robustness(s: DiscoverState): "clear" | { closeOn: string } | null {
  const ranked = rankOpportunities(s).filter((r) => r.score !== null);
  if (ranked.length < 2) return null;
  const top = ranked[0]!.o.id;
  for (const c of CRITERIA) {
    for (const d of [-1, 1]) {
      const w = { ...s.weights, [c.key]: Math.max(0, Math.min(5, s.weights[c.key] + d)) };
      if (CRITERIA.reduce((a, k) => a + w[k.key], 0) === 0) continue;
      const again = rankOpportunities({ ...s, weights: w }).filter((r) => r.score !== null);
      if (again[0]!.o.id !== top) return { closeOn: c.label.toLowerCase() };
    }
  }
  return "clear";
}

export function priority(h: Hypothesis): number | null {
  return h.risk !== null && h.uncertainty !== null ? h.risk * h.uncertainty : null;
}

export type QuadrantName = "Test first" | "Confirm" | "Explore later" | "Safe for now";
export function quadrant(h: Hypothesis): QuadrantName | null {
  if (h.risk === null || h.uncertainty === null) return null;
  const r = h.risk >= 4;
  const u = h.uncertainty >= 4;
  return r && u ? "Test first" : r ? "Confirm" : u ? "Explore later" : "Safe for now";
}

export function isTestable(h: Hypothesis): boolean {
  const enough = words(h.statement).length >= 6;
  const measurable = /\d|more than|less than|at least|at most|\bmost\b|half|majority/i.test(
    h.success,
  );
  const clean = h.kind !== "desirability" || solutionSignals(h.statement).length === 0;
  return enough && h.testMethod !== "" && measurable && clean;
}

export function rankHypotheses(s: DiscoverState) {
  return s.hypotheses
    .map((h, i) => ({ h, i, p: priority(h) }))
    .sort((a, b) => (b.p ?? -1) - (a.p ?? -1) || (b.h.risk ?? 0) - (a.h.risk ?? 0) || a.i - b.i);
}

/** Template beliefs built from the canvas (SPEC §9.9). No AI. */
export function hypothesisStarters(
  s: DiscoverState,
): { statement: string; kind: Hypothesis["kind"]; testMethod: Hypothesis["testMethod"] }[] {
  const who = s.who.trim() || "These people";
  const band = FREQUENCY_BANDS.find((b) => b.value === s.frequencyBand)?.phrase ?? "often";
  const alt = s.alternatives.find((a) => a.name.trim() && a.kind !== "do-nothing")?.name.trim();
  const out: {
    statement: string;
    kind: Hypothesis["kind"];
    testMethod: Hypothesis["testMethod"];
  }[] = [
    {
      statement: `${who} face this problem ${band}.`,
      kind: "desirability",
      testMethod: "interviews",
    },
    ...(alt
      ? [
          {
            statement: `${who} find ${alt.toLowerCase()} not good enough and would switch for something clearly better.`,
            kind: "desirability" as const,
            testMethod: "interviews" as const,
          },
        ]
      : []),
    {
      statement: `${who} (or someone on their behalf) already spend money on this problem.`,
      kind: "viability",
      testMethod: "interviews",
    },
    {
      statement: `We can reach ${who.charAt(0).toLowerCase() + who.slice(1)} through people or places we already have access to.`,
      kind: "feasibility",
      testMethod: "observation",
    },
    ...(s.whyNow.trim()
      ? [
          {
            statement: `${s.whyNow.trim().replace(/\.$/, "")} makes this newly possible.`,
            kind: "feasibility" as const,
            testMethod: "desk research" as const,
          },
        ]
      : []),
  ];
  const have = new Set(s.hypotheses.map((h) => h.statement.trim()));
  return out.filter((o) => !have.has(o.statement));
}

const ROUTE: Record<string, { pillar: string; days: string }> = {
  interviews: { pillar: "Customer Discovery", days: "about 5 simulated days (10 interviews)" },
  survey: { pillar: "Customer Discovery", days: "3–7 simulated days" },
  observation: { pillar: "Customer Discovery", days: "about 1 simulated day" },
  "desk research": { pillar: "Market Research", days: "3–7 simulated days" },
  "smoke test": { pillar: "Product Design", days: "set up in Product Design" },
  "pre-order": { pillar: "Product Design", days: "set up in Product Design" },
};

/** Next-week research actions: every belief except "Safe for now", grouped by method (SPEC §9.8). */
export function researchPlan(s: DiscoverState) {
  const groups = new Map<string, string[]>();
  rankHypotheses(s).forEach(({ h }) => {
    const q = quadrant(h);
    if (!q || q === "Safe for now" || !h.testMethod) return;
    const ids = groups.get(h.testMethod) ?? [];
    ids.push(`H${s.hypotheses.indexOf(h) + 1}`);
    groups.set(h.testMethod, ids);
  });
  return [...groups.entries()].slice(0, 4).map(([method, ids]) => ({
    method,
    tests: ids,
    pillar: ROUTE[method]!.pillar,
    time: ROUTE[method]!.days,
  }));
}

export function timeCostDays(s: DiscoverState): number {
  const d = 2 + (s.opportunities.length >= 3 ? 1 : 0) + (s.hypotheses.length >= 5 ? 1 : 0);
  return Math.max(2, Math.min(5, d));
}

export function readiness(s: DiscoverState) {
  const c = problemChecks(s);
  const rated = s.opportunities.filter((o) => opportunityScore(o, s.weights) !== null).length;
  return [
    { id: "R1", title: "Problem stated without a solution", done: c[0]!.pass },
    { id: "R2", title: "The people are specific", done: c[1]!.pass },
    { id: "R3", title: "At least one alternative named", done: c[3]!.pass },
    { id: "R4", title: "At least 2 framings compared", done: rated >= 2 },
    {
      id: "R5",
      title: "At least 3 testable beliefs",
      done: s.hypotheses.filter(isTestable).length >= 3,
    },
    { id: "R6", title: "Unknowns marked", done: c.every((x) => x.pass) },
  ];
}

// ─── Workspace definition ────────────────────────────────────────────────────

function focusOf(s: DiscoverState) {
  return s.opportunities.find((o) => o.id === s.focusId) ?? rankOpportunities(s)[0]?.o ?? null;
}

const SOLUTIONISH =
  /\b(apps?|platforms?|websites?|marketplaces?|rentals?|services?|subscriptions?|delivery|tools?|software|devices?)\b/i;

export const discoverWorkspace: PillarWorkspaceDef<DiscoverState> = {
  pillar: "discover",
  schema: discoverStateSchema,
  aiHelpers: [
    "Suggest a reframe",
    "Explore problem spaces",
    "Suggest beliefs to test",
    "Challenge my problem",
  ],

  shared: {
    read: (s) => ({
      ...(s.pain.trim() ? { problem: s.pain.trim() } : {}),
      ...(s.who.trim() ? { segment: s.who.trim() } : {}),
      alternatives: s.alternatives.map((a) => a.name.trim()).filter(Boolean),
    }),
    write: (s, next, prev) => ({
      ...s,
      pain: follow(s.pain, next.problem?.slice(0, 280), prev.problem?.slice(0, 280)),
      who: follow(s.who, next.segment?.slice(0, 140), prev.segment?.slice(0, 140)),
    }),
  },

  initial(ctx: WorkspaceContext) {
    const s = discoverStateSchema.parse({});
    const idea = ctx.startup.idea?.trim() ?? "";
    // A solution-sounding idea is parked, so the problem statement starts clean.
    if (idea && SOLUTIONISH.test(idea)) s.parkedSolution = idea.slice(0, 200);
    else if (idea) s.pain = idea.slice(0, 280);
    return s;
  },

  goals(s) {
    const checks = problemChecks(s);
    const passed = checks.filter((c) => c.pass).length;
    const focus = focusOf(s);
    const focusScore = focus ? opportunityScore(focus, s.weights) : null;
    const testable = s.hypotheses.filter(isTestable).length;
    const top = rankHypotheses(s).find((r) => r.p !== null);
    const ready = readiness(s).filter((r) => r.done).length;
    const robust = robustness(s);
    const goals: Goal[] = [
      {
        id: "strength",
        title: "Problem strength",
        value: s.pain.trim() ? `${passed} of 6 checks` : null,
        detail: passed < 6 ? checks.find((c) => !c.pass)?.title : "Clear, specific, solution-free",
        done: passed === 6,
      },
      {
        id: "focus",
        title: "Best framing",
        value:
          focus && focusScore !== null
            ? `${focus.title || "Untitled"} · ${focusScore.toFixed(1)}`
            : null,
        detail:
          robust === "clear"
            ? "Clear winner"
            : robust
              ? `Close call: depends on ${robust.closeOn}`
              : "Rate at least one framing",
        evidence: "ESTIMATE",
        done: focusScore !== null,
      },
      {
        id: "testable",
        title: "Testable beliefs",
        value: s.hypotheses.length ? `${testable} of 3 needed` : null,
        detail: "A test method and a success line with a number",
        done: testable >= 3,
      },
      {
        id: "riskiest",
        title: "Riskiest belief",
        value: top ? `H${s.hypotheses.indexOf(top.h) + 1} · priority ${top.p}` : null,
        detail: top ? top.h.statement.slice(0, 90) : "Risk × uncertainty, 1–25",
        evidence: "ESTIMATE",
        done: Boolean(top),
      },
      {
        id: "time",
        title: "Discovery sprint",
        value: s.pain.trim() ? `${timeCostDays(s)} simulated days` : null,
        detail: s.frequencyBand ? "Appendix C: 2–5 days" : "Say how often the problem happens",
        evidence: "ESTIMATE",
        done: Boolean(s.pain.trim() && s.frequencyBand),
      },
      {
        id: "ready",
        title: "Readiness",
        value: `${ready} of 6`,
        detail: readiness(s).find((r) => !r.done)?.title ?? "Ready to publish",
        done: ready === 6,
      },
    ];
    return goals;
  },

  report(s): ReportBlock {
    const statement = composeStatement(s);
    const focus = focusOf(s);
    const score = focus ? opportunityScore(focus, s.weights) : null;
    const top3 = rankHypotheses(s)
      .filter((r) => r.p !== null)
      .slice(0, 3);
    const plan = researchPlan(s);
    const lines: ReportBlock["lines"] = [];
    if (focus && score !== null)
      lines.push({
        label: "Best framing",
        value: `${focus.title} (${score.toFixed(1)} of 5)`,
        evidence: "ESTIMATE",
      });
    if (s.alternatives.length)
      lines.push({
        label: "Today's alternatives",
        value: s.alternatives
          .map((a) => a.name)
          .filter(Boolean)
          .join(", "),
        evidence: "ASSUMED",
      });
    top3.forEach((r, i) =>
      lines.push({
        label: `What could kill it #${i + 1}`,
        value: `${r.h.statement} (priority ${r.p})`,
        evidence: "ASSUMED",
      }),
    );
    plan.forEach((p, i) =>
      lines.push({
        label: `Next week #${i + 1}`,
        value: `${p.method} → ${p.pillar} · tests ${p.tests.join(", ")} · ${p.time}`,
      }),
    );
    if (s.parkedSolution)
      lines.push({ label: "Parked solution", value: s.parkedSolution, evidence: "ASSUMED" });
    return { headline: statement || null, lines };
  },

  entities(s) {
    const out: WorkspaceEntity[] = [];
    if (s.pain.trim()) {
      out.push({
        key: "problem",
        type: "Problem",
        title: s.pain.slice(0, 60),
        evidenceLabel: "ASSUMED",
        data: {
          who: s.who,
          pain: s.pain,
          frequency: FREQUENCY_BANDS.find((b) => b.value === s.frequencyBand)?.label ?? "",
          frequencyBand: s.frequencyBand,
          workaround: s.alternatives
            .map((a) => a.name)
            .filter(Boolean)
            .join(", "),
          alternatives: s.alternatives
            .filter((a) => a.name)
            .map((a) => ({ name: a.name, kind: a.kind })),
          costOfPain: [s.costKinds.join(", "), s.costOfPain].filter(Boolean).join(": "),
          ...(s.severity !== null ? { severity: s.severity } : {}),
          whyNow: [s.whyNowKinds.join(", "), s.whyNow].filter(Boolean).join(": "),
          statement: composeStatement(s),
          parkedSolution: s.parkedSolution,
          unknowns: s.whyNowUnknown ? ["whyNow"] : [],
        },
      });
    }
    for (const o of s.opportunities) {
      const total = opportunityScore(o, s.weights);
      if (!o.title.trim() || total === null) continue;
      out.push({
        key: `opp:${o.id}`,
        type: "Opportunity",
        title: `${o.title}${o.id === focusOf(s)?.id ? " ★" : ""}`,
        evidenceLabel: "ASSUMED",
        data: {
          title: o.title,
          scores: Object.fromEntries(CRITERIA.map((c) => [c.key, o[c.key] as number])),
          weights: s.weights,
          total: Math.round(total * 100) / 100,
        },
      });
    }
    for (const h of s.hypotheses) {
      if (!h.statement.trim() || h.risk === null || h.uncertainty === null) continue;
      out.push({
        key: `hyp:${h.id}`,
        type: "Hypothesis",
        title: h.statement.slice(0, 60),
        evidenceLabel: "ASSUMED",
        data: {
          statement: h.statement,
          kind: h.kind,
          risk: h.risk,
          uncertainty: h.uncertainty,
          testMethod: h.testMethod,
          successCriterion: h.success,
        },
      });
    }
    return out;
  },
};
