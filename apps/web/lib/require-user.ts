import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { site } from "@/lib/site";

/** The signed-in (or guest) user, or a redirect to sign-in or Home. */
export async function requireUser(returnTo: string) {
  const session = await auth();
  if (!session?.user?.id) {
    // Without sign-in, a visitor with no guest workspace starts from Home.
    redirect(site.signInRequired ? `/signin?callbackUrl=${encodeURIComponent(returnTo)}` : "/");
  }
  return session.user;
}
