import type { PillarEntityType } from "@bluslate/contracts";
import type { TwinStore } from "./store";
import type {
  AssumptionRecord,
  DecisionEventRecord,
  DraftRecord,
  EntityVersion,
  ProposalRecord,
  SnapshotRecord,
  StaleMarkRecord,
} from "./types";

/** An in-memory TwinStore for tests and fixtures. Not for production use. */
export class InMemoryTwinStore implements TwinStore {
  readonly versions: EntityVersion[] = [];
  readonly events: DecisionEventRecord[] = [];
  readonly dependencies: { from: string; to: string }[] = [];
  readonly marks: StaleMarkRecord[] = [];
  readonly draftRows = new Map<string, DraftRecord>();
  readonly proposalRows = new Map<string, ProposalRecord>();
  readonly snapshots: SnapshotRecord[] = [];
  readonly assumptionRows: AssumptionRecord[] = [];
  private readonly members = new Set<string>();

  addMember(startupId: string, userId: string) {
    this.members.add(`${startupId}:${userId}`);
    return this;
  }

  async transaction<T>(fn: (store: TwinStore) => Promise<T>): Promise<T> {
    // Snapshot-and-restore gives tests real rollback on failure.
    const before = {
      versions: this.versions.length,
      events: this.events.length,
      dependencies: this.dependencies.length,
      marks: this.marks.length,
      snapshots: this.snapshots.length,
      assumptions: this.assumptionRows.length,
      drafts: new Map(this.draftRows),
      proposals: new Map([...this.proposalRows].map(([k, v]) => [k, { ...v }])),
    };
    try {
      return await fn(this);
    } catch (err) {
      this.versions.length = before.versions;
      this.events.length = before.events;
      this.dependencies.length = before.dependencies;
      this.marks.length = before.marks;
      this.snapshots.length = before.snapshots;
      this.assumptionRows.length = before.assumptions;
      this.draftRows.clear();
      before.drafts.forEach((v, k) => this.draftRows.set(k, v));
      this.proposalRows.clear();
      before.proposals.forEach((v, k) => this.proposalRows.set(k, v));
      throw err;
    }
  }

  async isMember(startupId: string, userId: string) {
    return this.members.has(`${startupId}:${userId}`);
  }

  async insertVersion(v: EntityVersion) {
    if (this.versions.some((x) => x.logicalId === v.logicalId && x.version === v.version)) {
      throw new Error(`Duplicate version ${v.logicalId}@${v.version}`);
    }
    this.versions.push(structuredClone(v));
  }

  async versionsOf(startupId: string, logicalId: string) {
    return this.versions
      .filter((v) => v.startupId === startupId && v.logicalId === logicalId)
      .sort((a, b) => a.version - b.version)
      .map((v) => structuredClone(v));
  }

  async latestVersions(startupId: string, types?: readonly PillarEntityType[]) {
    const latest = new Map<string, EntityVersion>();
    for (const v of this.versions) {
      if (v.startupId !== startupId) continue;
      if (types && !types.includes(v.type)) continue;
      const cur = latest.get(v.logicalId);
      if (!cur || v.version > cur.version) latest.set(v.logicalId, v);
    }
    return [...latest.values()].map((v) => structuredClone(v));
  }

  async insertDecisionEvent(e: DecisionEventRecord) {
    this.events.push(structuredClone(e));
  }

  async decisionEvents(startupId: string) {
    return this.events.filter((e) => e.startupId === startupId).map((e) => structuredClone(e));
  }

  async insertDependencies(fromLogicalIds: string[], toLogicalId: string) {
    for (const from of fromLogicalIds) {
      if (!this.dependencies.some((d) => d.from === from && d.to === toLogicalId)) {
        this.dependencies.push({ from, to: toLogicalId });
      }
    }
  }

  async dependentsOf(logicalId: string) {
    return this.dependencies.filter((d) => d.from === logicalId).map((d) => d.to);
  }

  async insertStaleMarks(marks: StaleMarkRecord[]) {
    this.marks.push(...marks.map((m) => structuredClone(m)));
  }

  async staleMarks(startupId: string) {
    return this.marks.filter((m) => m.startupId === startupId).map((m) => structuredClone(m));
  }

  async saveDraft(d: DraftRecord) {
    this.draftRows.set(d.id, structuredClone(d));
  }

  async getDraft(startupId: string, draftId: string) {
    const d = this.draftRows.get(draftId);
    return d && d.startupId === startupId ? structuredClone(d) : null;
  }

  async drafts(startupId: string) {
    return [...this.draftRows.values()]
      .filter((d) => d.startupId === startupId)
      .map((d) => structuredClone(d));
  }

  async deleteDraft(startupId: string, draftId: string) {
    const d = this.draftRows.get(draftId);
    if (d && d.startupId === startupId) this.draftRows.delete(draftId);
  }

  async insertProposal(p: ProposalRecord) {
    this.proposalRows.set(p.id, structuredClone(p));
  }

  async getProposal(startupId: string, id: string) {
    const p = this.proposalRows.get(id);
    return p && p.startupId === startupId ? structuredClone(p) : null;
  }

  async setProposalStatus(startupId: string, id: string, status: ProposalRecord["status"]) {
    const p = this.proposalRows.get(id);
    if (p && p.startupId === startupId) p.status = status;
  }

  async proposals(startupId: string) {
    return [...this.proposalRows.values()]
      .filter((p) => p.startupId === startupId)
      .map((p) => structuredClone(p));
  }

  async insertSnapshot(s: SnapshotRecord) {
    this.snapshots.push(structuredClone(s));
  }

  async insertAssumption(a: AssumptionRecord) {
    this.assumptionRows.push(structuredClone(a));
  }

  async assumptions(startupId: string) {
    return this.assumptionRows
      .filter((a) => a.startupId === startupId)
      .map((a) => structuredClone(a));
  }
}
