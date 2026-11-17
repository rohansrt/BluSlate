import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PillarShell } from "@/components/pillar-shell/pillar-shell";
import { PILLAR_SCREENS } from "@/lib/pillar-screens";
import { isPillarId, pillarInfo } from "@/lib/pillars";
import { requireUser } from "@/lib/require-user";
import { getStartupForUser } from "@/lib/startups";

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

  const Screen = PILLAR_SCREENS[pillar];
  return (
    <PillarShell startup={{ id: startup.id, name: startup.name }} active={pillarInfo(pillar)}>
      <Screen />
    </PillarShell>
  );
}
