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
 * ("Start another"). With ?fresh=1 (e.g. "Start with this" in the Idea Book)
 * nothing is saved until the founder presses "Open my city".
 */
export default async function NewStartupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/startups/new");
  const fresh = (await searchParams).fresh === "1";
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <h1 className="sr-only">Start a startup</h1>
      <OnboardingCard signedIn knownName={user.name} autoSubmit={!fresh} placement="new" />
    </div>
  );
}
