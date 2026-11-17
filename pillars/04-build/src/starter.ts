import type { PillarStarter } from "@bluslate/contracts";

/** The first question this pillar asks. The answer is published as a Feature. */
export const buildStarter: PillarStarter = {
  entityType: "Feature",
  field: "name",
  question: "What's one thing your first version must do?",
  hint: "Pick the feature that answers the biggest need.",
  placeholder: "Book a charged bike near my hostel in under a minute",
  maxLength: 160,
};
