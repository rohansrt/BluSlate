"use client";

import { useSyncExternalStore } from "react";

/**
 * The last email used on this device (sign-in code or guest form), so
 * returning founders don't retype it. Local storage only; it signs nobody in.
 */
const EMAIL_KEY = "bluslate.last-email";

function readRememberedEmail(): string {
  try {
    return localStorage.getItem(EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function rememberEmail(email: string) {
  try {
    localStorage.setItem(EMAIL_KEY, email);
  } catch {
    // Private windows may block storage; the email is only a convenience.
  }
}

const noopSubscribe = () => () => {};

/** "" on the server and before hydration, then the stored email. */
export function useRememberedEmail(): string {
  return useSyncExternalStore(noopSubscribe, readRememberedEmail, () => "");
}
