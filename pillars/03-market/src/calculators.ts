/**
 * Market's deterministic logic. Implemented, test-first, in the Build step.
 * Language models never compute these values. See §4.3 "Calculations".
 */
export const PLANNED_CALCULATORS = ["bottomUpSize", "marketSizeRange", "sensitivity"] as const;

export type MarketCalculator = (typeof PLANNED_CALCULATORS)[number];
