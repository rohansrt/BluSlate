import type { PillarEntityType } from "@bluslate/contracts";
import type {
  AssumptionRecord,
  DecisionEventRecord,
  DraftRecord,
  EntityVersion,
  ProposalRecord,
  SnapshotRecord,
  StaleMarkRecord,
} from "./types";

/**
 * Storage port for the Twin. The Twin's rules live in this package; the app
 * provides a Postgres implementation (apps/web/lib/twin-store.ts) and tests use
 * the in-memory one. Append-only by design: there are no update or delete
 * methods for versions, decision events or stale marks.
 */
export interface TwinStore {
  /** Run `fn` atomically. */
  transaction<T>(fn: (store: TwinStore) => Promise<T>): Promise<T>;

  isMember(startupId: string, userId: string): Promise<boolean>;

  // Published history (append-only)
  insertVersion(v: EntityVersion): Promise<void>;
  /** Every version of one logical entity, oldest first. */
  versionsOf(startupId: string, logicalId: string): Promise<EntityVersion[]>;
  /** The newest version of each logical entity, optionally filtered by type. */
  latestVersions(startupId: string, types?: readonly PillarEntityType[]): Promise<EntityVersion[]>;
  insertDecisionEvent(e: DecisionEventRecord): Promise<void>;
  decisionEvents(startupId: string): Promise<DecisionEventRecord[]>;

  // Dependencies and staleness (append-only)
  insertDependencies(fromLogicalIds: string[], toLogicalId: string): Promise<void>;
  /** Logical ids of entities that were built from `logicalId`. */
  dependentsOf(logicalId: string): Promise<string[]>;
  insertStaleMarks(marks: StaleMarkRecord[]): Promise<void>;
  staleMarks(startupId: string): Promise<StaleMarkRecord[]>;

  // Drafts (a mutable workspace, not history)
  saveDraft(d: DraftRecord): Promise<void>;
  getDraft(startupId: string, draftId: string): Promise<DraftRecord | null>;
  drafts(startupId: string): Promise<DraftRecord[]>;
  deleteDraft(startupId: string, draftId: string): Promise<void>;

  // Proposals, snapshots, assumptions
  insertProposal(p: ProposalRecord): Promise<void>;
  getProposal(startupId: string, id: string): Promise<ProposalRecord | null>;
  setProposalStatus(startupId: string, id: string, status: ProposalRecord["status"]): Promise<void>;
  proposals(startupId: string): Promise<ProposalRecord[]>;
  insertSnapshot(s: SnapshotRecord): Promise<void>;
  insertAssumption(a: AssumptionRecord): Promise<void>;
  assumptions(startupId: string): Promise<AssumptionRecord[]>;
}
