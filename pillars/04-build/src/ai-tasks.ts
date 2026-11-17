/**
 * Build's AI tasks (Appendix A.4). Each becomes a defineTask(...) entry,
 * routed through packages/ai, in the Build step. All output is saved as a Draft.
 */
export const PLANNED_AI_TASKS = [
  "build.mapNeeds",
  "build.suggestFeatures",
  "build.riceInputs",
  "build.mvpSpec",
  "build.mvpMockup",
  "build.usabilityTest",
  "build.suggestRevenueModels",
  "build.valueProposition",
] as const;

export type BuildAiTask = (typeof PLANNED_AI_TASKS)[number];
