import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listStartupsForUser } from "@/lib/startups";

/**
 * Where sign-in lands by default (docs/decisions/0009): straight into the
 * founder's only startup, My startups when there are several, and the Home
 * onboarding card when there are none yet.
 */
export async function GET(request: Request) {
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return to("/signin");
  const startups = await listStartupsForUser(userId);
  if (startups.length === 0) return to("/");
  if (startups.length === 1) return to(`/startups/${startups[0]!.id}`);
  return to("/startups");
}
