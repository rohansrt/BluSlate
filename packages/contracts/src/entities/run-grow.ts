import { z } from "zod";
import { id, isoDate, text } from "./common";

/** Pillar 7 · Run & Grow (§8.2; full shapes come with the simulation kernel in P7). */
export const ScenarioEntitySchema = z
  .object({
    name: text,
    mode: z.enum(["sandbox", "actuals_sandbox", "what_if"]),
    horizonMonths: z.number(),
    difficulty: z.enum(["optimistic", "realistic", "harsh"]),
  })
  .partial();

export const SimRunSchema = z
  .object({ scenarioId: id, seed: z.number(), kernelVersion: text, startedAt: isoDate })
  .partial();

export const PeriodSchema = z
  .object({
    scenarioId: id,
    index: z.number(),
    isActual: z.boolean(),
    metrics: z.record(z.string(), z.number()),
  })
  .partial();

export const LeverChangeSchema = z
  .object({
    lever: text,
    oldValue: z.unknown(),
    newValue: z.unknown(),
    decidedAt: isoDate,
    effectiveAt: isoDate,
  })
  .partial();

export const MarketEventSchema = z
  .object({
    at: isoDate,
    kind: text,
    cause: z.enum(["founder", "competitor", "enabler", "market", "seasonality"]),
    payload: z.record(z.string(), z.unknown()),
  })
  .partial();

export const KpiSeriesSchema = z
  .object({
    metric: text,
    points: z.array(z.object({ periodIndex: z.number(), value: z.number() }).partial()),
  })
  .partial();
