"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/auth";

const emailSchema = z.email().max(254);

/** Only allow redirects back into BluSlate itself. */
function safeRedirect(value: FormDataEntryValue | null, fallback: string): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

export interface SignInState {
  error?: string;
}

/** Send a magic link, then show the "check your email" page. */
export async function sendSignInLink(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = emailSchema.safeParse(
    String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!parsed.success) return { error: "Enter a valid email address." };
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

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
