import { z } from "zod";

/**
 * The feedback form (docs/decisions/0011): five quick questions and an
 * optional note. Labels live here so the form and the admin summary match.
 */

export const WORKS_WELL = [
  ["journey", "The seven-step journey"],
  ["goals", "Live goals and numbers"],
  ["pack", "The Founder Pack report"],
  ["easy", "Easy to use"],
  ["design", "Design and look"],
  ["ideas", "The Idea Book"],
] as const;

export const NEEDS_WORK = [
  ["guidance", "Explanations and guidance"],
  ["length", "Too many questions"],
  ["numbers", "Numbers I don't understand"],
  ["phone", "Using it on a phone"],
  ["speed", "Speed"],
  ["signin", "Signing in"],
] as const;

export const USEFULNESS = [
  ["very", "Very useful"],
  ["somewhat", "Somewhat useful"],
  ["not-yet", "Not useful yet"],
  ["too-early", "Too early to say"],
] as const;

export const WANT_NEXT = [
  ["ai", "AI help in each step"],
  ["investors", "Investors and incubators to contact"],
  ["simulation", "A market simulation over time"],
  ["deck", "A pitch deck export"],
  ["friends", "Working on a startup with friends"],
  ["consultant", "Talking to a real consultant"],
] as const;

const ids = <T extends readonly (readonly [string, string])[]>(list: T) =>
  list.map(([id]) => id) as [T[number][0], ...T[number][0][]];

export const feedbackSchema = z.object({
  worksWell: z.array(z.enum(ids(WORKS_WELL))).max(WORKS_WELL.length),
  needsWork: z.array(z.enum(ids(NEEDS_WORK))).max(NEEDS_WORK.length),
  usefulness: z.enum(ids(USEFULNESS)).optional(),
  wantNext: z.array(z.enum(ids(WANT_NEXT))).max(WANT_NEXT.length),
  recommend: z.number().int().min(0).max(10).optional(),
  comment: z.string().trim().max(2000).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

/** Net Promoter Score from 0–10 answers: % promoters (9–10) minus % detractors (0–6). */
export function nps(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

export function labelFor(list: readonly (readonly [string, string])[], id: string): string {
  return list.find(([key]) => key === id)?.[1] ?? id;
}
