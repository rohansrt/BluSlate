"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { createGuest, sessionCookieName } from "@/lib/guest";
import { MERGE_COOKIE, mergeToken } from "@/lib/guest-merge";

const emailSchema = z.email().max(254);

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

export interface SignInState {
  error?: string;
}

/** Send a magic link (sign in and sign up are the same), then show "check your email". */
export async function sendSignInLink(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!parsed.success) return { error: "Enter a valid email address." };

  // A guest signing up keeps their startups once the link is opened in this browser.
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
    await signIn("resend", {
      email: parsed.data,
      redirectTo: safeRedirect(formData.get("redirectTo"), "/startups"),
      // Redirect ourselves: the client router can't follow Auth.js's
      // /api/auth/verify-request hop from a server action.
      redirect: false,
    });
  } catch (err) {
    console.error("Sending the sign-in link failed", err);
    return { error: "We couldn't send the sign-in link. Please try again in a moment." };
  }
  redirect("/signin/check-email");
}

/** "Continue as guest": a private workspace in this browser, no email needed. */
export async function continueAsGuest(formData: FormData) {
  const next = safeRedirect(formData.get("redirectTo"), "/startups/new");
  const session = await auth();
  if (session?.user) redirect(next);
  const guest = await prisma.$transaction((tx) => createGuest(tx, null));
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
