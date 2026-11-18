import type { Metadata } from "next";
import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { requireUser } from "@/lib/require-user";

export const metadata: Metadata = {
  title: "Start a startup",
  robots: { index: false, follow: false },
};

/**
 * Where the email code lands after Home onboarding: a complete draft kept in
 * this browser is saved straight away. Otherwise the card starts fresh
 * ("Start another").
 */
export default async function NewStartupPage() {
  const user = await requireUser("/startups/new");
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <h1 className="sr-only">Start a startup</h1>
      <OnboardingCard signedIn knownName={user.name} autoSubmit />
    </div>
  );
}
