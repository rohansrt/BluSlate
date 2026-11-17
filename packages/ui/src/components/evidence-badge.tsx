import * as React from "react";
import type { EvidenceLabel } from "@bluslate/contracts";
import { Badge, type BadgeProps } from "./badge";

/** What each evidence label means (spec §5.4), shown as the badge's tooltip. */
export const EVIDENCE_LABEL_INFO: Record<
  EvidenceLabel,
  { variant: NonNullable<BadgeProps["variant"]>; meaning: string }
> = {
  ACTUAL: { variant: "actual", meaning: "Real data imported from a running business. Locked." },
  FIELD: { variant: "founder", meaning: "Real interviews, surveys or trials, with consent." },
  SOURCED: { variant: "founder", meaning: "A public fact, with its source and date." },
  ASSUMED: { variant: "neutral", meaning: "Your assumption. A guess to test." },
  ESTIMATE: { variant: "review", meaning: "Worked out from inputs, with a formula and range." },
  SYNTHETIC: {
    variant: "synthetic",
    meaning: "Simulated. For practice and what-ifs only, never proof.",
  },
};

/** Every number and claim shows one of these (CLAUDE.md UI rules). */
export function EvidenceBadge({ label, className }: { label: EvidenceLabel; className?: string }) {
  const info = EVIDENCE_LABEL_INFO[label];
  return (
    <Badge variant={info.variant} className={className} title={info.meaning} data-evidence={label}>
      {label}
    </Badge>
  );
}
