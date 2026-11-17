/**
 * Discover's deterministic logic. Implemented, test-first, in the Build step.
 * Language models never compute these values. See §4.1 "Calculations".
 */
export const PLANNED_CALCULATORS = ["opportunityScore", "hypothesisPriority"] as const;

export type DiscoverCalculator = (typeof PLANNED_CALCULATORS)[number];
