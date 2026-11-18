import "server-only";
import {
  ENTITY_SCHEMAS,
  goalProgress,
  isPillarEntityType,
  type GoalProgress,
  type PillarEntityType,
  type StartupContext,
  type UpstreamData,
  type WorkspaceContext,
} from "@bluslate/contracts";
import { prisma } from "@/lib/db";
import { PILLAR_MODULES } from "@/lib/pillar-modules";
import { changedFacts, stable } from "@/lib/shared-facts";
import { PILLAR_WORKSPACES } from "@/lib/pillar-workspaces";
import { PILLAR_IDS, type PillarId } from "@/lib/pillars";
import { approvalFromSession, twin } from "@/lib/twin";

interface StartupRow {
  id: string;
  name: string;
  geography: string;
  currency: string;
  onboarding: unknown;
}

export function startupContext(s: StartupRow): StartupContext {
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

type ApprovedVersion = Awaited<ReturnType<typeof twin.approved>>[number];

function readsOf(pillar: PillarId): PillarEntityType[] {
  return PILLAR_MODULES[pillar].reads.filter((t): t is PillarEntityType => isPillarEntityType(t));
}

/** Group approved versions into the upstream data one pillar reads. */
function upstreamFromVersions(versions: ApprovedVersion[], pillar: PillarId) {
  const types = new Set<string>(readsOf(pillar));
  const upstream: UpstreamData = {};
  const ids: string[] = [];
  for (const v of [...versions].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    if (!types.has(v.type)) continue;
    (upstream[v.type] ??= []).push(v.data);
    ids.push(v.logicalId);
  }
  return { upstream, ids };
}

/** Approved upstream entities this pillar reads (§3.1), and their logical ids. */
async function upstreamFor(startupId: string, pillar: PillarId) {
  const types = readsOf(pillar);
  if (types.length === 0) return { upstream: {} as UpstreamData, ids: [] as string[] };
  return upstreamFromVersions(await twin.approved(startupId, types), pillar);
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

export interface PillarProgress extends GoalProgress {
  /** The founder has saved work in this pillar (or it was autofilled). */
  saved: boolean;
}

/**
 * Every pillar's goal progress (decision 0012), for the step list, the
 * Passport and the Pitch docs. One query for workspaces and one for the Twin.
 */
export async function journeyProgress(startup: StartupRow) {
  const [rows, versions] = await Promise.all([
    prisma.pillarWorkspace.findMany({ where: { startupId: startup.id } }),
    twin.approved(startup.id),
  ]);
  const base = startupContext(startup);
  const out = {} as Record<PillarId, PillarProgress>;
  const states = {} as Record<PillarId, { state: unknown; ctx: WorkspaceContext; saved: boolean }>;
  for (const pillar of PILLAR_IDS) {
    const def = PILLAR_WORKSPACES[pillar];
    const ctx: WorkspaceContext = {
      startup: base,
      upstream: upstreamFromVersions(versions, pillar).upstream,
    };
    const row = rows.find((r) => r.pillar === pillar);
    const parsed = row ? def.schema.safeParse(row.data) : null;
    const state: unknown = parsed?.success ? parsed.data : def.initial(ctx);
    out[pillar] = { ...goalProgress(def.goals(state, ctx)), saved: Boolean(row) };
    states[pillar] = { state, ctx, saved: Boolean(row) };
  }
  return { progress: out, states };
}

export async function saveWorkspace(startup: StartupRow, pillar: PillarId, data: unknown) {
  const def = PILLAR_WORKSPACES[pillar];
  const parsed = def.schema.safeParse(data);
  if (!parsed.success) return { ok: false as const, issues: parsed.error.issues.slice(0, 5) };
  const before = def.shared ? (await loadWorkspace(startup, pillar)).state : null;
  const row = await prisma.pillarWorkspace.upsert({
    where: { startupId_pillar: { startupId: startup.id, pillar } },
    create: { startupId: startup.id, pillar, data: parsed.data as object },
    update: { data: parsed.data as object },
  });
  const linked = before === null ? [] : await shareFacts(startup, pillar, before, parsed.data);
  return { ok: true as const, updatedAt: row.updatedAt.toISOString(), linked };
}

/**
 * Copy changed shared facts into the linked fields of other steps (decision
 * 0012): a linked field follows its source while it's empty or still matches
 * what the source said before. Returns the steps that changed.
 */
export async function shareFacts(
  startup: StartupRow,
  pillar: PillarId,
  before: unknown,
  after: unknown,
): Promise<PillarId[]> {
  const source = PILLAR_WORKSPACES[pillar].shared;
  if (!source) return [];
  const bare: WorkspaceContext = { startup: startupContext(startup), upstream: {} };
  const { next, prev } = changedFacts(source.read(before, bare), source.read(after, bare));
  if (Object.keys(next).length === 0) return [];

  const targets = PILLAR_IDS.filter((p) => p !== pillar && PILLAR_WORKSPACES[p].shared?.write);
  const rows = await prisma.pillarWorkspace.findMany({
    where: { startupId: startup.id, pillar: { in: targets } },
  });
  let versions: ApprovedVersion[] | null = null;
  const changed: PillarId[] = [];
  for (const target of targets) {
    const def = PILLAR_WORKSPACES[target];
    const row = rows.find((r) => r.pillar === target);
    const saved = row ? def.schema.safeParse(row.data) : null;
    let state: unknown;
    if (saved?.success) state = saved.data;
    else {
      versions ??= await twin.approved(startup.id);
      state = def.initial({
        startup: bare.startup,
        upstream: upstreamFromVersions(versions, target).upstream,
      });
    }
    const updated = def.schema.safeParse(def.shared!.write!(state, next, prev));
    if (!updated.success || stable(updated.data) === stable(state)) continue;
    await prisma.pillarWorkspace.upsert({
      where: { startupId_pillar: { startupId: startup.id, pillar: target } },
      create: { startupId: startup.id, pillar: target, data: updated.data as object },
      update: { data: updated.data as object },
    });
    changed.push(target);
  }
  return changed;
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
