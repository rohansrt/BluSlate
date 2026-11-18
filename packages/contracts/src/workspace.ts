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

/**
 * One live goal in the right-hand column (decision 0012). `value` is null until
 * it can be calculated. Every goal says plainly when it is complete (`done`):
 * a pillar is "empty" with no goals met, "partial" with some, and "complete"
 * when all are met. The left step list and the Passport stamps use the same rule.
 */
export interface Goal {
  id: string;
  title: string;
  value: string | null;
  /** Shown under the value: the formula, the target or what's still missing. */
  detail?: string;
  evidence?: EvidenceLabel;
  /** True once the goal is complete (shows a green tick). */
  done: boolean;
}

export type ProgressState = "empty" | "partial" | "complete";

export interface GoalProgress {
  met: number;
  total: number;
  state: ProgressState;
}

/** How far a pillar is: none, some or all of its goals met. */
export function goalProgress(goals: readonly Goal[]): GoalProgress {
  const met = goals.filter((g) => g.done).length;
  const total = goals.length;
  const state: ProgressState = met === 0 ? "empty" : met === total ? "complete" : "partial";
  return { met, total, state };
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

/**
 * Facts more than one step asks about (decision 0012). Each fact is answered
 * once and copied into the linked fields of other steps, so the founder never
 * types the same thing twice. A pillar `read`s the facts it is a source of and
 * `write`s the facts it takes in; pillars still never import each other.
 */
export interface SharedFacts {
  /** The problem, in the founder's words. */
  problem?: string;
  /** The main customer segment. */
  segment?: string;
  /** Today's alternatives / competitors, by name. */
  alternatives?: string[];
  /** Customer needs, by statement. */
  needs?: string[];
  /** The top-ranked need. */
  topNeed?: string;
  /** What one customer is worth a year (from willingness to pay). */
  yearlyValue?: number;
  /** Customers you could win (SOM, in people). */
  marketCustomers?: number;
  /** Positioning: the product category, the main benefit, and what it's unlike. */
  category?: string;
  benefit?: string;
  alternative?: string;
  /** Pricing and costs, per unit / per month. */
  price?: number;
  variableCost?: number;
  fixedMonthly?: number;
  marketingBudget?: number;
  cac?: number;
}

export interface SharedLinks<S> {
  /** The facts this pillar is the source of. Leave a fact out while it's unknown. */
  read(state: S, ctx: WorkspaceContext): SharedFacts;
  /** Take in facts that changed elsewhere. `prev` is what the source said before. */
  write?(state: S, next: SharedFacts, prev: SharedFacts): S;
}

function isBlank(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

/**
 * A linked field follows its source while it is empty or still says what the
 * source said before. Once the founder changes it, it is theirs.
 */
export function follow<T>(current: T, next: T | undefined, prev: T | undefined): T {
  if (next === undefined) return current;
  return isBlank(current) || current === prev ? next : current;
}

/**
 * A linked list gains the items the source added and loses the ones it
 * removed; items added here stay. Compared case-insensitively.
 */
export function followList(
  current: readonly string[],
  next: readonly string[] | undefined,
  prev: readonly string[] | undefined,
): string[] {
  if (!next) return [...current];
  const key = (x: string) => x.trim().toLowerCase();
  const removed = new Set((prev ?? []).map(key).filter((k) => !next.map(key).includes(k)));
  const kept = current.filter((x) => !removed.has(key(x)));
  const have = new Set(kept.map(key));
  return [...kept, ...next.filter((x) => x.trim() && !have.has(key(x)))];
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
  /** Facts shared with other steps (decision 0012). */
  shared?: SharedLinks<S>;
}

/** Props every pillar screen receives from the app's workbench. */
export interface PillarScreenProps<S> {
  state: S;
  update: (fn: (s: S) => S) => void;
  ctx: WorkspaceContext;
}
