import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** The signed-in user, or a redirect to sign-in that returns to `returnTo`. */
export async function requireUser(returnTo: string) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  return session.user;
}
