import {
  ENTITY_OWNER,
  ENTITY_SCHEMAS,
  PILLAR_ENTITY_TYPES,
  PILLAR_IDS,
  isPillarEntityType,
  type EvidenceLabel,
  type FounderApproval,
  type PillarEntityType,
  type PillarId,
} from "@bluslate/contracts";
import {
  ApprovalRequiredError,
  EntityValidationError,
  NotFoundError,
  SingleWriterError,
} from "./errors";
import { entityStatus, pillarStatus } from "./status";
import type { TwinStore } from "./store";
import type {
  Actor,
  AssumptionRecord,
  DraftRecord,
  EntityStatusView,
  EntityVersion,
  PillarStatusSummary,
  ProposalRecord,
  SnapshotRecord,
} from "./types";

/**
 * The Business Twin (spec §5.1, §5.5): the auditable state of one startup.
 *
 * - Only `publish` writes history, and it needs a FounderApproval (G5).
 * - Publishing appends a new version and a DecisionEvent; nothing is updated
 *   in place (architecture rule 5).
 * - Only the owning pillar may publish a type (single writer, rule 3).
 * - A change marks the entities built from it "May be outdated", one entity at
 *   a time (§5.5 step 4).
 */

export interface TwinOptions {
  now?: () => Date;
  newId?: () => string;
  /** How long an approval stays valid after the founder gives it. */
  approvalMaxAgeMs?: number;
}

export interface SaveDraftInput {
  startupId: string;
  pillar: PillarId;
  type: PillarEntityType;
  /** Edit an existing entity; omit to create a new one. */
  logicalId?: string | null;
  /** Update this draft instead of starting another. */
  draftId?: string;
  data: Record<string, unknown>;
  /** Assigned by the server (or the AI gateway), never by the client. */
  evidenceLabel: EvidenceLabel;
  createdBy: Actor;
  reviewState?: DraftRecord["reviewState"];
  basedOn?: string[];
  rationale?: string | null;
  schemaVersion: string;
}

export interface AffectedEntity {
  logicalId: string;
  type: PillarEntityType;
  ownerPillar: PillarId;
}

export interface TwinImpactPreview {
  draft: DraftRecord;
  isNew: boolean;
  fromVersion: number | null;
  /** Entities that used this one and will be marked "May be outdated". */
  affected: AffectedEntity[];
  /** Pillars those entities belong to. */
  affectedPillars: PillarId[];
}

export interface TwinPublishResult {
  logicalId: string;
  version: number;
  staleMarked: AffectedEntity[];
}

export interface TwinStatuses {
  entities: Record<string, { type: PillarEntityType; pillar: PillarId; status: EntityStatusView }>;
  pillars: Record<PillarId, PillarStatusSummary>;
}

export function createTwin(store: TwinStore, options: TwinOptions = {}) {
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? (() => crypto.randomUUID());
  const approvalMaxAgeMs = options.approvalMaxAgeMs ?? 10 * 60 * 1000;

  function assertOwner(pillar: PillarId, type: string): asserts type is PillarEntityType {
    if (!isPillarEntityType(type) || ENTITY_OWNER[type] !== pillar) {
      throw new SingleWriterError(
        pillar,
        type,
        isPillarEntityType(type) ? ENTITY_OWNER[type] : undefined,
      );
    }
  }

  function validate(type: PillarEntityType, data: unknown): Record<string, unknown> {
    const parsed = ENTITY_SCHEMAS[type].safeParse(data);
    if (!parsed.success) throw new EntityValidationError(type, parsed.error.issues);
    return parsed.data as Record<string, unknown>;
  }

  async function assertApproval(
    s: TwinStore,
    startupId: string,
    approval: FounderApproval | null | undefined,
  ) {
    if (!approval || typeof approval.userId !== "string" || approval.userId.length === 0) {
      throw new ApprovalRequiredError("no founder approval was given");
    }
    const at = new Date(approval.approvedAt);
    const age = now().getTime() - at.getTime();
    if (Number.isNaN(at.getTime()) || age < -60_000 || age > approvalMaxAgeMs) {
      throw new ApprovalRequiredError("the approval is missing a valid, recent time");
    }
    if (!(await s.isMember(startupId, approval.userId))) {
      throw new ApprovalRequiredError("the approver is not a member of this startup");
    }
  }

  async function latestOf(s: TwinStore, startupId: string, logicalId: string) {
    const versions = await s.versionsOf(startupId, logicalId);
    return versions.at(-1) ?? null;
  }

  async function affectedBy(
    s: TwinStore,
    startupId: string,
    logicalId: string,
  ): Promise<AffectedEntity[]> {
    const out: AffectedEntity[] = [];
    for (const dep of await s.dependentsOf(logicalId)) {
      if (dep === logicalId) continue;
      const latest = await latestOf(s, startupId, dep);
      if (latest) out.push({ logicalId: dep, type: latest.type, ownerPillar: latest.ownerPillar });
    }
    return out;
  }

  const twin = {
    /** Save (or update) a draft. Drafts never reach other pillars until published. */
    async saveDraft(input: SaveDraftInput): Promise<DraftRecord> {
      assertOwner(input.pillar, input.type);
      const data = validate(input.type, input.data);
      return store.transaction(async (s) => {
        if (input.logicalId) {
          const existing = await latestOf(s, input.startupId, input.logicalId);
          if (!existing || existing.type !== input.type)
            throw new NotFoundError(`Entity ${input.logicalId}`);
        }
        let id = newId();
        if (input.draftId) {
          const prior = await s.getDraft(input.startupId, input.draftId);
          if (!prior) throw new NotFoundError(`Draft ${input.draftId}`);
          if (prior.pillar !== input.pillar || prior.type !== input.type) {
            throw new SingleWriterError(input.pillar, input.type, prior.pillar);
          }
          id = prior.id;
        }
        const draft: DraftRecord = {
          id,
          startupId: input.startupId,
          pillar: input.pillar,
          type: input.type,
          logicalId: input.logicalId ?? null,
          data,
          evidenceLabel: input.evidenceLabel,
          createdBy: input.createdBy,
          reviewState:
            input.reviewState ?? (input.createdBy === "FOUNDER" ? "DRAFT" : "NEEDS_REVIEW"),
          basedOn: [...new Set(input.basedOn ?? [])],
          rationale: input.rationale ?? null,
          schemaVersion: input.schemaVersion,
          updatedAt: now(),
        };
        await s.saveDraft(draft);
        return draft;
      });
    },

    async discardDraft(startupId: string, draftId: string): Promise<void> {
      await store.deleteDraft(startupId, draftId);
    },

    async drafts(startupId: string, pillar?: PillarId): Promise<DraftRecord[]> {
      const all = await store.drafts(startupId);
      return pillar ? all.filter((d) => d.pillar === pillar) : all;
    },

    /** What publishing this draft would change, shown before the founder approves (§5.5 step 2). */
    async previewPublish(startupId: string, draftId: string): Promise<TwinImpactPreview> {
      const draft = await store.getDraft(startupId, draftId);
      if (!draft) throw new NotFoundError(`Draft ${draftId}`);
      const current = draft.logicalId ? await latestOf(store, startupId, draft.logicalId) : null;
      const affected = draft.logicalId ? await affectedBy(store, startupId, draft.logicalId) : [];
      return {
        draft,
        isNew: !current,
        fromVersion: current?.version ?? null,
        affected,
        affectedPillars: [...new Set(affected.map((a) => a.ownerPillar))],
      };
    },

    /** Publish a draft with the founder's approval. The only way history is written. */
    async publish(input: {
      startupId: string;
      draftId: string;
      approval: FounderApproval;
      rationale?: string | null;
      effectiveFrom?: Date | null;
      scenarioId?: string | null;
    }): Promise<TwinPublishResult> {
      return store.transaction(async (s) => {
        await assertApproval(s, input.startupId, input.approval);
        const draft = await s.getDraft(input.startupId, input.draftId);
        if (!draft) throw new NotFoundError(`Draft ${input.draftId}`);
        assertOwner(draft.pillar, draft.type);
        const data = validate(draft.type, draft.data);

        const logicalId = draft.logicalId ?? newId();
        const previous = draft.logicalId ? await latestOf(s, input.startupId, logicalId) : null;
        const version = (previous?.version ?? 0) + 1;
        const at = now();

        const entity: EntityVersion = {
          id: newId(),
          startupId: input.startupId,
          logicalId,
          version,
          type: draft.type,
          ownerPillar: draft.pillar,
          schemaVersion: draft.schemaVersion,
          evidenceLabel: draft.evidenceLabel,
          confidence: null,
          data,
          effectiveFrom: input.effectiveFrom ?? null,
          createdBy: draft.createdBy,
          createdAt: at,
        };
        await s.insertVersion(entity);
        await s.insertDecisionEvent({
          id: newId(),
          startupId: input.startupId,
          scenarioId: input.scenarioId ?? null,
          entityLogicalId: logicalId,
          fromVersion: previous?.version ?? null,
          toVersion: version,
          actorId: input.approval.userId,
          rationale: input.rationale ?? draft.rationale,
          effectiveAt: input.effectiveFrom ?? null,
          createdAt: at,
        });

        const upstream = draft.basedOn.filter((id) => id !== logicalId);
        if (upstream.length > 0) await s.insertDependencies(upstream, logicalId);

        // Only a change to an existing entity can make its dependents outdated.
        const staleMarked = previous ? await affectedBy(s, input.startupId, logicalId) : [];
        if (staleMarked.length > 0) {
          const marks = [];
          for (const a of staleMarked) {
            const latest = await latestOf(s, input.startupId, a.logicalId);
            if (!latest) continue;
            marks.push({
              id: newId(),
              startupId: input.startupId,
              logicalId: a.logicalId,
              version: latest.version,
              causedByLogicalId: logicalId,
              reason: `${draft.type} changed (version ${version})`,
              createdAt: at,
            });
          }
          await s.insertStaleMarks(marks);
        }

        // Founder assumptions enter the assumptions register (§5.3), one row per changed field.
        if (draft.evidenceLabel === "ASSUMED") {
          for (const [field, value] of Object.entries(data)) {
            if (previous && JSON.stringify(previous.data[field]) === JSON.stringify(value))
              continue;
            const row: AssumptionRecord = {
              id: newId(),
              startupId: input.startupId,
              entityLogicalId: logicalId,
              field,
              value,
              label: "ASSUMED",
              confidence: "medium",
              sensitivity: null,
              status: "untested",
              aiSuggested: draft.createdBy === "AI",
            };
            await s.insertAssumption(row);
          }
        }

        await s.deleteDraft(input.startupId, draft.id);
        return { logicalId, version, staleMarked };
      });
    },

    /** The newest approved version of each entity (what other pillars read). */
    async approved(
      startupId: string,
      types?: readonly PillarEntityType[],
    ): Promise<EntityVersion[]> {
      return store.latestVersions(startupId, types);
    },

    async history(startupId: string, logicalId: string): Promise<EntityVersion[]> {
      return store.versionsOf(startupId, logicalId);
    },

    async decisions(startupId: string) {
      return store.decisionEvents(startupId);
    },

    /** Entity and hub statuses for the city and the hub rail. */
    async statuses(startupId: string): Promise<TwinStatuses> {
      const [latest, marks, drafts, proposals] = await Promise.all([
        store.latestVersions(startupId),
        store.staleMarks(startupId),
        store.drafts(startupId),
        store.proposals(startupId),
      ]);
      const draftFor = new Map<string, DraftRecord["reviewState"]>();
      for (const d of drafts) if (d.logicalId) draftFor.set(d.logicalId, d.reviewState);

      const entities: TwinStatuses["entities"] = {};
      for (const v of latest) {
        const stale = marks.some((m) => m.logicalId === v.logicalId && m.version === v.version);
        entities[v.logicalId] = {
          type: v.type,
          pillar: v.ownerPillar,
          status: entityStatus({
            hasPublished: true,
            stale,
            draft: draftFor.get(v.logicalId) ?? null,
          }),
        };
      }

      const pillars = {} as Record<PillarId, PillarStatusSummary>;
      for (const pillar of PILLAR_IDS) {
        const statuses: EntityStatusView[] = Object.values(entities)
          .filter((e) => e.pillar === pillar)
          .map((e) => e.status);
        // New entities that exist only as drafts, and pending proposals, count too.
        for (const d of drafts) {
          if (d.pillar === pillar && !d.logicalId)
            statuses.push(
              entityStatus({ hasPublished: false, stale: false, draft: d.reviewState }),
            );
        }
        for (const p of proposals)
          if (p.targetPillar === pillar && p.status === "pending") statuses.push("NEEDS_REVIEW");
        pillars[pillar] = pillarStatus(statuses);
      }
      return { entities, pillars };
    },

    /** Freeze a consistent set of versions for reports and branches. */
    async snapshot(startupId: string): Promise<SnapshotRecord> {
      const latest = await store.latestVersions(startupId);
      const snap: SnapshotRecord = {
        id: newId(),
        startupId,
        versionMap: Object.fromEntries(latest.map((v) => [v.logicalId, v.version])),
        createdAt: now(),
      };
      await store.insertSnapshot(snap);
      return snap;
    },

    /**
     * A downstream pillar suggests a change to an entity it doesn't own (§3.1
     * feedback rule). It waits, as "Needs review", for the founder.
     */
    async propose(
      input: Omit<ProposalRecord, "id" | "status" | "createdAt">,
    ): Promise<ProposalRecord> {
      assertOwner(input.targetPillar, input.entityType);
      validate(input.entityType, input.payload);
      const p: ProposalRecord = { ...input, id: newId(), status: "pending", createdAt: now() };
      await store.insertProposal(p);
      return p;
    },

    async proposals(startupId: string, targetPillar?: PillarId) {
      const all = await store.proposals(startupId);
      return targetPillar ? all.filter((p) => p.targetPillar === targetPillar) : all;
    },

    /** Accepting publishes through the owning pillar, so the single-writer rule still holds. */
    async acceptProposal(input: {
      startupId: string;
      proposalId: string;
      approval: FounderApproval;
      schemaVersion: string;
    }): Promise<TwinPublishResult> {
      const proposal = await store.getProposal(input.startupId, input.proposalId);
      if (!proposal || proposal.status !== "pending")
        throw new NotFoundError(`Pending proposal ${input.proposalId}`);
      await assertApproval(store, input.startupId, input.approval);
      const draft = await twin.saveDraft({
        startupId: input.startupId,
        pillar: proposal.targetPillar,
        type: proposal.entityType,
        logicalId: proposal.targetLogicalId,
        data: proposal.payload,
        evidenceLabel: "ASSUMED",
        createdBy: "SYSTEM",
        reviewState: "NEEDS_REVIEW",
        rationale: `Proposed by ${proposal.fromPillar}: ${proposal.reason}`,
        schemaVersion: input.schemaVersion,
      });
      const result = await twin.publish({
        startupId: input.startupId,
        draftId: draft.id,
        approval: input.approval,
      });
      await store.setProposalStatus(input.startupId, proposal.id, "accepted");
      return result;
    },

    async rejectProposal(input: {
      startupId: string;
      proposalId: string;
      approval: FounderApproval;
    }) {
      await assertApproval(store, input.startupId, input.approval);
      await store.setProposalStatus(input.startupId, input.proposalId, "rejected");
    },

    async assumptions(startupId: string) {
      return store.assumptions(startupId);
    },
  };
  return twin;
}

export type Twin = ReturnType<typeof createTwin>;

/** The entity types a pillar owns, for building pillar-scoped views. */
export function typesOwnedBy(pillar: PillarId): readonly PillarEntityType[] {
  return PILLAR_ENTITY_TYPES[pillar];
}
