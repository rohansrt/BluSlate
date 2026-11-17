import { z } from "zod";
import { ALL_PILLAR_ENTITY_TYPES, PILLAR_IDS } from "@bluslate/contracts";
import { defineTask } from "../task";

/**
 * "Guide me" for any question (spec §5.3, Appendix A.0 `<pillar>.explain`):
 * explain the idea in two or three lines with an example, then ask two to
 * four questions. The founder still decides; nothing here is a fact.
 */
export const explainTask = defineTask({
  id: "core.explain",
  pillar: "core",
  tier: "fast",
  promptVersion: "1.0.0",
  system: [
    "Task: help a founder answer one question in BluSlate by guiding, not deciding.",
    "- `concept`: explain the idea behind the question in 2-3 short sentences.",
    "- `example`: one short, clearly fictional example (start it with 'For example,').",
    "- `questions`: 2-4 questions the founder can answer from their own knowledge. Ask about",
    "  past behaviour and what they have seen, not hypotheticals.",
    "Never answer the question for them, never give statistics, and never name real companies.",
  ].join("\n"),
  context: ALL_PILLAR_ENTITY_TYPES,
  input: z.object({
    pillar: z.enum(PILLAR_IDS),
    question: z.string().min(3).max(300),
    answerSoFar: z.string().max(2000).optional(),
  }),
  output: z.object({
    concept: z.string(),
    example: z.string(),
    questions: z.array(z.string()),
  }),
  check: (items) => {
    const problems: string[] = [];
    if (items.questions.length < 2 || items.questions.length > 4)
      problems.push("ask 2 to 4 questions");
    if (items.concept.length > 600) problems.push("keep the explanation short");
    if (items.questions.some((q) => q.length > 240)) problems.push("keep each question short");
    return problems;
  },
  defaultLabel: "ASSUMED",
  maxTokens: 2000,
  effort: "low",
});

export const CORE_TASKS = [explainTask] as const;
