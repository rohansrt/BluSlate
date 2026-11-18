import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { landingPathFor } from "@/lib/landing";

/**
 * Where sign-in lands by default (docs/decisions/0009): straight into the
 * founder's only startup, My startups when there are several, and the Home
 * onboarding card when there are none yet. A first sign-in asks for a first
 * name on /welcome when we don't have one yet.
 */
export async function GET(request: Request) {
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return to("/signin");
  // First sign-in: ask the name once (docs/decisions/0011, 0012).
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  if (!profile?.name) return to("/welcome");
  return to(await landingPathFor(userId));
}
