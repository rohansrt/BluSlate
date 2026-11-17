/**
 * The module contract every pillar implements (spec §5.2).
 *
 * The supporting types below are the S2 placeholder shapes, enough for the
 * pillar skeletons to compile. S3 (shared core) defines them fully alongside
 * the Business Twin; changing them there is expected.
 */
import type { z } from "zod";
import type { EntityType, PillarEntityType } from "./entities";
import type { PillarId } from "./pillars";

/** What a pillar may know about the startup it runs for. Filled in by S3. */
export interface TwinContext {
  startupId: string;
}

export interface ValidationResult {
  ok: boolean;
  /** Required fields the founder hasn't given yet. */
  missing: string[];
  /** Fields the founder marked as unknown (tolerated, shown as gaps). */
  unknown: string[];
}

/** Unpublished work: AI and calculator output always lands here first. */
export interface Draft<O> {
  pillar: PillarId;
  payload: Partial<O>;
  createdBy: "founder" | "ai" | "import";
}

export interface ImpactPreview {
  affected: { type: EntityType; logicalId: string }[];
}

/** Proof that the founder approved a publish. Only a user session can create one. */
export interface FounderApproval {
  userId: string;
  approvedAt: string;
}

export interface PublishResult {
  versions: { logicalId: string; version: number }[];
}

export interface EntityChange {
  type: EntityType;
  logicalId: string;
  fromVersion: number | null;
  toVersion: number;
}

export interface StaleMark {
  logicalId: string;
  reason: string;
}

export interface PillarModule<I, O> {
  id: PillarId;
  /** Semver of this pillar's I/O schemas. */
  schemaVersion: string;
  inputSchema: z.ZodType<I>;
  outputSchema: z.ZodType<O>;
  /** Upstream types it may consume. Every one is optional (standalone mode). */
  reads: readonly EntityType[];
  /** Types only this pillar may publish. */
  writes: readonly PillarEntityType[];

  validateInput(input: Partial<I>, ctx: TwinContext): ValidationResult;
  /** AI + calculators. Never writes. */
  runAnalysis(input: I, ctx: TwinContext): Promise<Draft<O>>;
  previewPublish(draft: Draft<O>, ctx: TwinContext): Promise<ImpactPreview>;
  /** Requires a FounderApproval. */
  publish(draft: Draft<O>, approval: FounderApproval): Promise<PublishResult>;
  onUpstreamChanged(change: EntityChange, ctx: TwinContext): StaleMark[];
}

/** Thrown by skeleton methods until the pillar's Build step implements them. */
export class PillarNotBuiltError extends Error {
  constructor(
    readonly pillar: PillarId,
    readonly method: string,
  ) {
    super(
      `Pillar "${pillar}" has not implemented ${method} yet (it is a skeleton until its Build step).`,
    );
    this.name = "PillarNotBuiltError";
  }
}
