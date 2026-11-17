/**
 * Run & Grow's deterministic logic. Implemented, test-first, in the Build step.
 * Language models never compute these values. Run & Grow's numbers come from packages/sim-kernel (Appendix B), not from here.
 */
export const PLANNED_CALCULATORS = [] as const;

export type RunGrowCalculator = (typeof PLANNED_CALCULATORS)[number];
