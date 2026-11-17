import type { PillarId } from "@/lib/pillars";

/** One short line per step for the Home cycle. Kept deliberately brief. */
export const STEP_BRIEFS: Record<PillarId, string> = {
  discover: "Turn a hunch into a clear problem, and list what you still need to prove.",
  customers:
    "Interview realistic customers and learn what they really need, and what they'd pay for.",
  market: "Size the opportunity with sourced numbers and map who else is out there.",
  build: "Pick the features that matter and shape the smallest first version worth testing.",
  setup: "Choose suppliers, partners and a team, and see what delivery really costs.",
  gtm: "Set your price and channels, and plan who buys first.",
  "run-grow": "Launch into a living market, change anything, and watch the effects unfold.",
};
