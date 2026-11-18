import { createHash, randomInt } from "node:crypto";

/**
 * Sign-in codes (docs/decisions/0009). Auth.js's email provider sends a
 * 6-digit code instead of a long link token. Auth.js stores only
 * sha256(code + AUTH_SECRET), and the code is verified through its normal
 * email callback, so sessions, tenant checks and the legacy-guest merge work
 * unchanged. These helpers are pure so they can be unit-tested; the database
 * checks live in lib/sign-in-code-check.ts.
 */

export const CODE_LENGTH = 6;
/** How long a code works. */
export const CODE_MINUTES = 10;

/** Wrong codes allowed per email before its codes are cancelled. */
export const MAX_WRONG_CODES = 5;
export const WRONG_CODE_WINDOW_MS = 15 * 60 * 1000;

/** Codes an email may request: per hour and per day. Per IP: per 15 minutes (production). */
export const SEND_LIMITS = {
  emailPerHour: 5,
  emailPerDay: 10,
  ipPer15Min: 30,
} as const;

/** A uniformly random 6-digit code, with leading zeros kept. */
export function generateCode(): string {
  return randomInt(0, 10 ** CODE_LENGTH)
    .toString()
    .padStart(CODE_LENGTH, "0");
}

/** Accept "123 456" or "123-456" as typed or pasted; null unless it's exactly six digits. */
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/[\s-]/g, "");
  return /^\d{6}$/.test(digits) ? digits : null;
}

/** Emails are stored lower-case and trimmed, as Auth.js's default normalizer does. */
export function normalizeEmail(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}

/** The hash Auth.js stores in VerificationToken.token (see @auth/core send-token.js). */
export function hashCode(code: string, secret: string): string {
  return createHash("sha256").update(`${code}${secret}`).digest("hex");
}

/** "123456" → "123 456", easier to read in an email. */
export function formatCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}
