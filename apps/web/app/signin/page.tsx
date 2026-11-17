import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { Button, Card } from "@bluslate/ui";
import { auth } from "@/auth";
import { SignInForm } from "@/components/auth/sign-in-form";
import { continueAsGuest } from "@/lib/auth-actions";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in or sign up to BluSlate with a link sent to your email, or continue as a guest.",
  alternates: { canonical: "/signin" },
  robots: { index: false, follow: true },
};

const ERRORS: Record<string, string> = {
  Verification: "That sign-in link has expired or was already used. Ask for a new one below.",
  Configuration: "Sign-in isn't working right now. Please try again in a few minutes.",
  AccessDenied: "That email can't sign in.",
};

function safePath(value: string | string[] | undefined, fallback: string) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

/** Sign in and sign up are the same email-link flow; guests can continue without an email. */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const signup = params.mode === "signup";
  const redirectTo = safePath(params.callbackUrl ?? params.next, "/startups");
  const session = await auth();
  const isGuest = Boolean(session?.user?.isGuest);
  // Signed-in people don't need this page; guests may use it to sign up.
  if (session?.user && !isGuest) redirect(redirectTo);

  const errorKey = typeof params.error === "string" ? params.error : undefined;
  const error = errorKey
    ? (ERRORS[errorKey] ?? "Something went wrong signing you in. Please try again.")
    : null;

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">
          {signup ? "Create your BluSlate account" : "Sign in to BluSlate"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isGuest
            ? "Add your email to keep your startups and open them from any device."
            : "We'll email you a link. No password needed."}
        </p>
        {error && (
          <p role="alert" className="mt-5 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-6">
          <SignInForm
            redirectTo={redirectTo}
            submitLabel={signup ? "Email me a sign-up link" : undefined}
          />
        </div>
        {isGuest && (
          <p className="mt-3 text-xs text-muted-foreground">
            Open the link in this browser and your guest startups move to your account.
          </p>
        )}

        {!isGuest && (
          <>
            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or{" "}
              <span className="h-px flex-1 bg-border" />
            </div>
            <form action={continueAsGuest}>
              <input type="hidden" name="redirectTo" value="/startups/new" />
              <Button type="submit" variant="outline" className="w-full">
                <UserRound aria-hidden /> Continue as guest
              </Button>
            </form>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Guest work is saved in this browser only. You can sign up later and keep it.
            </p>
          </>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          {signup ? (
            <>
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-medium text-primary underline underline-offset-4"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link
                href="/signin?mode=signup"
                className="font-medium text-primary underline underline-offset-4"
              >
                Create an account
              </Link>
            </>
          )}
        </p>
      </Card>
    </div>
  );
}
