import { NextResponse } from "next/server";
import { fail, requirePillar, twinErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/db";
import { publishWorkspace } from "@/lib/workspace";

type Params = { params: Promise<{ id: string; pillar: string }> };

/**
 * POST /workspace/publish: the founder approves this pillar's work. The approval
 * comes from their own session (G5), made per entity inside publishWorkspace.
 */
export async function POST(_request: Request, { params }: Params) {
  const { id, pillar } = await params;
  const ctx = await requirePillar(id, pillar);
  if (ctx instanceof NextResponse) return ctx;
  const startup = await prisma.startup.findUnique({
    where: { id },
    select: { id: true, name: true, geography: true, currency: true, onboarding: true },
  });
  if (!startup) return fail(404, "Startup not found.");
  try {
    return NextResponse.json(await publishWorkspace(startup, ctx.pillar, ctx.userId));
  } catch (err) {
    return twinErrorResponse(err);
  }
}
