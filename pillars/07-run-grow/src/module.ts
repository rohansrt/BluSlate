import { PILLAR_ENTITY_TYPES, PillarNotBuiltError, type PillarModule } from "@bluslate/contracts";
import {
  runGrowInputSchema,
  runGrowOutputSchema,
  type RunGrowInput,
  type RunGrowOutput,
} from "./schema";

const ID = "run-grow" as const;

/**
 * Pillar 7 · Run & Grow: "What happens over time?"
 * Skeleton module (S2): the contract is real, the behaviour arrives in the
 * Build step. Reads come from every approved upstream entity (§3.1); writes from §3.
 */
export const runGrowModule: PillarModule<RunGrowInput, RunGrowOutput> = {
  id: ID,
  schemaVersion: "0.0.0",
  inputSchema: runGrowInputSchema,
  outputSchema: runGrowOutputSchema,
  reads: [
    "Startup",
    ...PILLAR_ENTITY_TYPES.discover,
    ...PILLAR_ENTITY_TYPES.customers,
    ...PILLAR_ENTITY_TYPES.market,
    ...PILLAR_ENTITY_TYPES.build,
    ...PILLAR_ENTITY_TYPES.setup,
    ...PILLAR_ENTITY_TYPES.gtm,
  ],
  writes: ["Scenario", "SimRun", "Period", "LeverChange", "MarketEvent", "KpiSeries"],

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

export { runGrowStarter } from "./starter";
