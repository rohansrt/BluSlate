import { z } from "zod";
import { id, scores, text } from "./common";

/** Pillar 1 · Discover (§8.2). */
export const ProblemSchema = z
  .object({
    who: text,
    pain: text,
    frequency: text,
    workaround: text,
    costOfPain: text,
    whyNow: text,
  })
  .partial();

export const OpportunitySchema = z
  .object({ title: text, scores, weights: scores, total: z.number() })
  .partial();

/** Status (validated · invalidated · unclear) is computed from evidence, never stored. */
export const HypothesisSchema = z
  .object({
    statement: text,
    kind: z.enum(["desirability", "viability", "feasibility"]),
    risk: z.number(),
    uncertainty: z.number(),
    testMethod: text,
    problemId: id,
  })
  .partial();
