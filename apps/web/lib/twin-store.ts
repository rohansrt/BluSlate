import "server-only";
import type { PillarEntityType, PillarId } from "@bluslate/contracts";
import type {
  AssumptionRecord,
  DecisionEventRecord,
  DraftRecord,
  EntityVersion,
  ProposalRecord,
  SnapshotRecord,
  StaleMarkRecord,
  TwinStore,
} from "@bluslate/twin";
import { Prisma, type PrismaClient } from "@/lib/generated/prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;
type Json = Prisma.InputJsonValue;

const asJson = (v: unknown) => v as Json;

/**
 * Postgres implementation of the Twin's storage port. Append-only for history:
 * it never updates or deletes Entity, DecisionEvent or StaleMark rows.
 */
export class PrismaTwinStore implements TwinStore {
  constructor(
    private readonly db: Db,
    private readonly inTransaction = false,
  ) {}

  async transaction<T>(fn: (store: TwinStore) => Promise<T>): Promise<T> {
    if (this.inTransaction) return fn(this);
    return (this.db as PrismaClient).$transaction((tx) => fn(new PrismaTwinStore(tx, true)));
  }

  async isMember(startupId: string, userId: string) {
    return (await this.db.member.count({ where: { startupId, userId } })) > 0;
  }

  async insertVersion(v: EntityVersion) {
    await this.db.entity.create({
      data: {
        id: v.id,
        startupId: v.startupId,
        logicalId: v.logicalId,
        version: v.version,
        type: v.type,
        ownerPillar: v.ownerPillar,
        schemaVersion: v.schemaVersion,
        status: "APPROVED",
        evidenceLabel: v.evidenceLabel,
        confidence: v.confidence,
        data: asJson(v.data),
        effectiveFrom: v.effectiveFrom,
        createdBy: v.createdBy,
        createdAt: v.createdAt,
      },
    });
  }

  private toVersion(row: Prisma.EntityGetPayload<object>): EntityVersion {
    return {
      id: row.id,
      startupId: row.startupId,
      logicalId: row.logicalId,
      version: row.version,
      type: row.type as PillarEntityType,
      ownerPillar: row.ownerPillar as PillarId,
      schemaVersion: row.schemaVersion,
      evidenceLabel: row.evidenceLabel,
      confidence: row.confidence,
      data: row.data as Record<string, unknown>,
      effectiveFrom: row.effectiveFrom,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
    };
  }

  async versionsOf(startupId: string, logicalId: string) {
    const rows = await this.db.entity.findMany({
      where: { startupId, logicalId },
      orderBy: { version: "asc" },
    });
    return rows.map((r) => this.toVersion(r));
  }

  async latestVersions(startupId: string, types?: readonly PillarEntityType[]) {
    const rows = await this.db.entity.findMany({
      where: { startupId, ...(types ? { type: { in: [...types] } } : {}) },
      orderBy: [{ logicalId: "asc" }, { version: "desc" }],
      distinct: ["logicalId"],
    });
    return rows.map((r) => this.toVersion(r));
  }

  async insertDecisionEvent(e: DecisionEventRecord) {
    await this.db.decisionEvent.create({ data: e });
  }

  async decisionEvents(startupId: string) {
    return this.db.decisionEvent.findMany({ where: { startupId }, orderBy: { createdAt: "asc" } });
  }

  async insertDependencies(fromLogicalIds: string[], toLogicalId: string) {
    await this.db.dependency.createMany({
      data: fromLogicalIds.map((fromLogicalId) => ({ fromLogicalId, toLogicalId })),
      skipDuplicates: true,
    });
  }

  async dependentsOf(logicalId: string) {
    const rows = await this.db.dependency.findMany({ where: { fromLogicalId: logicalId } });
    return rows.map((r) => r.toLogicalId);
  }

  async insertStaleMarks(marks: StaleMarkRecord[]) {
    if (marks.length > 0) await this.db.staleMark.createMany({ data: marks });
  }

  async staleMarks(startupId: string) {
    return this.db.staleMark.findMany({ where: { startupId } });
  }

  private toDraft(row: Prisma.DraftGetPayload<object>): DraftRecord {
    return {
      id: row.id,
      startupId: row.startupId,
      pillar: row.pillar as PillarId,
      type: row.type as PillarEntityType,
      logicalId: row.logicalId,
      data: row.data as Record<string, unknown>,
      evidenceLabel: row.evidenceLabel,
      createdBy: row.createdBy,
      reviewState: row.reviewState === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : "DRAFT",
      basedOn: row.basedOn,
      rationale: row.rationale,
      schemaVersion: row.schemaVersion,
      updatedAt: row.updatedAt,
    };
  }

  async saveDraft(d: DraftRecord) {
    const data = {
      startupId: d.startupId,
      pillar: d.pillar,
      type: d.type,
      logicalId: d.logicalId,
      data: asJson(d.data),
      evidenceLabel: d.evidenceLabel,
      createdBy: d.createdBy,
      reviewState: d.reviewState,
      basedOn: d.basedOn,
      rationale: d.rationale,
      schemaVersion: d.schemaVersion,
    };
    await this.db.draft.upsert({
      where: { id: d.id },
      create: { id: d.id, ...data },
      update: data,
    });
  }

  async getDraft(startupId: string, draftId: string) {
    const row = await this.db.draft.findFirst({ where: { id: draftId, startupId } });
    return row ? this.toDraft(row) : null;
  }

  async drafts(startupId: string) {
    const rows = await this.db.draft.findMany({
      where: { startupId },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((r) => this.toDraft(r));
  }

  async deleteDraft(startupId: string, draftId: string) {
    await this.db.draft.deleteMany({ where: { id: draftId, startupId } });
  }

  private toProposal(row: Prisma.ProposalGetPayload<object>): ProposalRecord {
    return {
      id: row.id,
      startupId: row.startupId,
      fromPillar: row.fromPillar as PillarId,
      targetPillar: row.targetPillar as PillarId,
      entityType: row.entityType as PillarEntityType,
      targetLogicalId: row.targetLogicalId,
      payload: row.payload as Record<string, unknown>,
      reason: row.reason,
      status: row.status as ProposalRecord["status"],
      createdAt: row.createdAt,
    };
  }

  async insertProposal(p: ProposalRecord) {
    await this.db.proposal.create({ data: { ...p, payload: asJson(p.payload) } });
  }

  async getProposal(startupId: string, id: string) {
    const row = await this.db.proposal.findFirst({ where: { id, startupId } });
    return row ? this.toProposal(row) : null;
  }

  async setProposalStatus(startupId: string, id: string, status: ProposalRecord["status"]) {
    await this.db.proposal.updateMany({ where: { id, startupId }, data: { status } });
  }

  async proposals(startupId: string) {
    const rows = await this.db.proposal.findMany({
      where: { startupId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => this.toProposal(r));
  }

  async insertSnapshot(s: SnapshotRecord) {
    await this.db.snapshot.create({ data: { ...s, versionMap: asJson(s.versionMap) } });
  }

  async insertAssumption(a: AssumptionRecord) {
    await this.db.assumption.create({ data: { ...a, value: asJson(a.value) } });
  }

  async assumptions(startupId: string) {
    const rows = await this.db.assumption.findMany({
      where: { startupId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      startupId: r.startupId,
      entityLogicalId: r.entityLogicalId,
      field: r.field,
      value: r.value,
      label: r.label,
      confidence: r.confidence as AssumptionRecord["confidence"],
      sensitivity: r.sensitivity,
      status: r.status as AssumptionRecord["status"],
      aiSuggested: r.aiSuggested,
    }));
  }
}
