import type { OnboardingDraft } from "@/lib/onboarding";

/**
 * Keeps the onboarding draft in the visitor's browser until they sign in
 * (spec §6.0). Storage can be unavailable (private windows, blocked site
 * data), so every access is guarded and the card works without it.
 */
const KEY = "bluslate.onboarding.v1";

export function loadDraft(): OnboardingDraft | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" ? (value as OnboardingDraft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: OnboardingDraft): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage unavailable: the draft lives only in memory for this visit.
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
