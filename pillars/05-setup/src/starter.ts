import type { PillarStarter } from "@bluslate/contracts";

/** The first question this pillar asks. The answer is published as a TeamRole. */
export const setupStarter: PillarStarter = {
  entityType: "TeamRole",
  field: "title",
  question: "Who does the work? Name the first role you need.",
  hint: "It can be you. Say what the role is for.",
  placeholder: "Fleet and maintenance lead",
  maxLength: 120,
};
