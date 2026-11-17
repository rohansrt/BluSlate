import type { PillarStatus } from "@bluslate/twin";

/** How a hub's status looks (spec §6.1: approved · draft · needs a look · not started). */
export const PILLAR_STATUS_INFO: Record<
  PillarStatus,
  { label: string; dot: string; badge: "neutral" | "founder" | "review" | "actual" }
> = {
  not_started: { label: "Not started", dot: "border border-muted-foreground/50", badge: "neutral" },
  draft: { label: "Draft", dot: "bg-ai", badge: "neutral" },
  needs_review: { label: "Needs a look", dot: "bg-review", badge: "review" },
  approved: { label: "Approved", dot: "bg-actual", badge: "actual" },
};
