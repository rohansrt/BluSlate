/**
 * Build's deterministic logic. Implemented, test-first, in the Build step.
 * Language models never compute these values. See §4.4 "Calculations".
 */
export const PLANNED_CALCULATORS = [
  "topNeedCoverage",
  "riceScore",
  "effortTotal",
  "productFitScore",
] as const;

export type BuildCalculator = (typeof PLANNED_CALCULATORS)[number];
