import "server-only";
import {
  ENTITY_SCHEMAS,
  isPillarEntityType,
  type PillarEntityType,
  type StartupContext,
  type UpstreamData,
  type WorkspaceContext,
} from "@bluslate/contracts";
import { prisma } from "@/lib/db";
import { PILLAR_MODULES } from "@/lib/pillar-modules";
import { PILLAR_WORKSPACES } from "@/lib/pillar-workspaces";
import type { PillarId } from "@/lib/pillars";
import { approvalFromSession, twin } from "@/lib/twin";

interface StartupRow {
  id: string;
  name: string;
  geography: string;
  currency: string;
  onboarding: unknown;
}

function startupContext(s: StartupRow): StartupContext {
  // Onboarding answers are { firstName, path, details: { idea | interest | industry, … } }.
  const raw = (s.onboarding ?? {}) as Record<string, unknown>;
  const o = (raw.details && typeof raw.details === "object" ? raw.details : raw) as Record<
    string,
    unknown
  >;
  const idea =
    typeof o.idea === "string" ? o.idea : typeof o.interest === "string" ? o.interest : undefined;
  return { name: s.name, geography: s.geography, currency: s.currency, idea };
}

/** Approved upstream entities this pillar reads (§3.1), and their logical ids. */
async function upstreamFor(startupId: string, pillar: PillarId) {
  const types = PILLAR_MODULES[pillar].reads.filter((t): t is PillarEntityType =>
    isPillarEntityType(t),
  );
  const upstream: UpstreamData = {};
  const ids: string[] = [];
  if (types.length === 0) return { upstream, ids };
  const versions = await twin.approved(startupId, types);
  for (const v of versions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    (upstream[v.type] ??= []).push(v.data);
    ids.push(v.logicalId);
  }
  return { upstream, ids };
}

export async function workspaceContext(startup: StartupRow, pillar: PillarId) {
  const { upstream, ids } = await upstreamFor(startup.id, pillar);
  const ctx: WorkspaceContext = { startup: startupContext(startup), upstream };
  return { ctx, upstreamIds: ids };
}

/** The saved workspace, or a fresh one pre-filled from upstream data. */
export async function loadWorkspace(startup: StartupRow, pillar: PillarId) {
  const def = PILLAR_WORKSPACES[pillar];
  const { ctx, upstreamIds } = await workspaceContext(startup, pillar);
  const row = await prisma.pillarWorkspace.findUnique({
    where: { startupId_pillar: { startupId: startup.id, pillar } },
  });
  const parsed = row ? def.schema.safeParse(row.data) : null;
  const state: unknown = parsed?.success ? parsed.data : def.initial(ctx);
  return {
    ctx,
    upstreamIds,
    state,
    saved: Boolean(row),
    updatedAt: row?.updatedAt.toISOString() ?? null,
    published: (row?.published ?? {}) as Record<string, string>,
  };
}

export async function saveWorkspace(startupId: string, pillar: PillarId, data: unknown) {
  const parsed = PILLAR_WORKSPACES[pillar].schema.safeParse(data);
  if (!parsed.success) return { ok: false as const, issues: parsed.error.issues.slice(0, 5) };
  const row = await prisma.pillarWorkspace.upsert({
    where: { startupId_pillar: { startupId, pillar } },
    create: { startupId, pillar, data: parsed.data as object },
    update: { data: parsed.data as object },
  });
  return { ok: true as const, updatedAt: row.updatedAt.toISOString() };
}

/**
 * Publish the workspace's entities with the founder's approval (G5). Each one
 * goes through the Twin as a draft and then a new version; unchanged ones are
 * skipped, so publishing twice adds no history.
 */
export async function publishWorkspace(startup: StartupRow, pillar: PillarId, userId: string) {
  const def = PILLAR_WORKSPACES[pillar];
  const loaded = await loadWorkspace(startup, pillar);
  const entities = def.entities(loaded.state, loaded.ctx);
  const published = { ...loaded.published };
  const latest = new Map((await twin.approved(startup.id)).map((v) => [v.logicalId, v] as const));
  let changed = 0;
  let unchanged = 0;
  const schemaVersion = PILLAR_MODULES[pillar].schemaVersion;
  for (const e of entities) {
    const logicalId = published[e.key];
    const current = logicalId ? latest.get(logicalId) : undefined;
    const clean = ENTITY_SCHEMAS[e.type].safeParse(e.data);
    if (current && clean.success && stable(current.data) === stable(clean.data)) {
      unchanged++;
      continue;
    }
    const draft = await twin.saveDraft({
      startupId: startup.id,
      pillar,
      type: e.type,
      logicalId: current ? logicalId : null,
      data: e.data,
      evidenceLabel: e.evidenceLabel,
      createdBy: "FOUNDER",
      basedOn: loaded.upstreamIds,
      schemaVersion,
    });
    const res = await twin.publish({
      startupId: startup.id,
      draftId: draft.id,
      approval: approvalFromSession(userId),
    });
    published[e.key] = res.logicalId;
    changed++;
  }
  await prisma.pillarWorkspace.upsert({
    where: { startupId_pillar: { startupId: startup.id, pillar } },
    create: { startupId: startup.id, pillar, data: loaded.state as object, published },
    update: { published },
  });
  return { changed, unchanged, total: entities.length };
}

/** JSON with sorted keys: Postgres jsonb doesn't keep key order. */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v)
      .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}
