import { z } from "zod";

/**
 * Run & Grow's own input and draft schemas (CLAUDE.md architecture rule 6).
 * Empty placeholders until the Define step lists every field from §4.7
 * "User inputs". Entity schemas live in packages/contracts/entities/run-grow.ts (S3).
 */
export const runGrowInputSchema = z.object({});
export type RunGrowInput = z.infer<typeof runGrowInputSchema>;

/** The draft of the entities Run & Grow owns, before the founder approves it. */
export const runGrowOutputSchema = z.object({});
export type RunGrowOutput = z.infer<typeof runGrowOutputSchema>;
