/**
 * Run & Grow's AI tasks (Appendix A.7). Each becomes a defineTask(...) entry,
 * routed through packages/ai, in the Build step. All output is saved as a Draft.
 */
export const PLANNED_AI_TASKS = [
  "run.competitorMove",
  "run.eventNarrative",
  "run.customerVoice",
  "run.boardMeeting",
  "run.explainMetric",
  "run.proposeUpstream",
  "run.mapActuals",
] as const;

export type RunGrowAiTask = (typeof PLANNED_AI_TASKS)[number];
