import { NextResponse } from "next/server";
import { fail, readJson, requirePillar, twinErrorResponse } from "@/lib/api";
import { pillarInfo } from "@/lib/pillars";
import { twin } from "@/lib/twin";

type Params = { params: Promise<{ id: string; pillar: string }> };

/** POST /preview: what publishing this draft would change (§5.5 step 2, §7.4). */
export async function POST(request: Request, { params }: Params) {
  const { id, pillar } = await params;
  const ctx = await requirePillar(id, pillar);
  if (ctx instanceof NextResponse) return ctx;
  const body = await readJson(request);
  const draftId = typeof body?.draftId === "string" ? body.draftId : null;
  if (!draftId) return fail(400, "Which draft?");

  try {
    const preview = await twin.previewPublish(id, draftId);
    if (preview.draft.pillar !== ctx.pillar) return fail(404, "Draft not found.");
    const before = preview.fromVersion
      ? (await twin.history(id, preview.draft.logicalId!)).at(-1)?.data[ctx.starter.field]
      : null;
    return NextResponse.json({
      isNew: preview.isNew,
      fromVersion: preview.fromVersion,
      changes: [
        {
          field: ctx.starter.entityType,
          before: typeof before === "string" ? before : null,
          after: String(preview.draft.data[ctx.starter.field] ?? ""),
          label: preview.draft.evidenceLabel,
        },
      ],
      affected: preview.affected.map((a) => ({
        name: a.type,
        pillar: pillarInfo(a.ownerPillar).name,
      })),
    });
  } catch (err) {
    return twinErrorResponse(err);
  }
}
