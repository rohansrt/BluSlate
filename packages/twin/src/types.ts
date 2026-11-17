import type { EvidenceLabel, PillarEntityType, PillarId } from "@bluslate/contracts";

/** Who created a record (spec §5.1 `createdBy`). */
export type Actor = "FOUNDER" | "AI" | "IMPORT" | "SYSTEM";

/** One published, immutable version of an entity (spec §5.1). */
export interface EntityVersion {
  id: string;
  startupId: string;
  logicalId: string;
  version: number;
  type: PillarEntityType;
  ownerPillar: PillarId;
  schemaVersion: string;
  evidenceLabel: EvidenceLabel;
  confidence: number | null;
  data: Record<string, unknown>;
  effectiveFrom: Date | null;
  createdBy: Actor;
  createdAt: Date;
}

/**
 * Unpublished work. Drafts are a workspace, not Twin history: they can be
 * edited or discarded, and only `publish` turns one into a version.
 */
export interface DraftRecord {
  id: string;
  startupId: string;
  pillar: PillarId;
  type: PillarEntityType;
  /** Set when the draft edits an existing entity; null for a new one. */
  logicalId: string | null;
  data: Record<string, unknown>;
  evidenceLabel: EvidenceLabel;
  createdBy: Actor;
  /** NEEDS_REVIEW for AI output and proposals; DRAFT for the founder's own edits. */
  reviewState: "DRAFT" | "NEEDS_REVIEW";
  /** Upstream entities this draft was built from (become Dependencies on publish). */
  basedOn: string[];
  rationale: string | null;
  /** The owning pillar's schema version when the draft was made. */
  schemaVersion: string;
  updatedAt: Date;
}

export interface DecisionEventRecord {
  id: string;
  startupId: string;
  scenarioId: string | null;
  entityLogicalId: string;
  fromVersion: number | null;
  toVersion: number;
  actorId: string;
  rationale: string | null;
  effectiveAt: Date | null;
  createdAt: Date;
}

/** "May be outdated": an upstream entity changed after this version was approved. */
export interface StaleMarkRecord {
  id: string;
  startupId: string;
  logicalId: string;
  /** The version that is outdated. Publishing a newer version clears the mark. */
  version: number;
  causedByLogicalId: string;
  reason: string;
  createdAt: Date;
}

export interface ProposalRecord {
  id: string;
  startupId: string;
  fromPillar: PillarId;
  targetPillar: PillarId;
  entityType: PillarEntityType;
  /** The logical entity to change, or null to propose a new one. */
  targetLogicalId: string | null;
  payload: Record<string, unknown>;
  reason: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

export interface SnapshotRecord {
  id: string;
  startupId: string;
  /** logicalId -> version */
  versionMap: Record<string, number>;
  createdAt: Date;
}

export interface AssumptionRecord {
  id: string;
  startupId: string;
  entityLogicalId: string;
  field: string;
  value: unknown;
  label: EvidenceLabel;
  confidence: "low" | "medium" | "high";
  sensitivity: number | null;
  status: "untested" | "tested" | "invalidated";
  aiSuggested: boolean;
}

/** The status of one entity as founders see it (spec §5.1). */
export type EntityStatusView =
  "NOT_STARTED" | "DRAFT" | "NEEDS_REVIEW" | "APPROVED" | "MAY_BE_OUTDATED";

/** A pillar's hub status (spec §6.1 left rail: approved · draft · needs a look · not started). */
export type PillarStatus = "not_started" | "draft" | "needs_review" | "approved";

export interface PillarStatusSummary {
  status: PillarStatus;
  approved: number;
  drafts: number;
  needsReview: number;
  outdated: number;
}
