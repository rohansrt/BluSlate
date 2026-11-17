import type { z } from "zod";
import type { EntityType, EvidenceLabel, PillarId } from "@bluslate/contracts";
import type { Tier } from "./registry";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

/** An AI task, registered once (Appendix A.0). */
export interface AiTask<I = unknown, O extends z.ZodTypeAny = z.ZodTypeAny> {
  id: string;
  pillar: PillarId | "core";
  tier: Tier;
  promptVersion: string;
  /** The task's own instructions, appended to the base system prompt. */
  system: string;
  /** Twin entity types the context builder may include. */
  context: readonly EntityType[];
  /** Shape of the input the caller passes (validated before the call). */
  input: z.ZodType<I>;
  /** The task-specific payload inside the common envelope. */
  output: O;
  /** Bounds the API schema can't express; return problems, or [] if fine. */
  check?: (items: z.infer<O>) => string[];
  /**
   * Narrative tasks write prose around numbers they were given; the gateway
   * rejects any number in the output that isn't in the input (G3).
   */
  narrative?: boolean;
  /** The label for the output unless it cites sources (then SOURCED). */
  defaultLabel: EvidenceLabel;
  maxTokens: number;
  effort?: Effort;
}

export function defineTask<I, O extends z.ZodTypeAny>(task: AiTask<I, O>): AiTask<I, O> {
  return task;
}
