import { z } from "zod";

/**
 * Set Up's own input and draft schemas (CLAUDE.md architecture rule 6).
 * Empty placeholders until the Define step lists every field from §4.5
 * "User inputs". Entity schemas live in packages/contracts/entities/setup.ts (S3).
 */
export const setupInputSchema = z.object({});
export type SetupInput = z.infer<typeof setupInputSchema>;

/** The draft of the entities Set Up owns, before the founder approves it. */
export const setupOutputSchema = z.object({});
export type SetupOutput = z.infer<typeof setupOutputSchema>;
