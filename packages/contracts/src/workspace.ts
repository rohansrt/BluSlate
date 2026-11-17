import type { z } from "zod";
import type { EvidenceLabel, PillarEntityType } from "./entity-types";
import type { PillarId } from "./pillars";

/**
 * Pillar workspaces (decision 0006, v1 of every pillar).
 *
 * A workspace is the founder's working state for one pillar: structured inputs,
 * saved as they go. It is not Twin history. Publishing turns it, with the
 * founder's approval, into the entities the pillar owns. Each pillar defines its
 * own workspace in `pillars/<NN-id>/src/workspace.ts`; the app only wires them.
 */

/** What every pillar knows about the startup, even when used alone. */
export interface StartupContext {
  name: string;
  /** "City, CC" as typed at onboarding. */
  geography: string;
  currency: string;
  /** The onboarding idea or interest area, if any. */
  idea?: string;
}

/** Approved upstream entities (only the types the pillar reads), newest version each. */
export type UpstreamData = Partial<Record<PillarEntityType, Record<string, unknown>[]>>;

export interface WorkspaceContext {
  startup: StartupContext;
  upstream: UpstreamData;
}

/** One live goal in the right-hand column. `value` is null until it can be calculated. */
export interface Goal {
  id: string;
  title: string;
  value: string | null;
  /** Shown under the value: the formula, the target or what's still missing. */
  detail?: string;
  evidence?: EvidenceLabel;
  /** True once a target is met (shows a tick). */
  done?: boolean;
}

/** The pillar's "Report out" block, reused by the Founder Pack. */
export interface ReportBlock {
  headline: string | null;
  lines: { label: string; value: string; evidence?: EvidenceLabel }[];
}

/** An entity the workspace will publish. `key` stays stable across edits. */
export interface WorkspaceEntity {
  key: string;
  type: PillarEntityType;
  title: string;
  data: Record<string, unknown>;
  evidenceLabel: EvidenceLabel;
}

export interface PillarWorkspaceDef<S> {
  pillar: PillarId;
  schema: z.ZodType<S>;
  /** AI helpers this pillar will offer. Shown as placeholders until AI is switched on. */
  aiHelpers: string[];
  /** A fresh workspace, pre-filled from upstream data when there is any. */
  initial(ctx: WorkspaceContext): S;
  goals(state: S, ctx: WorkspaceContext): Goal[];
  report(state: S, ctx: WorkspaceContext): ReportBlock;
  entities(state: S, ctx: WorkspaceContext): WorkspaceEntity[];
}

/** Props every pillar screen receives from the app's workbench. */
export interface PillarScreenProps<S> {
  state: S;
  update: (fn: (s: S) => S) => void;
  ctx: WorkspaceContext;
}
