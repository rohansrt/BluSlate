import { z } from "zod";

/**
 * Customers' own input and draft schemas (CLAUDE.md architecture rule 6).
 * Empty placeholders until the Define step lists every field from §4.2
 * "User inputs". Entity schemas live in packages/contracts/entities/customers.ts (S3).
 */
export const customersInputSchema = z.object({});
export type CustomersInput = z.infer<typeof customersInputSchema>;

/** The draft of the entities Customers owns, before the founder approves it. */
export const customersOutputSchema = z.object({});
export type CustomersOutput = z.infer<typeof customersOutputSchema>;
