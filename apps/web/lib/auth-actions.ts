"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { MERGE_COOKIE, mergeToken } from "@/lib/guest-merge";
import { firstNameSchema } from "@/lib/onboarding";
import { createGuest, sessionCookieName } from "@/lib/sessions";
import { hit } from "@/lib/rate-limit";
import { SEND_LIMITS, normalizeCode, normalizeEmail } from "@/lib/sign-in-code";
import { cancelCodesFor, checkSignInCode } from "@/lib/sign-in-code-check";

const emailSchema = z.email().max(254);
const HOUR = 60 * 60 * 1000;

/** Only allow redirects back into BluSlate itself. */
function safeRedirect(value: FormDataEntryValue | null, fallback: string): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

async function isSecure() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return proto
    ? proto === "https"
    : (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
}

/**
 * The two-part email-code form (docs/decisions/0009):
 *   "email" → ask for the email; "code" → a code was sent, ask for it;
 *   "done"  → the code is right: the browser opens `url` to finish signing in.
 */
export type CodeFormState =
  | { step: "email"; error?: string }
  | { step: "code"; email: string; sentAt: number; error?: string; resent?: boolean }
  | { step: "done"; email: string; url: string };

function sentAtOf(state: CodeFormState): number {
  return state.step === "code" ? state.sentAt : 0;
}

/** Email a 6-digit code. Sign in and sign up are the same: a new email gets a new account. */
export async function sendSignInCode(
  prev: CodeFormState,
  formData: FormData,
): Promise<CodeFormState> {
  const parsed = emailSchema.safeParse(normalizeEmail(formData.get("email")));
  if (!parsed.success) return { step: "email", error: "Enter a valid email address." };
  const email = parsed.data;
  const resend = formData.get("intent") === "resend";
  const again = (error: string): CodeFormState =>
    resend ? { step: "code", email, sentAt: sentAtOf(prev), error } : { step: "email", error };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const [perHour, perDay, perIp] = await Promise.all([
    hit(`code-send:h:${email}`, HOUR),
    hit(`code-send:d:${email}`, 24 * HOUR),
    process.env.NODE_ENV === "production" ? hit(`code-send:ip:${ip}`, HOUR / 4) : 0,
  ]);
  if (
    perHour > SEND_LIMITS.emailPerHour ||
    perDay > SEND_LIMITS.emailPerDay ||
    perIp > SEND_LIMITS.ipPer15Min
  ) {
    return again("Too many codes asked for. Wait a while, then try again.");
  }

  // A legacy guest (docs/decisions/0002) keeps their startups once they sign in here.
  const session = await auth();
  if (session?.user?.isGuest) {
    (await cookies()).set(MERGE_COOKIE, mergeToken(session.user.id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: await isSecure(),
      maxAge: 24 * 60 * 60,
    });
  }

  try {
    // Only the newest code works.
    await cancelCodesFor(email);
    await signIn("resend", { email, redirect: false });
  } catch (err) {
    console.error("Sending the sign-in code failed", err);
    return again("We couldn't send the code. Please try again in a moment.");
  }
  return { step: "code", email, sentAt: Date.now(), resent: resend };
}

/** Check the code, then hand the browser the Auth.js URL that signs the person in. */
export async function verifySignInCode(
  prev: CodeFormState,
  formData: FormData,
): Promise<CodeFormState> {
  const email = normalizeEmail(formData.get("email"));
  if (!emailSchema.safeParse(email).success) return { step: "email" };
  const retry = (error: string): CodeFormState => ({
    step: "code",
    email,
    sentAt: sentAtOf(prev),
    error,
  });
  const code = normalizeCode(formData.get("code"));
  if (!code) return retry("Enter the 6‑digit code from the email.");

  const result = await checkSignInCode(email, code);
  if (result === "wrong") return retry("That code isn't right. Check the email and try again.");
  if (result === "expired") return retry("That code has expired. Ask for a new one.");
  if (result === "locked")
    return retry("Too many wrong codes. Wait 15 minutes, then ask for a new code.");

  const callbackUrl = safeRedirect(formData.get("redirectTo"), "/signin/continue");
  const params = new URLSearchParams({ callbackUrl, token: code, email });
  // A full page load, so Auth.js can set the session cookie and redirect.
  return { step: "done", email, url: `/api/auth/callback/resend?${params}` };
}

export interface GuestFormState {
  error?: string;
  /** Which field the error is about. */
  field?: "name" | "email";
}

/** Guest workspaces a single IP may start per hour (production only). */
const GUESTS_PER_IP_PER_HOUR = 10;

/**
 * "Continue as guest" (docs/decisions/0010): a private workspace in this
 * browser. The guest gives a first name and an email so we know who used
 * BluSlate. The email isn't verified, so it is stored as `guestEmail` and can
 * never sign anyone in; signing in with a code later keeps the guest's work.
 */
export async function continueAsGuest(
  _prev: GuestFormState,
  formData: FormData,
): Promise<GuestFormState> {
  const name = firstNameSchema.safeParse(String(formData.get("name") ?? ""));
  if (!name.success) return { error: "Enter your first name.", field: "name" };
  const email = emailSchema.safeParse(normalizeEmail(formData.get("email")));
  if (!email.success) return { error: "Enter a valid email address.", field: "email" };

  const requested = safeRedirect(formData.get("redirectTo"), "/");
  // A new guest has no startups yet, so the default lands on Home's onboarding.
  const next = requested === "/signin/continue" ? "/" : requested;
  const session = await auth();
  if (session?.user) redirect(next);

  if (process.env.NODE_ENV === "production") {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if ((await hit(`guest:ip:${ip}`, HOUR)) > GUESTS_PER_IP_PER_HOUR) {
      return { error: "Too many guest workspaces from this network. Try again later." };
    }
  }

  const guest = await prisma.$transaction((tx) =>
    createGuest(tx, { name: name.data, email: email.data }),
  );
  const secure = await isSecure();
  (await cookies()).set(sessionCookieName(secure), guest.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    expires: guest.expires,
  });
  redirect(next);
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
