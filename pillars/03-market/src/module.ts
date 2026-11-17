import { PillarNotBuiltError, type PillarModule } from "@bluslate/contracts";
import {
  marketInputSchema,
  marketOutputSchema,
  type MarketInput,
  type MarketOutput,
} from "./schema";

const ID = "market" as const;

/**
 * Pillar 3 · Market: "How big, reachable and contested is it?"
 * Skeleton module (S2): the contract is real, the behaviour arrives in the
 * Build step. Reads come from §3.1; writes from §3.
 */
export const marketModule: PillarModule<MarketInput, MarketOutput> = {
  id: ID,
  schemaVersion: "0.0.0",
  inputSchema: marketInputSchema,
  outputSchema: marketOutputSchema,
  reads: ["Problem", "Segment"],
  writes: ["MarketSize", "Competitor", "Benchmark"],

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

export { marketStarter } from "./starter";

export { PLANNED_AI_TASKS } from "./ai-tasks";
export { marketWorkspace } from "./workspace";
