import { z } from "zod";

/**
 * Go to Market's own input and draft schemas (CLAUDE.md architecture rule 6).
 * Empty placeholders until the Define step lists every field from §4.6
 * "User inputs". Entity schemas live in packages/contracts/entities/gtm.ts (S3).
 */
export const gtmInputSchema = z.object({});
export type GtmInput = z.infer<typeof gtmInputSchema>;

/** The draft of the entities Go to Market owns, before the founder approves it. */
export const gtmOutputSchema = z.object({});
export type GtmOutput = z.infer<typeof gtmOutputSchema>;
