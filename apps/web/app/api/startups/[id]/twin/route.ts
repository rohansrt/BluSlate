import { NextResponse } from "next/server";
import { ALL_PILLAR_ENTITY_TYPES, isPillarEntityType } from "@bluslate/contracts";
import { requireMember } from "@/lib/api";
import { twin } from "@/lib/twin";

/** GET /api/startups/:id/twin?types=Problem,Segment — approved entities and statuses (§7.4). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireMember(id);
  if (ctx instanceof NextResponse) return ctx;
  const requested = new URL(request.url).searchParams.get("types");
  const types = requested
    ? requested.split(",").filter(isPillarEntityType)
    : ALL_PILLAR_ENTITY_TYPES;
  const [entities, statuses] = await Promise.all([twin.approved(id, types), twin.statuses(id)]);
  return NextResponse.json({ entities, statuses: statuses.pillars });
}
