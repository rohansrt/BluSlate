import type { PillarStarter } from "@bluslate/contracts";

/** The first question this pillar asks. The answer is published as a Positioning. */
export const gtmStarter: PillarStarter = {
  entityType: "Positioning",
  field: "statement",
  question: "In one sentence, why would your first customers choose you?",
  hint: "Compare against what they use today.",
  placeholder:
    "For students far from campus, the only rental that's always charged and costs less than a daily bus pass",
  maxLength: 280,
};
