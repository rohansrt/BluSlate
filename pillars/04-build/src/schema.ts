import { z } from "zod";

/**
 * Build's own input and draft schemas (CLAUDE.md architecture rule 6).
 * Empty placeholders until the Define step lists every field from §4.4
 * "User inputs". Entity schemas live in packages/contracts/entities/build.ts (S3).
 */
export const buildInputSchema = z.object({});
export type BuildInput = z.infer<typeof buildInputSchema>;

/** The draft of the entities Build owns, before the founder approves it. */
export const buildOutputSchema = z.object({});
export type BuildOutput = z.infer<typeof buildOutputSchema>;
