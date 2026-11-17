import { NextResponse } from "next/server";
import { fail, readJson, requirePillar, twinErrorResponse } from "@/lib/api";
import { approvalFromSession, twin } from "@/lib/twin";

type Params = { params: Promise<{ id: string; pillar: string }> };

/**
 * POST /publish: the founder approves a draft. The approval is made here from
 * their own session (G5); there is no other way to write to the Twin.
 */
export async function POST(request: Request, { params }: Params) {
  const { id, pillar } = await params;
  const ctx = await requirePillar(id, pillar);
  if (ctx instanceof NextResponse) return ctx;
  const body = await readJson(request);
  const draftId = typeof body?.draftId === "string" ? body.draftId : null;
  if (!draftId) return fail(400, "Which draft?");
  const rationale = typeof body?.rationale === "string" ? body.rationale.slice(0, 500) : null;

  const drafts = await twin.drafts(id, ctx.pillar);
  if (!drafts.some((d) => d.id === draftId)) return fail(404, "Draft not found.");
  try {
    const result = await twin.publish({
      startupId: id,
      draftId,
      approval: approvalFromSession(ctx.userId),
      rationale,
    });
    return NextResponse.json(result);
  } catch (err) {
    return twinErrorResponse(err);
  }
}
