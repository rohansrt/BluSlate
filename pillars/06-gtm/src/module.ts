import { PillarNotBuiltError, type PillarModule } from "@bluslate/contracts";
import { gtmInputSchema, gtmOutputSchema, type GtmInput, type GtmOutput } from "./schema";

const ID = "gtm" as const;

/**
 * Pillar 6 · Go to Market: "Who buys first, at what price, through which channels?"
 * Skeleton module (S2): the contract is real, the behaviour arrives in the
 * Build step. Reads come from §3.1; writes from §3.
 */
export const gtmModule: PillarModule<GtmInput, GtmOutput> = {
  id: ID,
  schemaVersion: "0.0.0",
  inputSchema: gtmInputSchema,
  outputSchema: gtmOutputSchema,
  reads: [
    "Segment",
    "Need",
    "ValueProposition",
    "Offering",
    "Competitor",
    "Benchmark",
    "CostItem",
    "Capacity",
  ],
  writes: ["Positioning", "PricePlan", "ChannelPlan", "Campaign", "LaunchPlan"],

  // Skeleton: nothing is required yet, and nothing is marked unknown.
  validateInput: () => ({ ok: true, missing: [], unknown: [] }),
  runAnalysis: async () => {
    throw new PillarNotBuiltError(ID, "runAnalysis");
  },
  previewPublish: async () => {
    throw new PillarNotBuiltError(ID, "previewPublish");
  },
  publish: async () => {
    throw new PillarNotBuiltError(ID, "publish");
  },
  onUpstreamChanged: () => [],
};

export { gtmStarter } from "./starter";

export { PLANNED_AI_TASKS } from "./ai-tasks";
export { gtmWorkspace } from "./workspace";
