import { PillarNotBuiltError, type PillarModule } from "@bluslate/contracts";
import { setupInputSchema, setupOutputSchema, type SetupInput, type SetupOutput } from "./schema";

const ID = "setup" as const;

/**
 * Pillar 5 · Set Up: "How will it be delivered?"
 * Skeleton module (S2): the contract is real, the behaviour arrives in the
 * Build step. Reads come from §3.1; writes from §3.
 */
export const setupModule: PillarModule<SetupInput, SetupOutput> = {
  id: ID,
  schemaVersion: "0.0.0",
  inputSchema: setupInputSchema,
  outputSchema: setupOutputSchema,
  reads: ["Offering", "Feature", "RevenueModel", "Segment"],
  writes: ["Process", "Enabler", "Commitment", "TeamRole", "CostItem", "Capacity"],

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
