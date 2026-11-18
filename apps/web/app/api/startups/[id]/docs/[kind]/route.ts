import { NextResponse } from "next/server";
import { fail, requireMember } from "@/lib/api";
import { DOC_KIND_INFO, isDocKind } from "@/lib/pitch-doc-kinds";
import { getDoc } from "@/lib/pitch-docs";
import { renderPdf } from "@/lib/pitch-docs-pdf";
import { renderXlsx } from "@/lib/pitch-docs-xlsx";

type Params = { params: Promise<{ id: string; kind: string }> };

export const runtime = "nodejs";

const TYPES = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;

function fileName(startup: string, title: string, ext: string) {
  const slug = (x: string) =>
    x
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "startup";
  return `${slug(startup)}-${slug(title)}.${ext}`;
}

/**
 * GET /docs/[kind]: download the last generated version of a document
 * (decision 0012). It is rendered from the stored snapshot, so it stays the
 * same until the founder generates it again.
 */
export async function GET(_request: Request, { params }: Params) {
  const { id, kind } = await params;
  if (!isDocKind(kind)) return fail(404, "Unknown document.");
  const member = await requireMember(id);
  if (member instanceof NextResponse) return member;
  const doc = await getDoc(id, kind);
  if (!doc) return fail(404, "Generate this document first.");
  const info = DOC_KIND_INFO[kind];
  const body = info.ext === "xlsx" ? await renderXlsx(doc) : await renderPdf(doc);
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": TYPES[info.ext],
      "Content-Disposition": `attachment; filename="${fileName(doc.startup.name, info.title, info.ext)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
