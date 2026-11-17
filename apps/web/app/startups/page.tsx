import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button, Input } from "@bluslate/ui";
import { GuestNotice } from "@/components/guest-notice";
import { StartupCard } from "@/components/startup-card";
import { requireUser } from "@/lib/require-user";
import { renameStartup } from "@/lib/startup-actions";
import { LIMITS } from "@/lib/onboarding";
import { listStartupsForUser } from "@/lib/startups";

export const metadata: Metadata = {
  title: "My startups",
  robots: { index: false, follow: false },
};

export default async function MyStartupsPage() {
  const user = await requireUser("/startups");
  const startups = await listStartupsForUser(user.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My startups</h1>
          <p className="mt-1 text-muted-foreground">
            {startups.length === 0
              ? "You haven't started one yet."
              : `${startups.length} ${startups.length === 1 ? "startup" : "startups"}, private to you.`}
          </p>
        </div>
        <Button asChild>
          <Link href="/startups/new">
            <Plus aria-hidden /> Start another
          </Link>
        </Button>
      </div>

      {user.isGuest && (
        <div className="mt-6">
          <GuestNotice />
        </div>
      )}

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {startups.map((s) => (
          <li key={s.id} className="flex flex-col gap-2">
            <StartupCard startup={s} />
            <details className="group rounded-xl px-1 text-sm">
              <summary className="cursor-pointer list-none text-muted-foreground hover:text-foreground">
                Rename
              </summary>
              <form action={renameStartup} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={s.id} />
                <label htmlFor={`rename-${s.id}`} className="sr-only">
                  New name for {s.name}
                </label>
                <Input
                  id={`rename-${s.id}`}
                  name="name"
                  defaultValue={s.name}
                  maxLength={LIMITS.startupName}
                  required
                  className="h-9"
                />
                <Button type="submit" size="sm" variant="outline">
                  Save
                </Button>
              </form>
            </details>
          </li>
        ))}
        <li>
          <Link
            href="/startups/new"
            className="flex h-full min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/50 bg-founder-soft/50 p-6 text-center font-semibold text-primary transition-colors hover:bg-founder-soft"
          >
            <Plus className="size-6" aria-hidden />
            Start another
          </Link>
        </li>
      </ul>
    </div>
  );
}
