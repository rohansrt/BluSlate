/**
 * Customers' AI tasks (Appendix A.2). Each becomes a defineTask(...) entry,
 * routed through packages/ai, in the Build step. All output is saved as a Draft.
 */
export const PLANNED_AI_TASKS = [
  "customers.suggestSegments",
  "customers.outreachDraft",
  "customers.scoreMessage",
  "customers.generatePersona",
  "customers.personaReply",
  "customers.coachQuestion",
  "customers.surveyOpenText",
  "customers.extractInsights",
  "customers.clusterInsights",
  "customers.transcribe",
] as const;

export type CustomersAiTask = (typeof PLANNED_AI_TASKS)[number];
