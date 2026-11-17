import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@bluslate/ui";
import { auth } from "@/auth";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to BluSlate with a link sent to your email.",
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

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const redirectTo = safePath(params.callbackUrl ?? params.next, "/startups");
  const session = await auth();
  if (session?.user) redirect(redirectTo);

  const errorKey = typeof params.error === "string" ? params.error : undefined;
  const error = errorKey
    ? (ERRORS[errorKey] ?? "Something went wrong signing you in. Please try again.")
    : null;

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Sign in to BluSlate</h1>
        <p className="mt-2 text-muted-foreground">
          We&apos;ll email you a link. No password needed.
        </p>
        {error && (
          <p role="alert" className="mt-5 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-6">
          <SignInForm redirectTo={redirectTo} />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/" className="font-medium text-primary underline underline-offset-4">
            Start with your idea
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
