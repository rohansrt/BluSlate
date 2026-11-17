import { z } from "zod";
import { currency, id, range, scores, text } from "./common";

/** Pillar 2 · Customers (§8.2). */
export const SegmentSchema = z
  .object({
    name: text,
    roles: z.array(z.enum(["user", "payer", "buyer", "influencer", "decider"])),
    kind: z.enum(["b2c", "b2b"]),
    description: text,
    channels: z.array(text),
    willingnessToPayRange: range.extend({ currency }).partial(),
  })
  .partial();

/** Only the visible profile is a Twin entity. The hidden profile stays server-side (G6). */
export const PersonaSchema = z
  .object({ personaId: id, segmentId: id, name: text, context: text, job: text })
  .partial();

export const InterviewSchema = z
  .object({
    threadId: id,
    participant: z
      .object({ kind: z.enum(["persona", "real"]), personaId: id, label: text })
      .partial(),
    synthetic: z.boolean(),
    coachScores: scores,
    // v1 additions (decision 0006).
    date: text,
    segmentName: text,
    painLevel: z.number(),
  })
  .partial();

export const InsightSchema = z
  .object({
    quote: text,
    tag: z.enum(["pain", "need", "gain", "workaround", "objection", "willingness_to_pay"]),
    interviewId: id,
    transcriptOffset: z.number(),
    clusterId: id,
  })
  .partial();

export const NeedSchema = z
  .object({
    statement: text,
    frequency: z.number(),
    severity: z.number(),
    evidence: z.object({ real: z.number(), synthetic: z.number() }).partial(),
    score: z.number(),
  })
  .partial();
