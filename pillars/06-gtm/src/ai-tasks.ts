/**
 * Go to Market's AI tasks (Appendix A.6). Each becomes a defineTask(...) entry,
 * routed through packages/ai, in the Build step. All output is saved as a Draft.
 */
export const PLANNED_AI_TASKS = [
  "gtm.positioning",
  "gtm.competitorPrices",
  "gtm.explainPricingMethod",
  "gtm.channelShortlist",
  "gtm.messageVariants",
  "gtm.messageReactions",
  "gtm.campaignPlan",
  "gtm.launchChecklist",
] as const;

export type GtmAiTask = (typeof PLANNED_AI_TASKS)[number];
