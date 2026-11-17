import type { PillarStarter } from "@bluslate/contracts";

/** The first question this pillar asks. The answer is published as a Competitor. */
export const marketStarter: PillarStarter = {
  entityType: "Competitor",
  field: "name",
  question: "What do people use today instead? Name one competitor or alternative.",
  hint: 'Include "do nothing" options, like walking or the bus.',
  placeholder: "City bus pass",
  maxLength: 120,
};
