import "server-only";
import { NextResponse } from "next/server";
import type { PillarStarter } from "@bluslate/contracts";
import { TwinError } from "@bluslate/twin";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PILLAR_MODULES, PILLAR_STARTERS } from "@/lib/pillar-modules";
import { isPillarId, type PillarId } from "@/lib/pillars";

/** A JSON error response with a plain-language message. */
export function fail(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

export interface MemberContext {
  userId: string;
  startupId: string;
}

/** The signed-in user, if they belong to this startup (tenant isolation, G8). */
export async function requireMember(startupId: string): Promise<MemberContext | NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return fail(401, "Your session has ended. Open BluSlate again to continue.");
  const member = await prisma.member.findFirst({
    where: { startupId, userId },
    select: { id: true },
  });
  // 404, not 403, so other people's startup ids aren't confirmed to exist.
  if (!member) return fail(404, "Startup not found.");
  return { userId, startupId };
}

export interface PillarRouteContext extends MemberContext {
  pillar: PillarId;
  starter: PillarStarter;
  schemaVersion: string;
}

export async function requirePillar(
  startupId: string,
  pillar: string,
): Promise<PillarRouteContext | NextResponse> {
  if (!isPillarId(pillar)) return fail(404, "Unknown step.");
  const member = await requireMember(startupId);
  if (member instanceof NextResponse) return member;
  return {
    ...member,
    pillar,
    starter: PILLAR_STARTERS[pillar],
    schemaVersion: PILLAR_MODULES[pillar].schemaVersion,
  };
}

/** Map Twin errors to responses; anything else is rethrown. */
export function twinErrorResponse(err: unknown) {
  if (err instanceof TwinError) {
    const status = err.code === "not_found" ? 404 : err.code === "approval_required" ? 403 : 422;
    return fail(status, err.message, { code: err.code });
  }
  throw err;
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
