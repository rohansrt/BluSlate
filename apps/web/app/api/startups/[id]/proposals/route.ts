import { NextResponse } from "next/server";
import { requireMember } from "@/lib/api";
import { twin } from "@/lib/twin";

/** GET /api/startups/:id/proposals — pending proposals by pillar (§7.4). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireMember(id);
  if (ctx instanceof NextResponse) return ctx;
  const proposals = (await twin.proposals(id)).filter((p) => p.status === "pending");
  return NextResponse.json({ proposals });
}
