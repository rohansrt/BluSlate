import Link from "next/link";
import { Button } from "@bluslate/ui";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { ProfileMenu } from "@/components/profile-menu";
import { isAdminEmail } from "@/lib/admin";

/** The logo always goes to Home; your account lives in the top-right menu. */
export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo height={32} className="max-sm:[&_img]:h-7 max-sm:[&_img]:w-auto" />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/about">About</Link>
          </Button>
          {user ? (
            <ProfileMenu
              name={user.name ?? null}
              email={user.email ?? null}
              isGuest={Boolean(user.isGuest)}
              isAdmin={!user.isGuest && isAdminEmail(user.email)}
            />
          ) : (
            // Sign in and sign up are the same email-code flow (docs/decisions/0009).
            <Button asChild size="sm">
              <Link href="/signin">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
