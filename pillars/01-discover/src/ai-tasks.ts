/**
 * Discover's AI tasks (Appendix A.1). Each becomes a defineTask(...) entry,
 * routed through packages/ai, in the Build step. All output is saved as a Draft.
 */
export const PLANNED_AI_TASKS = [
  "discover.reframeProblem",
  "discover.exploreSpaces",
  "discover.rateOpportunities",
  "discover.hypotheses",
  "discover.challenge",
] as const;

export type DiscoverAiTask = (typeof PLANNED_AI_TASKS)[number];
