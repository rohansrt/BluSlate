import { NextResponse } from "next/server";
import { fail, requirePillar } from "@/lib/api";
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
  const result = await saveWorkspace(id, ctx.pillar, data);
  if (!result.ok) return fail(422, "Some answers couldn't be saved.", { issues: result.issues });
  return NextResponse.json({ updatedAt: result.updatedAt });
}
