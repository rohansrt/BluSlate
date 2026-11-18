"use client";

import type { ClientEvent, EventName } from "@/lib/analytics/events";

/**
 * Sends product events to /api/events (docs/decisions/0011). No cookies:
 * a random visitor ID lives in local storage and a session ID in session
 * storage. Nothing is sent once someone says they are under 18.
 */

const VISITOR_KEY = "bluslate.vid";
const SESSION_KEY = "bluslate.sid";
const UTM_KEY = "bluslate.utm";
const NO_TRACK_KEY = "bluslate.no-track";

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

function stored(storage: () => Storage, key: string): string {
  try {
    const s = storage();
    let value = s.getItem(key);
    if (!value) {
      value = randomId();
      s.setItem(key, value);
    }
    return value;
  } catch {
    // Storage blocked: a fresh ID per page load keeps counts roughly right.
    return randomId();
  }
}

/** Stop (or allow) tracking in this browser, e.g. after an under-18 age is given. */
export function setNoTrack(on: boolean) {
  try {
    if (on) localStorage.setItem(NO_TRACK_KEY, "1");
    else localStorage.removeItem(NO_TRACK_KEY);
  } catch {
    // Nothing to do.
  }
}

function noTrack(): boolean {
  try {
    // navigator.webdriver: automated browsers (our own tests, scrapers) are not visitors.
    return (
      navigator.webdriver === true ||
      localStorage.getItem(NO_TRACK_KEY) === "1" ||
      navigator.doNotTrack === "1"
    );
  } catch {
    return false;
  }
}

/** UTM tags from the landing URL, kept for the rest of the visit. */
function utm(): Pick<ClientEvent, "utmSource" | "utmMedium" | "utmCampaign"> {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("utm_source")) {
      const value = {
        utmSource: params.get("utm_source")?.slice(0, 100) || undefined,
        utmMedium: params.get("utm_medium")?.slice(0, 100) || undefined,
        utmCampaign: params.get("utm_campaign")?.slice(0, 100) || undefined,
      };
      sessionStorage.setItem(UTM_KEY, JSON.stringify(value));
      return value;
    }
    return JSON.parse(sessionStorage.getItem(UTM_KEY) ?? "{}") as ReturnType<typeof utm>;
  } catch {
    return {};
  }
}

export function track(name: EventName, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined" || noTrack()) return;
  const event: ClientEvent = {
    name,
    visitorId: stored(() => localStorage, VISITOR_KEY),
    sessionId: stored(() => sessionStorage, SESSION_KEY),
    path: window.location.pathname,
    referrer: document.referrer || undefined,
    ...utm(),
    props,
  };
  const body = JSON.stringify({ events: [event] });
  try {
    const sent = navigator.sendBeacon?.(
      "/api/events",
      new Blob([body], { type: "application/json" }),
    );
    if (sent) return;
  } catch {
    // Fall back to fetch below.
  }
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
