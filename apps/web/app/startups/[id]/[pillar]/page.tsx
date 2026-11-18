import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PillarShell } from "@/components/pillar-shell/pillar-shell";
import { PillarWorkbench } from "@/components/pillar-shell/pillar-workbench";
import { docsProgress } from "@/lib/pitch-docs";
import { isPillarId, pillarInfo } from "@/lib/pillars";
import { requireUser } from "@/lib/require-user";
import { getStartupForUser } from "@/lib/startups";
import { journeyProgress, loadWorkspace } from "@/lib/workspace";

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

  const [workspace, journey, docs] = await Promise.all([
    loadWorkspace(startup, pillar),
    journeyProgress(startup),
    docsProgress(startup.id),
  ]);
  const info = pillarInfo(pillar);

  return (
    <PillarShell
      key={pillar}
      startup={{ id: startup.id, name: startup.name }}
      isGuest={user.isGuest}
      active={pillar}
      progress={journey.progress}
      docs={docs}
    >
      <PillarWorkbench
        startupId={startup.id}
        pillar={pillar}
        pillarName={info.name}
        initialState={workspace.state}
        ctx={workspace.ctx}
        everPublished={Object.keys(workspace.published).length > 0}
        market={{ country: startup.marketCountry, region: startup.marketRegion }}
      />
    </PillarShell>
  );
}
