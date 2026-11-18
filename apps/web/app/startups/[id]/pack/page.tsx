import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PillarShell } from "@/components/pillar-shell/pillar-shell";
import { PitchDocsPanel } from "@/components/pitch-docs/pitch-docs-panel";
import { DOC_KINDS } from "@/lib/pitch-doc-kinds";
import { aiFillAvailable, listDocs } from "@/lib/pitch-docs";
import { requireUser } from "@/lib/require-user";
import { getStartupForUser } from "@/lib/startups";
import { journeyProgress } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "Pitch docs",
  robots: { index: false, follow: false },
};

/**
 * /startups/[id]/pack: Pitch docs, the eighth item in the step list
 * (decision 0012). Five documents, each generated from the work so far and
 * kept until it's generated again.
 */
export default async function PitchDocsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/startups/${id}/pack`);
  const startup = await getStartupForUser(id, user.id);
  if (!startup) notFound();
  const [journey, docs, ai] = await Promise.all([
    journeyProgress(startup),
    listDocs(startup.id),
    aiFillAvailable(startup.id),
  ]);

  return (
    <PillarShell
      startup={{ id: startup.id, name: startup.name }}
      isGuest={user.isGuest}
      active="docs"
      progress={journey.progress}
      docs={{ generated: docs.length, total: DOC_KINDS.length }}
    >
      <PitchDocsPanel
        startupId={startup.id}
        progress={journey.progress}
        initialDocs={docs}
        ai={ai}
      />
    </PillarShell>
  );
}
