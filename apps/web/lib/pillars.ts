/** Pillar metadata comes from packages/contracts (single source of truth). */
export {
  PILLARS,
  PILLAR_IDS,
  isPillarId,
  pillarInfo,
  type PillarId,
  type PillarInfo,
} from "@bluslate/contracts";

import { PILLARS } from "@bluslate/contracts";

export function pillarById(id: string) {
  return PILLARS.find((p) => p.id === id);
}
