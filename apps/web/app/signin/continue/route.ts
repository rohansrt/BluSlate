import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { landingPathFor } from "@/lib/landing";

/**
 * Where sign-in lands by default (docs/decisions/0009): straight into the
 * founder's only startup, My startups when there are several, and the Home
 * onboarding card when there are none yet. A first sign-in asks for name and
 * age on /welcome first.
 */
export async function GET(request: Request) {
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return to("/signin");
  // First sign-in: ask name and age once (docs/decisions/0011).
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, age: true },
  });
  if (!profile?.name || profile.age == null) return to("/welcome");
  return to(await landingPathFor(userId));
}
