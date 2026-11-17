import { z } from "zod";

/**
 * Discover's own input and draft schemas (CLAUDE.md architecture rule 6).
 * Empty placeholders until the Define step lists every field from §4.1
 * "User inputs". Entity schemas live in packages/contracts/entities/discover.ts (S3).
 */
export const discoverInputSchema = z.object({});
export type DiscoverInput = z.infer<typeof discoverInputSchema>;

/** The draft of the entities Discover owns, before the founder approves it. */
export const discoverOutputSchema = z.object({});
export type DiscoverOutput = z.infer<typeof discoverOutputSchema>;
