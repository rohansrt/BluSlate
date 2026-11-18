import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button, Card, Input, Label } from "@bluslate/ui";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { signOutAction } from "@/lib/auth-actions";
import { LIMITS } from "@/lib/onboarding";
import { requireUser } from "@/lib/require-user";
import { updateName } from "@/lib/startup-actions";
import { listStartupsForUser } from "@/lib/startups";

export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: false } };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser("/profile");
  const params = await searchParams;
  const startups = await listStartupsForUser(user.id);
  const admin = !user.isGuest && isAdminEmail(user.email);
  const guestEmail = user.isGuest
    ? (await prisma.user.findUnique({ where: { id: user.id }, select: { guestEmail: true } }))
        ?.guestEmail
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      {params.saved && (
        <p role="status" className="mt-4 rounded-xl bg-actual-soft px-4 py-3 text-sm text-actual">
          Saved.
        </p>
      )}

      <Card className="mt-6 p-6">
        <form action={updateName} className="space-y-2">
          <Label htmlFor="profile-name">Your first name</Label>
          <div className="flex gap-2">
            <Input
              id="profile-name"
              name="name"
              defaultValue={user.name ?? ""}
              maxLength={LIMITS.firstName}
              required
            />
            <Button type="submit" variant="outline">
              Save
            </Button>
          </div>
        </form>

        <div className="mt-6 border-t border-border pt-6">
          <p className="text-sm font-semibold">Account</p>
          {user.isGuest ? (
            <div className="mt-2 space-y-3 text-sm">
              <p className="text-muted-foreground">
                You&apos;re using BluSlate as a guest. Your startups are saved in this browser only.
              </p>
              {guestEmail && (
                <p className="text-muted-foreground" data-testid="profile-guest-email">
                  Email you gave: <span className="font-medium text-foreground">{guestEmail}</span>{" "}
                  (not verified yet)
                </p>
              )}
              <Button asChild>
                <Link href="/signin?mode=signup">
                  <UserPlus aria-hidden /> Sign in with a code to keep your work
                </Link>
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground" data-testid="profile-email">
              Signed in as <span className="font-medium text-foreground">{user.email}</span>
              {admin && " · admin"}
            </p>
          )}
        </div>

        <div className="mt-6 border-t border-border pt-6 text-sm">
          <p className="font-semibold">Your startups</p>
          <p className="mt-1 text-muted-foreground">
            {startups.length} {startups.length === 1 ? "startup" : "startups"}.{" "}
            <Link
              href="/startups"
              className="font-medium text-primary underline underline-offset-4"
            >
              Open My startups
            </Link>
          </p>
        </div>

        <form action={signOutAction} className="mt-6 border-t border-border pt-6">
          <Button type="submit" variant="outline">
            {user.isGuest ? "End guest session" : "Sign out"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
