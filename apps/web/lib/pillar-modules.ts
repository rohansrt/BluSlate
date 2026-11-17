import type { PillarId, PillarModule } from "@bluslate/contracts";
import { buildModule } from "@bluslate/pillar-build";
import { customersModule } from "@bluslate/pillar-customers";
import { discoverModule } from "@bluslate/pillar-discover";
import { gtmModule } from "@bluslate/pillar-gtm";
import { marketModule } from "@bluslate/pillar-market";
import { runGrowModule } from "@bluslate/pillar-run-grow";
import { setupModule } from "@bluslate/pillar-setup";

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
