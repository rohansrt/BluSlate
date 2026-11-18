import { notFound, redirect } from "next/navigation";
import { PILLAR_IDS, type PillarId } from "@/lib/pillars";
import { requireUser } from "@/lib/require-user";
import { getStartupForUser } from "@/lib/startups";
import { journeyProgress } from "@/lib/workspace";

function highlightFrom(raw: unknown): PillarId | null {
  if (!raw || typeof raw !== "object" || !("highlightPillar" in raw)) return null;
  const value = (raw as { highlightPillar?: unknown }).highlightPillar;
  return PILLAR_IDS.includes(value as PillarId) ? (value as PillarId) : null;
}

/**
 * /startups/[id] opens the startup straight in a step (decision 0012; the
 * old city overview is gone). "Just one tool" opens that tool; otherwise the
 * first step that isn't complete, or Pitch docs when every step is.
 */
export default async function StartupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/startups/${id}`);
  const startup = await getStartupForUser(id, user.id);
  if (!startup) notFound();

  const tool = startup.entryPath === "ONE_TOOL" ? highlightFrom(startup.onboarding) : null;
  if (tool) redirect(`/startups/${id}/${tool}`);
  const { progress } = await journeyProgress(startup);
  const next = PILLAR_IDS.find((p) => progress[p].state !== "complete");
  redirect(next ? `/startups/${id}/${next}` : `/startups/${id}/pack`);
}
