/**
 * Set Up's deterministic logic. Implemented, test-first, in the Build step.
 * Language models never compute these values. See §4.5 "Calculations".
 */
export const PLANNED_CALCULATORS = [
  "unitCost",
  "capacity",
  "criticalPath",
  "cashTiedUp",
  "riskPriorityNumber",
] as const;

export type SetupCalculator = (typeof PLANNED_CALCULATORS)[number];
