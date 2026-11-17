import type { PillarStarter } from "@bluslate/contracts";

/** The first question this pillar asks. The answer is published as a Problem. */
export const discoverStarter: PillarStarter = {
  entityType: "Problem",
  field: "pain",
  question: "In one sentence, what problem do people have?",
  hint: "Describe the struggle, not your solution. Who has it, and what goes wrong?",
  placeholder: "Students who live a few km from campus lose time and money getting to class",
  maxLength: 280,
};
