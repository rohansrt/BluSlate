import "server-only";
import { AiError, pitchFillTask } from "@bluslate/ai";
import { aiContextFor, ai } from "@/lib/ai";
import { resolveModel } from "@/lib/ai-models";
import { prisma } from "@/lib/db";
import {
  buildDocContent,
  gapsFor,
  missingCanvasBoxes,
  summariesFor,
  type AiFill,
  type DocContent,
  type PillarSnapshot,
} from "@/lib/pitch-doc-content";
import { DOC_KINDS, type DocKind } from "@/lib/pitch-doc-kinds";
import { PILLAR_WORKSPACES } from "@/lib/pillar-workspaces";
import { PILLAR_IDS } from "@/lib/pillars";
import { journeyProgress, startupContext } from "@/lib/workspace";

/**
 * Pitch docs (decision 0012): generate a document from a snapshot of the
 * startup's work, keep it until the founder generates it again, and render it
 * on download. With the founder's say-so, AI predicts what's missing.
 */

interface StartupRow {
  id: string;
  name: string;
  geography: string;
  currency: string;
  onboarding: unknown;
}

export interface DocMeta {
  kind: DocKind;
  generatedAt: string;
  aiFilled: boolean;
  sections: number;
  leftOut: string[];
}

export async function docsProgress(startupId: string) {
  const generated = await prisma.pitchDoc.count({ where: { startupId } });
  return { generated, total: DOC_KINDS.length };
}

export async function listDocs(startupId: string): Promise<DocMeta[]> {
  const rows = await prisma.pitchDoc.findMany({ where: { startupId } });
  return rows.map((r) => metaOf(r.kind as DocKind, r.content as unknown as DocContent));
}

function metaOf(kind: DocKind, c: DocContent): DocMeta {
  return {
    kind,
    generatedAt: c.generatedAt,
    aiFilled: c.aiFilled,
    sections: c.sections.length,
    leftOut: c.leftOut.map((l) => l.name),
  };
}

export async function getDoc(startupId: string, kind: DocKind): Promise<DocContent | null> {
  const row = await prisma.pitchDoc.findUnique({
    where: { startupId_kind: { startupId, kind } },
  });
  return row ? (row.content as unknown as DocContent) : null;
}

/** Each pillar's work, ready for the document builder. */
export async function snapshotsFor(startup: StartupRow): Promise<PillarSnapshot[]> {
  const { progress, states } = await journeyProgress(startup);
  return PILLAR_IDS.map((pillar) => {
    const def = PILLAR_WORKSPACES[pillar];
    const { state, ctx } = states[pillar];
    return {
      pillar,
      state: progress[pillar].state,
      report: def.report(state, ctx),
      goals: def.goals(state, ctx),
      entities: def.entities(state, ctx),
    };
  });
}

/** Whether AI predictions can run (a model is set up and its key is present). Spends nothing. */
export async function aiFillAvailable(
  startupId: string,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    await resolveModel(pitchFillTask, aiContextFor(startupId));
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "AI isn't switched on yet." };
  }
}

export type GenerateResult =
  { ok: true; docs: DocMeta[] } | { ok: false; error: string; aiUnavailable?: boolean };

export async function generateDocs(
  startup: StartupRow,
  kinds: DocKind[],
  { aiFill }: { aiFill: boolean },
): Promise<GenerateResult> {
  const snapshots = await snapshotsFor(startup);
  const base = startupContext(startup);
  const info = {
    name: startup.name,
    market: startup.geography || "Market not chosen yet",
    currency: startup.currency,
    ...(base.idea ? { idea: base.idea } : {}),
  };

  let fill: AiFill | null = null;
  if (aiFill) {
    const gaps = new Map<
      string,
      { pillar: (typeof PILLAR_IDS)[number]; name: string; missingGoals: string[] }
    >();
    for (const kind of kinds) for (const g of gapsFor(kind, snapshots)) gaps.set(g.pillar, g);
    const canvasBoxes = kinds.includes("canvas")
      ? missingCanvasBoxes(snapshots, startup.currency)
      : [];
    if (gaps.size > 0 || canvasBoxes.length > 0) {
      try {
        const result = await ai.run<AiFill>(
          "core.pitch-fill",
          {
            startup: { name: info.name, market: info.market, idea: info.idea?.slice(0, 600) },
            completed: summariesFor(snapshots),
            fill: [...gaps.values()].map((g) => ({
              ...g,
              missingGoals: g.missingGoals.slice(0, 12),
            })),
            canvasBoxes,
          },
          aiContextFor(startup.id),
        );
        fill = result.items;
      } catch (err) {
        if (err instanceof AiError)
          return {
            ok: false,
            error: err.message,
            aiUnavailable: err.code === "ai_unavailable" || err.code === "cost_cap",
          };
        console.error("Pitch fill failed", err);
        return { ok: false, error: "The AI prediction didn't work this time. Try again." };
      }
    }
  }

  const now = new Date();
  const docs: DocMeta[] = [];
  for (const kind of kinds) {
    const content = buildDocContent({ kind, startup: info, snapshots, fill, now });
    await prisma.pitchDoc.upsert({
      where: { startupId_kind: { startupId: startup.id, kind } },
      create: {
        startupId: startup.id,
        kind,
        content: content as object,
        aiFilled: content.aiFilled,
      },
      update: { content: content as object, aiFilled: content.aiFilled },
    });
    docs.push(metaOf(kind, content));
  }
  return { ok: true, docs };
}
