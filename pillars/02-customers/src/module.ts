import { PillarNotBuiltError, type PillarModule } from "@bluslate/contracts";
import {
  customersInputSchema,
  customersOutputSchema,
  type CustomersInput,
  type CustomersOutput,
} from "./schema";

const ID = "customers" as const;

/**
 * Pillar 2 · Customers: "Who has the problem, and what is the evidence?"
 * Skeleton module (S2): the contract is real, the behaviour arrives in the
 * Build step. Reads come from §3.1; writes from §3.
 */
export const customersModule: PillarModule<CustomersInput, CustomersOutput> = {
  id: ID,
  schemaVersion: "0.0.0",
  inputSchema: customersInputSchema,
  outputSchema: customersOutputSchema,
  reads: ["Problem", "Hypothesis"],
  writes: ["Segment", "Persona", "Interview", "Insight", "Need"],

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

export { customersStarter } from "./starter";

export { PLANNED_AI_TASKS } from "./ai-tasks";
export { customersWorkspace } from "./workspace";
