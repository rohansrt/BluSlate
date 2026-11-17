import { z } from "zod";

/**
 * Market's own input and draft schemas (CLAUDE.md architecture rule 6).
 * Empty placeholders until the Define step lists every field from §4.3
 * "User inputs". Entity schemas live in packages/contracts/entities/market.ts (S3).
 */
export const marketInputSchema = z.object({});
export type MarketInput = z.infer<typeof marketInputSchema>;

/** The draft of the entities Market owns, before the founder approves it. */
export const marketOutputSchema = z.object({});
export type MarketOutput = z.infer<typeof marketOutputSchema>;
