import { NextResponse } from "next/server";
import { fail, requirePillar } from "@/lib/api";
import { prisma } from "@/lib/db";
import { saveWorkspace } from "@/lib/workspace";

type Params = { params: Promise<{ id: string; pillar: string }> };

const MAX_BYTES = 300_000;

/** PUT /workspace: autosave the founder's working state for this pillar. Not Twin history. */
export async function PUT(request: Request, { params }: Params) {
  const { id, pillar } = await params;
  const ctx = await requirePillar(id, pillar);
  if (ctx instanceof NextResponse) return ctx;
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return fail(413, "That's too much to save in one step.");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "Couldn't read that.");
  }
  const data = (body as { data?: unknown } | null)?.data;
  const startup = await prisma.startup.findUnique({
    where: { id },
    select: { id: true, name: true, geography: true, currency: true, onboarding: true },
  });
  if (!startup) return fail(404, "Startup not found.");
  const result = await saveWorkspace(startup, ctx.pillar, data);
  if (!result.ok) return fail(422, "Some answers couldn't be saved.", { issues: result.issues });
  // `linked`: other steps whose linked fields were filled in from this one.
  return NextResponse.json({ updatedAt: result.updatedAt, linked: result.linked });
}
