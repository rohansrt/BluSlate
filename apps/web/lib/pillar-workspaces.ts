import type { PillarId, PillarWorkspaceDef } from "@bluslate/contracts";
import { buildWorkspace } from "@bluslate/pillar-build";
import { customersWorkspace } from "@bluslate/pillar-customers";
import { discoverWorkspace } from "@bluslate/pillar-discover";
import { gtmWorkspace } from "@bluslate/pillar-gtm";
import { marketWorkspace } from "@bluslate/pillar-market";
import { runGrowWorkspace } from "@bluslate/pillar-run-grow";
import { setupWorkspace } from "@bluslate/pillar-setup";

/**
 * Each pillar's workspace definition (decision 0006): state schema, goals,
 * report-out and the entities it publishes. Pure code, used on client and server.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PILLAR_WORKSPACES: Record<PillarId, PillarWorkspaceDef<any>> = {
  discover: discoverWorkspace,
  customers: customersWorkspace,
  market: marketWorkspace,
  build: buildWorkspace,
  setup: setupWorkspace,
  gtm: gtmWorkspace,
  "run-grow": runGrowWorkspace,
};
