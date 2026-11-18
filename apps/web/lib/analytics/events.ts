import { z } from "zod";

/**
 * First-party product analytics (docs/decisions/0011): the events BluSlate
 * records, and how they are cleaned up. Pure, so it can be unit-tested and
 * used on both sides. Events never carry what founders type (ideas, answers,
 * emails); `props` holds only small labels such as a step number or pillar id.
 */

export const EVENT_NAMES = [
  // Visiting
  "page_view",
  "demo_play",
  // The seven-step circle on Home and About
  "circle_view",
  "circle_try",
  "circle_start",
  // Onboarding and sign-in
  "onboarding_step",
  "onboarding_path",
  "code_requested",
  "code_failed",
  "code_verified",
  "guest_started",
  "profile_completed",
  "startup_created",
  // Product use (pillar_published is recorded on the server)
  "pillar_published",
  // Account pages
  "idea_saved",
  "friend_request_sent",
  "friend_request_answered",
  "consult_requested",
  "feedback_sent",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

const propValue = z.union([z.string().max(80), z.number().finite(), z.boolean()]);

export const clientEventSchema = z.object({
  name: z.enum(EVENT_NAMES),
  visitorId: z.string().regex(/^[a-z0-9-]{8,64}$/i),
  sessionId: z.string().regex(/^[a-z0-9-]{8,64}$/i),
  path: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  props: z
    .record(z.string().max(40), propValue)
    .refine((p) => Object.keys(p).length <= 8, "Too many props")
    .optional(),
});

export const eventBatchSchema = z.object({
  events: z.array(clientEventSchema).min(1).max(20),
});

export type ClientEvent = z.infer<typeof clientEventSchema>;

/** Crawlers, previews and headless tools are not visitors. */
const BOT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|python|curl|wget|axios|node-fetch/i;

export function isBot(userAgent: string | null | undefined): boolean {
  return !userAgent || BOT.test(userAgent);
}

export interface DeviceInfo {
  device: "mobile" | "tablet" | "desktop";
  browser: string;
  os: string;
}

/** A coarse reading of the user agent. The user agent itself is not stored. */
export function parseUserAgent(ua: string): DeviceInfo {
  const tablet = /ipad|tablet|(android(?!.*mobile))/i.test(ua);
  const mobile = !tablet && /mobi|iphone|ipod|android/i.test(ua);
  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /opr\/|opera/i.test(ua)
      ? "Opera"
      : /samsungbrowser/i.test(ua)
        ? "Samsung Internet"
        : /chrome|crios/i.test(ua)
          ? "Chrome"
          : /firefox|fxios/i.test(ua)
            ? "Firefox"
            : /safari/i.test(ua)
              ? "Safari"
              : "Other";
  const os = /windows/i.test(ua)
    ? "Windows"
    : /iphone|ipad|ipod/i.test(ua)
      ? "iOS"
      : /android/i.test(ua)
        ? "Android"
        : /mac os x|macintosh/i.test(ua)
          ? "macOS"
          : /linux/i.test(ua)
            ? "Linux"
            : "Other";
  return { device: tablet ? "tablet" : mobile ? "mobile" : "desktop", browser, os };
}

/** Keep only the referring site, and drop our own domain (internal navigation). */
export function referrerHost(referrer: string | undefined, ownHost: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host && host !== ownHost.replace(/^www\./, "") ? host : null;
  } catch {
    return null;
  }
}

/** Paths are stored without query strings or ids, so they can't identify anyone. */
export function cleanPath(path: string | undefined): string | null {
  if (!path) return null;
  const bare = path.split(/[?#]/)[0] ?? "";
  return bare.replace(/\/startups\/(?!new\b)[a-z0-9]+/i, "/startups/[id]").slice(0, 200) || "/";
}

/** People who told us they are under 18 are never tracked (DPDP Act s. 9(3)). */
export function mayTrack(age: number | null | undefined): boolean {
  return age == null || age >= 18;
}

/** Age in whole years, as asked at sign-up. All ages may use BluSlate. */
export const ageSchema = z.coerce.number().int().min(5).max(110);
