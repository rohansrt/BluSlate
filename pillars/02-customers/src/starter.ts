import type { PillarStarter } from "@bluslate/contracts";

/** The first question this pillar asks. The answer is published as a Segment. */
export const customersStarter: PillarStarter = {
  entityType: "Segment",
  field: "name",
  question: "Who has this problem? Name your first customer group.",
  hint: "Be specific: who they are and where to find them.",
  placeholder: "Second-year students living 3–8 km from campus",
  maxLength: 120,
};
