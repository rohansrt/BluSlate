import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { PillarStatus } from "@bluslate/twin";
import { PillarShell } from "@/components/pillar-shell/pillar-shell";
import { PillarWorkspace } from "@/components/pillar-shell/pillar-workspace";
import { PILLAR_STARTERS } from "@/lib/pillar-modules";
import { PILLAR_SCREENS } from "@/lib/pillar-screens";
import { PILLAR_IDS, isPillarId, pillarInfo, type PillarId } from "@/lib/pillars";
import { requireUser } from "@/lib/require-user";
import { getStarterState } from "@/lib/starter-state";
import { getStartupForUser } from "@/lib/startups";
import { twin } from "@/lib/twin";

type Params = { id: string; pillar: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { pillar } = await params;
  return {
    title: isPillarId(pillar) ? pillarInfo(pillar).name : "Not found",
    robots: { index: false, follow: false },
  };
}

/** /startups/[id]/[pillar]: one pillar's workspace (§6.0, §6.3). */
export default async function PillarPage({ params }: { params: Promise<Params> }) {
  const { id, pillar } = await params;
  if (!isPillarId(pillar)) notFound();
  const user = await requireUser(`/startups/${id}/${pillar}`);
  const startup = await getStartupForUser(id, user.id);
  if (!startup) notFound();

  const [state, statuses] = await Promise.all([
    getStarterState(startup.id, pillar),
    twin.statuses(startup.id),
  ]);
  const hubStatuses = Object.fromEntries(
    PILLAR_IDS.map((p) => [p, statuses.pillars[p].status]),
  ) as Record<PillarId, PillarStatus>;
  const info = pillarInfo(pillar);
  const Screen = PILLAR_SCREENS[pillar];

  return (
    <PillarShell
      startup={{ id: startup.id, name: startup.name }}
      active={info}
      statuses={hubStatuses}
    >
      <PillarWorkspace
        startupId={startup.id}
        pillar={pillar}
        pillarName={info.name}
        starter={PILLAR_STARTERS[pillar]}
        state={state}
      >
        <Screen />
      </PillarWorkspace>
    </PillarShell>
  );
}
