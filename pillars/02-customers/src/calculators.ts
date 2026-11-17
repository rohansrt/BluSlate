/**
 * Customers' deterministic logic. Implemented, test-first, in the Build step.
 * Language models never compute these values. See §4.2 "Calculations".
 */
export const PLANNED_CALCULATORS = ["needScore", "hypothesisStatus", "sampleReplyRate"] as const;

export type CustomersCalculator = (typeof PLANNED_CALCULATORS)[number];
