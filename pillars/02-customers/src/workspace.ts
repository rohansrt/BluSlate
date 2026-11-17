import { z } from "zod";
import {
  formatMoney,
  known,
  type Goal,
  type PillarWorkspaceDef,
  type WorkspaceEntity,
} from "@bluslate/contracts";

/**
 * Customer Discovery v1 (decision 0006): who has the problem, and what's the
 * evidence? Real interviews are logged here; AI personas are a placeholder.
 * Works alone: the problem can be typed here when Problem Discovery is empty.
 */

const str = (n: number) => z.string().max(n).default("");
const rating = z.number().int().min(1).max(5).nullable().default(null);
const num = z.number().min(0).nullable().default(null);

export const ROLES = ["user", "payer", "buyer", "influencer", "decider"] as const;
export const CHANNELS = [
  "in person",
  "WhatsApp groups",
  "Instagram",
  "LinkedIn",
  "college / workplace",
  "communities",
  "referrals",
  "cold email",
] as const;
export const TAGS = [
  "pain",
  "need",
  "gain",
  "workaround",
  "objection",
  "willingness_to_pay",
] as const;
export const TAG_LABEL: Record<(typeof TAGS)[number], string> = {
  pain: "Pain",
  need: "Need",
  gain: "Gain",
  workaround: "Workaround",
  objection: "Objection",
  willingness_to_pay: "Would pay",
};

const segment = z.object({
  id: z.string(),
  name: str(80),
  kind: z.enum(["b2c", "b2b"]).default("b2c"),
  roles: z.array(z.enum(ROLES)).default([]),
  channels: z.array(z.enum(CHANNELS)).default([]),
  wtpLow: num,
  wtpHigh: num,
});
const interview = z.object({
  id: z.string(),
  segmentId: z.string().default(""),
  label: str(60),
  date: str(10),
  painLevel: rating,
  quote: str(240),
  tags: z.array(z.enum(TAGS)).default([]),
});
const need = z.object({
  id: z.string(),
  statement: str(160),
  frequency: rating,
  severity: rating,
  sources: num,
});
const belief = z.object({ id: z.string(), statement: str(240), support: num, against: num });

export const customersStateSchema = z.object({
  problem: str(600),
  segments: z.array(segment).max(5).default([]),
  outreachChannels: z.array(z.enum(CHANNELS)).default([]),
  contacts: num,
  replyRatePct: z.number().min(0).max(100).nullable().default(null),
  interviews: z.array(interview).max(60).default([]),
  needs: z.array(need).max(12).default([]),
  beliefs: z.array(belief).max(12).default([]),
});
export type CustomersState = z.infer<typeof customersStateSchema>;
export type Need = CustomersState["needs"][number];
export type Belief = CustomersState["beliefs"][number];

// ─── Calculators ─────────────────────────────────────────────────────────────

/** Need score (§4.2): frequency × severity × evidence weight; weight = real sources / 3, capped at 1. */
export function needScore(n: Need): number | null {
  if (n.frequency === null || n.severity === null) return null;
  const w = Math.min(1, (n.sources ?? 0) / 3);
  return Math.round(n.frequency * n.severity * w * 10) / 10;
}

export type BeliefStatus = "supported" | "against" | "unclear";
/** Computed, never typed (§3): 3+ and twice the other side. */
export function beliefStatus(b: Belief): BeliefStatus {
  const s = b.support ?? 0;
  const a = b.against ?? 0;
  if (s >= 3 && s >= 2 * a) return "supported";
  if (a >= 3 && a >= 2 * s) return "against";
  return "unclear";
}

export function expectedReplies(s: CustomersState): number | null {
  return known(s.contacts) && known(s.replyRatePct)
    ? Math.round((s.contacts * s.replyRatePct) / 100)
    : null;
}

export function rankedNeeds(s: CustomersState) {
  return s.needs
    .map((n) => ({ n, score: needScore(n) }))
    .filter((x) => x.n.statement.trim())
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

const segName = (s: CustomersState, id: string) => s.segments.find((x) => x.id === id)?.name ?? "";

// ─── Workspace ───────────────────────────────────────────────────────────────

export const customersWorkspace: PillarWorkspaceDef<CustomersState> = {
  pillar: "customers",
  schema: customersStateSchema,
  aiHelpers: [
    "Interview AI personas",
    "Simulate a survey",
    "Tag and cluster quotes",
    "Coach my questions",
  ],

  initial(ctx) {
    const s = customersStateSchema.parse({});
    const p = ctx.upstream.Problem?.at(-1);
    if (p) {
      s.problem = String(p.statement || p.pain || "").slice(0, 600);
      if (typeof p.who === "string" && p.who)
        s.segments = [
          {
            id: "seg1",
            name: p.who.slice(0, 80),
            kind: "b2c",
            roles: ["user"],
            channels: [],
            wtpLow: null,
            wtpHigh: null,
          },
        ];
    } else if (ctx.startup.idea) s.problem = ctx.startup.idea;
    s.beliefs = (ctx.upstream.Hypothesis ?? [])
      .filter((h) => typeof h.statement === "string")
      .slice(0, 12)
      .map((h, i) => ({
        id: `h${i + 1}`,
        statement: String(h.statement).slice(0, 240),
        support: null,
        against: null,
      }));
    return s;
  },

  goals(s, ctx) {
    const real = s.interviews.length;
    const segsHit = new Set(s.interviews.map((i) => i.segmentId).filter(Boolean)).size;
    const top = rankedNeeds(s)[0];
    const backed = s.needs.filter((n) => (n.sources ?? 0) >= 3).length;
    const st = s.beliefs.map(beliefStatus);
    const replies = expectedReplies(s);
    const wtp = s.segments.find((x) => known(x.wtpLow) || known(x.wtpHigh));
    const cur = ctx.startup.currency;
    const goals: Goal[] = [
      {
        id: "interviews",
        title: "Real interviews",
        value: `${real} of 8`,
        detail: `≈ ${real * 0.5} simulated days so far`,
        evidence: real ? "FIELD" : undefined,
        done: real >= 8,
      },
      {
        id: "segments",
        title: "Segments interviewed",
        value: s.segments.length ? `${segsHit} of 2` : null,
        detail: `${s.segments.length} segment${s.segments.length === 1 ? "" : "s"} defined`,
        done: segsHit >= 2,
      },
      {
        id: "topNeed",
        title: "Top need",
        value: top && top.score !== null ? `${top.n.statement.slice(0, 40)} · ${top.score}` : null,
        detail: "frequency × severity × evidence (0–25)",
        evidence: "ESTIMATE",
      },
      {
        id: "backed",
        title: "Needs with 3+ sources",
        value: s.needs.length ? `${backed} of 3` : null,
        done: backed >= 3,
      },
      {
        id: "beliefs",
        title: "Beliefs tested",
        value: s.beliefs.length
          ? `${st.filter((x) => x === "supported").length} ✓ · ${st.filter((x) => x === "against").length} ✗ · ${st.filter((x) => x === "unclear").length} ?`
          : null,
        detail: "supported · against · unclear",
      },
      {
        id: "replies",
        title: "Expected replies",
        value: replies === null ? null : `${replies} people`,
        detail: "contacts × reply rate; outreach takes 3–10 simulated days",
        evidence: "ASSUMED",
      },
      {
        id: "wtp",
        title: "Willingness to pay",
        value: wtp
          ? `${known(wtp.wtpLow) ? formatMoney(wtp.wtpLow, cur) : "?"}–${known(wtp.wtpHigh) ? formatMoney(wtp.wtpHigh, cur) : "?"}`
          : null,
        detail: wtp ? wtp.name : "Per segment, per month",
        evidence: "ASSUMED",
      },
    ];
    return goals;
  },

  report(s) {
    const needs = rankedNeeds(s).slice(0, 3);
    const lines = [
      {
        label: "Segments",
        value:
          s.segments
            .map((x) => x.name)
            .filter(Boolean)
            .join(" · ") || "—",
        evidence: "ASSUMED" as const,
      },
      { label: "Real interviews", value: String(s.interviews.length), evidence: "FIELD" as const },
      ...needs.map((x, i) => ({
        label: `Need #${i + 1}`,
        value: `${x.n.statement} (score ${x.score ?? "—"}, ${x.n.sources ?? 0} sources)`,
        evidence: "ESTIMATE" as const,
      })),
      ...s.beliefs
        .filter((b) => b.statement)
        .map((b) => ({ label: `Belief: ${beliefStatus(b)}`, value: b.statement })),
    ];
    const quote = s.interviews.find((i) => i.quote.trim());
    if (quote)
      lines.push({
        label: "In their words",
        value: `“${quote.quote}” — ${quote.label || segName(s, quote.segmentId) || "interviewee"}`,
        evidence: "FIELD",
      });
    return {
      headline:
        s.segments.length || s.interviews.length
          ? `${s.interviews.length} real interview${s.interviews.length === 1 ? "" : "s"} across ${s.segments.length} segment${s.segments.length === 1 ? "" : "s"}${needs[0] ? `; the top need is "${needs[0].n.statement}"` : ""}.`
          : null,
      lines,
    };
  },

  entities(s, ctx) {
    const out: WorkspaceEntity[] = [];
    for (const g of s.segments.filter((x) => x.name.trim()))
      out.push({
        key: `seg:${g.id}`,
        type: "Segment",
        title: g.name,
        evidenceLabel: "ASSUMED",
        data: {
          name: g.name,
          kind: g.kind,
          roles: g.roles,
          channels: g.channels,
          willingnessToPayRange: {
            ...(known(g.wtpLow) ? { low: g.wtpLow } : {}),
            ...(known(g.wtpHigh) ? { high: g.wtpHigh } : {}),
            currency: ctx.startup.currency,
          },
        },
      });
    for (const i of s.interviews) {
      out.push({
        key: `int:${i.id}`,
        type: "Interview",
        title: i.label || `Interview ${i.date}`,
        evidenceLabel: "FIELD",
        data: {
          participant: { kind: "real", label: i.label },
          synthetic: false,
          date: i.date,
          segmentName: segName(s, i.segmentId),
          ...(i.painLevel !== null ? { painLevel: i.painLevel } : {}),
        },
      });
      if (i.quote.trim())
        out.push({
          key: `ins:${i.id}`,
          type: "Insight",
          title: i.quote.slice(0, 60),
          evidenceLabel: "FIELD",
          data: { quote: i.quote, ...(i.tags[0] ? { tag: i.tags[0] } : {}) },
        });
    }
    for (const n of s.needs.filter((x) => x.statement.trim())) {
      const score = needScore(n);
      out.push({
        key: `need:${n.id}`,
        type: "Need",
        title: n.statement,
        evidenceLabel: (n.sources ?? 0) > 0 ? "FIELD" : "ASSUMED",
        data: {
          statement: n.statement,
          ...(n.frequency !== null ? { frequency: n.frequency } : {}),
          ...(n.severity !== null ? { severity: n.severity } : {}),
          evidence: { real: n.sources ?? 0, synthetic: 0 },
          ...(score !== null ? { score } : {}),
        },
      });
    }
    return out;
  },
};
