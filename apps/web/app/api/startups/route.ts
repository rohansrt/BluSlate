import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { onboardingSchema, toStartupCreate } from "@/lib/onboarding";

/**
 * POST /api/startups — create a startup from the onboarding answers (§2.1, §7.4).
 * The answers are stored as founder statements; no AI runs and nothing is
 * published to the Business Twin here.
 *
 * Needs a session: founders sign in with an email code first (docs/decisions/0009).
 */
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
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

  const startup = await prisma.$transaction(async (tx) => {
    const created = await tx.startup.create({
      data: {
        name: create.name,
        stage: create.stage,
        businessType: create.businessType,
        geography: create.geography,
        currency: create.currency,
        marketCountry: create.marketCountry,
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
    return created;
  });

  return NextResponse.json({ id: startup.id }, { status: 201 });
}
