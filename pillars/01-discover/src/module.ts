import { PillarNotBuiltError, type PillarModule } from "@bluslate/contracts";
import {
  discoverInputSchema,
  discoverOutputSchema,
  type DiscoverInput,
  type DiscoverOutput,
} from "./schema";

const ID = "discover" as const;

/**
 * Pillar 1 · Discover: "What problem is worth solving?"
 * Skeleton module (S2): the contract is real, the behaviour arrives in the
 * Build step. Reads come from §3.1; writes from §3.
 */
export const discoverModule: PillarModule<DiscoverInput, DiscoverOutput> = {
  id: ID,
  schemaVersion: "0.0.0",
  inputSchema: discoverInputSchema,
  outputSchema: discoverOutputSchema,
  reads: ["Startup"],
  writes: ["Problem", "Opportunity", "Hypothesis"],

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
