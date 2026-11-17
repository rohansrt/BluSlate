/**
 * Set Up's AI tasks (Appendix A.5). Each becomes a defineTask(...) entry,
 * routed through packages/ai, in the Build step. All output is saved as a Draft.
 */
export const PLANNED_AI_TASKS = [
  "setup.processMap",
  "setup.whoDoesThis",
  "setup.findProviders",
  "setup.syntheticQuoteTerms",
  "setup.negotiate",
  "setup.riskRegister",
  "setup.complianceFlags",
  "setup.extractQuote",
] as const;

export type SetupAiTask = (typeof PLANNED_AI_TASKS)[number];
