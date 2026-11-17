import { z } from "zod";

/**
 * Shared building blocks for entity schemas.
 *
 * Every entity field is optional: pillars must work with partial and unknown
 * data (CLAUDE.md architecture rule 7). Bounds that the Claude structured-output
 * schema subset can't express are checked after parsing, not here.
 */
export const id = z.string();
export const text = z.string();
export const money = z.number();
export const currency = z.string();
export const isoDate = z.string();

export const range = z.object({ low: z.number(), high: z.number() }).partial();
export const lowBaseHigh = z
  .object({ low: z.number(), base: z.number(), high: z.number() })
  .partial();
export const scores = z.record(z.string(), z.number());

/** A line in a sizing or price build-up: label, value, unit and its source. */
export const line = z
  .object({ label: text, value: z.number(), unit: text, sourceId: id, formula: text })
  .partial();
