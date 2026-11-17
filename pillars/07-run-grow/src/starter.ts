import type { PillarStarter } from "@bluslate/contracts";

/** The first question this pillar asks. The answer is published as a Scenario. */
export const runGrowStarter: PillarStarter = {
  entityType: "Scenario",
  field: "name",
  question: "Name the first what-if you want to test.",
  hint: "A change you might make once you've launched.",
  placeholder: "What if we cut the monthly price by 20%?",
  maxLength: 160,
};
