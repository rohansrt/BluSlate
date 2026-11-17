import type { PillarId, PillarModule, PillarStarter } from "@bluslate/contracts";
import { PLANNED_AI_TASKS as buildTasks, buildModule, buildStarter } from "@bluslate/pillar-build";
import {
  PLANNED_AI_TASKS as customersTasks,
  customersModule,
  customersStarter,
} from "@bluslate/pillar-customers";
import {
  PLANNED_AI_TASKS as discoverTasks,
  discoverModule,
  discoverStarter,
} from "@bluslate/pillar-discover";
import { PLANNED_AI_TASKS as gtmTasks, gtmModule, gtmStarter } from "@bluslate/pillar-gtm";
import {
  PLANNED_AI_TASKS as marketTasks,
  marketModule,
  marketStarter,
} from "@bluslate/pillar-market";
import {
  PLANNED_AI_TASKS as runGrowTasks,
  runGrowModule,
  runGrowStarter,
} from "@bluslate/pillar-run-grow";
import { PLANNED_AI_TASKS as setupTasks, setupModule, setupStarter } from "@bluslate/pillar-setup";

/** What the app needs from every pillar module, whatever its input and output types. */
export type RegisteredModule = Pick<
  PillarModule<unknown, unknown>,
  "id" | "schemaVersion" | "reads" | "writes"
>;

/**
 * The seven pillar modules. Only the app wires pillars together; pillars never
 * import each other (CLAUDE.md architecture rule 4).
 */
export const PILLAR_MODULES: Record<PillarId, RegisteredModule> = {
  discover: discoverModule,
  customers: customersModule,
  market: marketModule,
  build: buildModule,
  setup: setupModule,
  gtm: gtmModule,
  "run-grow": runGrowModule,
};

/** Each pillar's first question: the one manual value it can publish before its Build step. */
export const PILLAR_STARTERS: Record<PillarId, PillarStarter> = {
  discover: discoverStarter,
  customers: customersStarter,
  market: marketStarter,
  build: buildStarter,
  setup: setupStarter,
  gtm: gtmStarter,
  "run-grow": runGrowStarter,
};

/** The AI tasks each pillar plans (Appendix A), for the admin model dashboard. */
export const PILLAR_AI_TASKS: Record<PillarId, readonly string[]> = {
  discover: discoverTasks,
  customers: customersTasks,
  market: marketTasks,
  build: buildTasks,
  setup: setupTasks,
  gtm: gtmTasks,
  "run-grow": runGrowTasks,
};
