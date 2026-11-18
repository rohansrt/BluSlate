import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, readJson, requireMember } from "@/lib/api";
import { prisma } from "@/lib/db";
import { DOC_KINDS } from "@/lib/pitch-doc-kinds";
import { generateDocs, listDocs } from "@/lib/pitch-docs";

type Params = { params: Promise<{ id: string }> };

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  kinds: z.array(z.enum(DOC_KINDS)).min(1).max(DOC_KINDS.length).default([...DOC_KINDS]),
  aiFill: z.boolean().default(false),
});

/** GET /docs: what has been generated so far (decision 0012). */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const member = await requireMember(id);
  if (member instanceof NextResponse) return member;
  return NextResponse.json({ docs: await listDocs(id) });
}

/**
 * POST /docs { kinds, aiFill }: generate documents from the startup's work as
 * it is now. Each replaces that document's previous version. With aiFill,
 * AI predicts what's missing first; if AI can't run, nothing is replaced.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const member = await requireMember(id);
  if (member instanceof NextResponse) return member;
  const parsed = bodySchema.safeParse((await readJson(request)) ?? {});
  if (!parsed.success) return fail(400, "Choose which documents to make.");
  const startup = await prisma.startup.findUnique({
    where: { id },
    select: { id: true, name: true, geography: true, currency: true, onboarding: true },
  });
  if (!startup) return fail(404, "Startup not found.");
  const kinds = [...new Set(parsed.data.kinds)];
  const result = await generateDocs(startup, kinds, { aiFill: parsed.data.aiFill });
  if (!result.ok)
    return fail(result.aiUnavailable ? 503 : 502, result.error, {
      aiUnavailable: Boolean(result.aiUnavailable),
    });
  return NextResponse.json({ docs: result.docs });
}
