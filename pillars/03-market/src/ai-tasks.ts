/**
 * Market's AI tasks (Appendix A.3). Each becomes a defineTask(...) entry,
 * routed through packages/ai, in the Build step. All output is saved as a Draft.
 */
export const PLANNED_AI_TASKS = [
  "market.researchPlan",
  "market.research",
  "market.findCompetitors",
  "market.reconcile",
  "market.suggestSizingInputs",
  "market.benchmarks",
] as const;

export type MarketAiTask = (typeof PLANNED_AI_TASKS)[number];
