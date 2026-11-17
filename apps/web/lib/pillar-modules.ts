import type { PillarId, PillarModule, PillarStarter } from "@bluslate/contracts";
import { buildModule, buildStarter } from "@bluslate/pillar-build";
import { customersModule, customersStarter } from "@bluslate/pillar-customers";
import { discoverModule, discoverStarter } from "@bluslate/pillar-discover";
import { gtmModule, gtmStarter } from "@bluslate/pillar-gtm";
import { marketModule, marketStarter } from "@bluslate/pillar-market";
import { runGrowModule, runGrowStarter } from "@bluslate/pillar-run-grow";
import { setupModule, setupStarter } from "@bluslate/pillar-setup";

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
