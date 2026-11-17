/**
 * Entity types (spec §3, §8.2). Each pillar-owned type has exactly one owner
 * (the single-writer rule); shared types are written by shared systems.
 * Zod schemas for each entity arrive in S3 under entities/<pillar>.ts.
 */
import type { PillarId } from "./pillars";

export const PILLAR_ENTITY_TYPES = {
  discover: ["Problem", "Opportunity", "Hypothesis"],
  customers: ["Segment", "Persona", "Interview", "Insight", "Need"],
  market: ["MarketSize", "Competitor", "Benchmark"],
  build: ["Feature", "Offering", "ValueProposition", "RevenueModel"],
  setup: ["Process", "Enabler", "Commitment", "TeamRole", "CostItem", "Capacity"],
  gtm: ["Positioning", "PricePlan", "ChannelPlan", "Campaign", "LaunchPlan"],
  "run-grow": ["Scenario", "SimRun", "Period", "LeverChange", "MarketEvent", "KpiSeries"],
} as const satisfies Record<PillarId, readonly string[]>;

/** Shared records, not owned by any pillar (§3). */
export const SHARED_ENTITY_TYPES = [
  "Startup",
  "Source",
  "Assumption",
  "DecisionEvent",
  "Dependency",
  "Proposal",
  "Snapshot",
  "Report",
  "Comment",
] as const;

export type PillarEntityType = (typeof PILLAR_ENTITY_TYPES)[PillarId][number];
export type SharedEntityType = (typeof SHARED_ENTITY_TYPES)[number];
export type EntityType = PillarEntityType | SharedEntityType;

export const ALL_PILLAR_ENTITY_TYPES = Object.values(
  PILLAR_ENTITY_TYPES,
).flat() as PillarEntityType[];

/** The one pillar allowed to publish each pillar-owned type. */
export const ENTITY_OWNER = Object.fromEntries(
  (Object.entries(PILLAR_ENTITY_TYPES) as [PillarId, readonly PillarEntityType[]][]).flatMap(
    ([pillar, types]) => types.map((t) => [t, pillar]),
  ),
) as Record<PillarEntityType, PillarId>;

export function isPillarEntityType(value: string): value is PillarEntityType {
  return value in ENTITY_OWNER;
}

/** Evidence labels (§5.4). */
export const EVIDENCE_LABELS = [
  "ACTUAL",
  "FIELD",
  "SOURCED",
  "ASSUMED",
  "ESTIMATE",
  "SYNTHETIC",
] as const;
export type EvidenceLabel = (typeof EVIDENCE_LABELS)[number];

/** Entity statuses (§5.1). */
export const ENTITY_STATUSES = [
  "NOT_STARTED",
  "DRAFT",
  "NEEDS_REVIEW",
  "APPROVED",
  "MAY_BE_OUTDATED",
] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];
