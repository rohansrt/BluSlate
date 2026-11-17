import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createGuest, isSecureRequest, setGuestCookie, type GuestSession } from "@/lib/guest";
import { onboardingSchema, toStartupCreate } from "@/lib/onboarding";
import { site } from "@/lib/site";

/**
 * POST /api/startups — create a startup from the onboarding answers (§2.1, §7.4).
 * The answers are stored as founder statements; no AI runs and nothing is
 * published to the Business Twin here.
 *
 * Without a session: while sign-in is switched off, a guest workspace is
 * created for this browser (docs/decisions/0002); otherwise the request is
 * refused.
 */
export async function POST(request: Request) {
  const session = await auth();
  const sessionUserId = session?.user?.id ?? null;
  if (!sessionUserId && site.signInRequired) {
    return NextResponse.json({ error: "Sign in to save your startup." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be JSON." }, { status: 400 });
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Some answers are missing or too long.", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const create = toStartupCreate(parsed.data);

  const { startup, guest } = await prisma.$transaction(async (tx) => {
    let guestSession: GuestSession | null = null;
    let userId = sessionUserId;
    if (!userId) {
      guestSession = await createGuest(tx, parsed.data.firstName);
      userId = guestSession.userId;
    }
    const created = await tx.startup.create({
      data: {
        name: create.name,
        stage: create.stage,
        businessType: create.businessType,
        geography: create.geography,
        currency: create.currency,
        entryPath: create.entryPath,
        onboarding: { ...create.onboarding, highlightPillar: create.highlightPillar },
        ownerId: userId,
        members: { create: { userId, role: "owner" } },
      },
      select: { id: true },
    });
    // Remember the founder's first name the first time they tell us.
    await tx.user.updateMany({
      where: { id: userId, name: null },
      data: { name: parsed.data.firstName },
    });
    return { startup: created, guest: guestSession };
  });

  const response = NextResponse.json({ id: startup.id }, { status: 201 });
  if (guest) setGuestCookie(response, guest, isSecureRequest(request));
  return response;
}
