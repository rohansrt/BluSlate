import { NextResponse } from "next/server";
import { fail, readJson, requirePillar, twinErrorResponse } from "@/lib/api";
import { getStarterState } from "@/lib/starter-state";
import { twin } from "@/lib/twin";

type Params = { params: Promise<{ id: string; pillar: string }> };

/**
 * PUT: save the founder's own answer to the pillar's first question as a draft
 * ("I'll decide"). The server assigns the label: a founder statement is ASSUMED
 * (§5.3, §5.4). Nothing reaches other pillars until it is published.
 */
export async function PUT(request: Request, { params }: Params) {
  const { id, pillar } = await params;
  const ctx = await requirePillar(id, pillar);
  if (ctx instanceof NextResponse) return ctx;

  const body = await readJson(request);
  const value = typeof body?.value === "string" ? body.value.trim() : "";
  if (!value) return fail(422, "Write an answer first.");
  if (value.length > ctx.starter.maxLength)
    return fail(422, `Keep it under ${ctx.starter.maxLength} characters.`);

  const state = await getStarterState(id, ctx.pillar);
  try {
    const draft = await twin.saveDraft({
      startupId: id,
      pillar: ctx.pillar,
      type: ctx.starter.entityType,
      logicalId: state.current?.logicalId ?? null,
      draftId: state.draft?.id,
      data: { [ctx.starter.field]: value },
      evidenceLabel: "ASSUMED",
      createdBy: "FOUNDER",
      schemaVersion: ctx.schemaVersion,
    });
    return NextResponse.json({ draftId: draft.id });
  } catch (err) {
    return twinErrorResponse(err);
  }
}

/** DELETE: discard the open draft. Published history is untouched. */
export async function DELETE(request: Request, { params }: Params) {
  const { id, pillar } = await params;
  const ctx = await requirePillar(id, pillar);
  if (ctx instanceof NextResponse) return ctx;
  const draftId = new URL(request.url).searchParams.get("draftId");
  if (!draftId) return fail(400, "Which draft?");
  const drafts = await twin.drafts(id, ctx.pillar);
  if (!drafts.some((d) => d.id === draftId)) return fail(404, "Draft not found.");
  await twin.discardDraft(id, draftId);
  return NextResponse.json({ ok: true });
}
