import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/lib/auth-actions";
import { Button } from "@bluslate/ui";
import { Logo } from "@/components/logo";
import { site } from "@/lib/site";

export async function SiteHeader() {
  const session = await auth();
  const signedIn = Boolean(session?.user);
  // Guests have no email to sign back in with, so signing out would lose their startups.
  const isGuest = Boolean(session?.user?.isGuest);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo height={32} className="max-sm:[&_img]:h-7 max-sm:[&_img]:w-auto" />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          {/* On phones, signed-in founders reach About from the footer. */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={signedIn ? "hidden sm:inline-flex" : undefined}
          >
            <Link href="/about">About</Link>
          </Button>
          {signedIn ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/startups">My startups</Link>
              </Button>
              {!isGuest && (
                <form action={signOutAction}>
                  <Button type="submit" variant="outline" size="sm">
                    Sign out
                  </Button>
                </form>
              )}
            </>
          ) : (
            site.signInRequired && (
              <Button asChild variant="outline" size="sm">
                <Link href="/signin">Sign in</Link>
              </Button>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
