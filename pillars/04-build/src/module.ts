import { PillarNotBuiltError, type PillarModule } from "@bluslate/contracts";
import { buildInputSchema, buildOutputSchema, type BuildInput, type BuildOutput } from "./schema";

const ID = "build" as const;

/**
 * Pillar 4 · Build: "What exactly should exist?"
 * Skeleton module (S2): the contract is real, the behaviour arrives in the
 * Build step. Reads come from §3.1; writes from §3.
 */
export const buildModule: PillarModule<BuildInput, BuildOutput> = {
  id: ID,
  schemaVersion: "0.0.0",
  inputSchema: buildInputSchema,
  outputSchema: buildOutputSchema,
  reads: ["Problem", "Need", "Segment", "Competitor"],
  writes: ["Feature", "Offering", "ValueProposition", "RevenueModel"],

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

export { buildStarter } from "./starter";

export { PLANNED_AI_TASKS } from "./ai-tasks";
export { buildWorkspace } from "./workspace";
