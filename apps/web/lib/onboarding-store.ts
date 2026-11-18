"use client";

import type { OnboardingDraft } from "@/lib/onboarding";
import { clearDraft, loadDraft, saveDraft } from "@/lib/onboarding-draft";

/**
 * One onboarding draft for the whole page (docs/decisions/0011). Home shows
 * the onboarding card twice (the hero, and beside the seven-step circle after
 * Start or "Try this pillar"); both read and write this store, so answers
 * typed in either carry over. It is kept in local storage as before.
 *
 * Steps: 1 name · 2 where you're starting · 3 the details · 4 save (email
 * code, or as a guest). Signed-in founders skip steps 1 and 4.
 */

export type Step = 1 | 2 | 3 | 4;

export interface OnboardingState {
  draft: OnboardingDraft;
  step: Step;
}

let state: OnboardingState | null = null;
/** Whether `state` was set up for a signed-in founder. */
let stateSignedIn = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** The first step to show: signed-in founders start at 2 and never see 4. */
function clampStep(step: Step, signedIn: boolean): Step {
  if (signedIn) return step <= 2 ? 2 : 3;
  return step;
}

/**
 * Load the stored draft once per page. Later calls do nothing, unless the
 * visitor has signed in since (in-app navigation keeps this module alive):
 * then the steps are re-checked so a signed-in founder never sees step 1.
 */
export function initOnboarding(signedIn: boolean, knownName?: string | null) {
  if (state && stateSignedIn === signedIn) return;
  if (state) {
    const draft = { ...state.draft };
    if (!draft.firstName && knownName) draft.firstName = knownName;
    state = { draft, step: clampStep(state.step, signedIn) };
    stateSignedIn = signedIn;
    return;
  }
  stateSignedIn = signedIn;
  const stored = loadDraft() ?? {};
  const draft: OnboardingDraft = { newIdeaMode: "idea", ...stored };
  if (!draft.firstName && knownName) draft.firstName = knownName;
  const storedStep = (draft.step && draft.step >= 1 && draft.step <= 4 ? draft.step : 1) as Step;
  state = { draft, step: clampStep(storedStep, signedIn) };
}

export function subscribeOnboarding(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getOnboarding(): OnboardingState | null {
  return state;
}

export function setOnboarding(next: (current: OnboardingState) => OnboardingState) {
  if (!state) return;
  state = next(state);
  saveDraft({ ...state.draft, step: state.step });
  emit();
}

/**
 * Start (or restart) the journey from outside the card: the circle's Start
 * button, or "Try this pillar" with that pillar preselected as the one tool.
 */
export function presetOnboarding({
  signedIn,
  knownName,
  tool,
}: {
  signedIn: boolean;
  knownName?: string | null;
  tool?: string;
}) {
  initOnboarding(signedIn, knownName);
  setOnboarding(({ draft, step }) => {
    const nextDraft = tool ? { ...draft, path: "one-tool" as const, tool } : draft;
    const knowsYou = signedIn || Boolean(draft.firstName?.trim());
    let nextStep: Step = knowsYou ? 2 : 1;
    if (tool && knowsYou) nextStep = 3;
    if (!tool && step > nextStep) nextStep = clampStep(step, signedIn);
    return { draft: nextDraft, step: clampStep(nextStep, signedIn) };
  });
}

/** After the startup is saved. */
export function resetOnboarding() {
  clearDraft();
  state = null;
  stateSignedIn = false;
}
