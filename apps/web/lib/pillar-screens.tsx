import type { ComponentType } from "react";
import type { PillarId } from "@bluslate/contracts";
import { BuildScreen } from "@bluslate/pillar-build/ui";
import { CustomersScreen } from "@bluslate/pillar-customers/ui";
import { DiscoverScreen } from "@bluslate/pillar-discover/ui";
import { GtmScreen } from "@bluslate/pillar-gtm/ui";
import { MarketScreen } from "@bluslate/pillar-market/ui";
import { RunGrowScreen } from "@bluslate/pillar-run-grow/ui";
import { SetupScreen } from "@bluslate/pillar-setup/ui";

/** Each pillar's workspace screen, rendered inside the shared pillar layout. */
export const PILLAR_SCREENS: Record<PillarId, ComponentType> = {
  discover: DiscoverScreen,
  customers: CustomersScreen,
  market: MarketScreen,
  build: BuildScreen,
  setup: SetupScreen,
  gtm: GtmScreen,
  "run-grow": RunGrowScreen,
};
