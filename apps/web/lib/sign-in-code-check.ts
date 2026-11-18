import "server-only";
import { prisma } from "@/lib/db";
import { clearLimit, hit, isLimited } from "@/lib/rate-limit";
import {
  MAX_WRONG_CODES,
  WRONG_CODE_WINDOW_MS,
  hashCode,
  normalizeCode,
  normalizeEmail,
} from "@/lib/sign-in-code";

export type CodeCheck = "ok" | "wrong" | "expired" | "locked";

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set.");
  return secret;
}

const wrongKey = (email: string) => `code-wrong:${email}`;

/**
 * Check a code without using it up; Auth.js's callback uses it up when it
 * signs the person in. Wrong codes count against the email: after
 * MAX_WRONG_CODES in the window, its codes are cancelled and it must wait.
 * Both the code form and the /api/auth/callback/resend route call this, so
 * guessing can't skip the limit by calling Auth.js directly.
 */
export async function checkSignInCode(rawEmail: unknown, rawCode: unknown): Promise<CodeCheck> {
  const email = normalizeEmail(rawEmail);
  if (!email) return "wrong";
  if (await isLimited(wrongKey(email), MAX_WRONG_CODES, WRONG_CODE_WINDOW_MS)) return "locked";

  const code = normalizeCode(rawCode);
  const token = code
    ? await prisma.verificationToken.findUnique({
        where: { identifier_token: { identifier: email, token: hashCode(code, authSecret()) } },
      })
    : null;

  if (token) {
    if (token.expires.getTime() < Date.now()) return "expired";
    return "ok";
  }

  const wrong = await hit(wrongKey(email), WRONG_CODE_WINDOW_MS);
  if (wrong >= MAX_WRONG_CODES) {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    return "locked";
  }
  return "wrong";
}

/** A new code replaces any earlier one for that email. */
export async function cancelCodesFor(rawEmail: unknown): Promise<void> {
  await prisma.verificationToken.deleteMany({ where: { identifier: normalizeEmail(rawEmail) } });
}

/** After a successful sign-in the wrong-code count starts again. */
export async function resetWrongCodes(rawEmail: unknown): Promise<void> {
  await clearLimit(wrongKey(normalizeEmail(rawEmail)));
}
