import type { EntityStatusView, PillarStatus, PillarStatusSummary } from "./types";

/**
 * Pure status rules (spec §5.1, §6.1).
 *
 * Entity: a pending AI/proposal draft → NEEDS_REVIEW; the founder's own draft →
 * DRAFT; an approved version with an open stale mark → MAY_BE_OUTDATED; an
 * approved version → APPROVED; nothing → NOT_STARTED. Review states win over
 * drafts, which win over the published state, so the founder sees what needs
 * attention first.
 */
export function entityStatus(input: {
  hasPublished: boolean;
  stale: boolean;
  draft: "DRAFT" | "NEEDS_REVIEW" | null;
}): EntityStatusView {
  if (input.draft === "NEEDS_REVIEW") return "NEEDS_REVIEW";
  if (input.draft === "DRAFT") return "DRAFT";
  if (input.hasPublished) return input.stale ? "MAY_BE_OUTDATED" : "APPROVED";
  return "NOT_STARTED";
}

/** Roll entity statuses up to a hub: needs a look › draft › approved › not started. */
export function pillarStatus(statuses: EntityStatusView[]): PillarStatusSummary {
  const count = (s: EntityStatusView) => statuses.filter((x) => x === s).length;
  const summary = {
    approved: count("APPROVED"),
    drafts: count("DRAFT"),
    needsReview: count("NEEDS_REVIEW"),
    outdated: count("MAY_BE_OUTDATED"),
  };
  let status: PillarStatus = "not_started";
  if (summary.needsReview + summary.outdated > 0) status = "needs_review";
  else if (summary.drafts > 0) status = "draft";
  else if (summary.approved > 0) status = "approved";
  return { status, ...summary };
}
