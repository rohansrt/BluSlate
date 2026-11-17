import "server-only";
import type { EvidenceLabel } from "@bluslate/contracts";
import { PILLAR_STARTERS } from "@/lib/pillar-modules";
import type { PillarId } from "@/lib/pillars";
import { twin } from "@/lib/twin";

export interface StarterState {
  current: {
    logicalId: string;
    value: string;
    version: number;
    label: EvidenceLabel;
    approvedAt: string;
    outdated: boolean;
  } | null;
  draft: { id: string; value: string } | null;
}

function valueOf(data: Record<string, unknown>, field: string): string {
  const v = data[field];
  return typeof v === "string" ? v : v === undefined || v === null ? "" : String(v);
}

/** The pillar's first-question answer: the latest approved one, and any open draft of it. */
export async function getStarterState(startupId: string, pillar: PillarId): Promise<StarterState> {
  const starter = PILLAR_STARTERS[pillar];
  const [entities, drafts, statuses] = await Promise.all([
    twin.approved(startupId, [starter.entityType]),
    twin.drafts(startupId, pillar),
    twin.statuses(startupId),
  ]);
  const latest = entities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
  const draft =
    drafts.find(
      (d) => d.type === starter.entityType && d.logicalId === (latest?.logicalId ?? null),
    ) ?? null;
  return {
    current: latest
      ? {
          logicalId: latest.logicalId,
          value: valueOf(latest.data, starter.field),
          version: latest.version,
          label: latest.evidenceLabel,
          approvedAt: latest.createdAt.toISOString(),
          outdated: statuses.entities[latest.logicalId]?.status === "MAY_BE_OUTDATED",
        }
      : null,
    draft: draft ? { id: draft.id, value: valueOf(draft.data, starter.field) } : null,
  };
}
