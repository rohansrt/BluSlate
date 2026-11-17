/**
 * Go to Market's deterministic logic. Implemented, test-first, in the Build step.
 * Language models never compute these values. See §4.6 "Calculations".
 */
export const PLANNED_CALCULATORS = [
  "priceWaterfall",
  "contributionPerUnit",
  "breakEvenVolume",
  "funnel",
  "spendCurve",
] as const;

export type GtmCalculator = (typeof PLANNED_CALCULATORS)[number];
