import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@bluslate/ui";
import { auth } from "@/auth";
import { EmailCodeForm } from "@/components/auth/email-code-form";
import { GuestForm } from "@/components/auth/guest-form";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or sign up to BluSlate with a 6-digit code sent to your email.",
  alternates: { canonical: "/signin" },
  robots: { index: false, follow: true },
};

const ERRORS: Record<string, string> = {
  Verification: "That code has expired or was already used. Ask for a new one below.",
  TooManyCodes: "Too many wrong codes. Wait 15 minutes, then ask for a new code.",
  Configuration: "Sign-in isn't working right now. Please try again in a few minutes.",
  AccessDenied: "That email can't sign in.",
};

function safePath(value: string | string[] | undefined, fallback: string) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

/**
 * Sign in and sign up are the same 6-digit email-code flow (docs/decisions/0009).
 * Afterwards, /signin/continue opens the founder's work. Below it, visitors can
 * continue as a guest with a first name and an email (docs/decisions/0010).
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const signup = params.mode === "signup";
  const redirectTo = safePath(params.callbackUrl ?? params.next, "/signin/continue");
  const session = await auth();
  const isGuest = Boolean(session?.user?.isGuest);
  // Signed-in people don't need this page; guests use it to sign in and keep their work.
  if (session?.user && !isGuest) redirect(redirectTo);
  const guestEmail = isGuest
    ? (
        await prisma.user.findUnique({
          where: { id: session!.user.id },
          select: { guestEmail: true },
        })
      )?.guestEmail
    : null;

  const errorKey = typeof params.error === "string" ? params.error : undefined;
  const error = errorKey
    ? (ERRORS[errorKey] ?? "Something went wrong signing you in. Please try again.")
    : null;

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">
          {isGuest
            ? "Keep your startups"
            : signup
              ? "Create your BluSlate account"
              : "Sign in to BluSlate"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isGuest
            ? "Sign in with a code to keep your startups and open them from any device."
            : "New or returning, enter your email and we'll send you a 6‑digit code. No password."}
        </p>
        {error && (
          <p role="alert" className="mt-5 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-6">
          <EmailCodeForm redirectTo={redirectTo} defaultEmail={guestEmail} />
        </div>
        {isGuest && (
          <p className="mt-3 text-xs text-muted-foreground">
            Type the code in this browser and your guest startups move to your account.
          </p>
        )}
        {!isGuest && (
          <>
            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or continue as a guest{" "}
              <span className="h-px flex-1 bg-border" />
            </div>
            <GuestForm redirectTo={redirectTo} />
            <p className="mt-6 text-xs leading-5 text-muted-foreground">
              By continuing you agree to the{" "}
              <Link href="/terms" className="underline underline-offset-2">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
