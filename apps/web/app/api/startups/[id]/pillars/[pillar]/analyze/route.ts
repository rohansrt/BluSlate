import { NextResponse } from "next/server";
import { AiError } from "@bluslate/ai";
import { fail, readJson, requirePillar } from "@/lib/api";
import { ai, aiContextFor } from "@/lib/ai";

type Params = { params: Promise<{ id: string; pillar: string }> };

interface ExplainItems {
  concept: string;
  example: string;
  questions: string[];
}

/**
 * POST /analyze { mode: "guide" }: "Guide me" for the pillar's first question.
 * The answer is advice for the founder; it is not saved to the Twin. When AI
 * isn't available, the response says so and the founder answers by hand.
 */
export async function POST(request: Request, { params }: Params) {
  const { id, pillar } = await params;
  const ctx = await requirePillar(id, pillar);
  if (ctx instanceof NextResponse) return ctx;
  const body = await readJson(request);
  if (body?.mode !== "guide") return fail(400, 'Only "guide" is available in this step for now.');
  const answerSoFar =
    typeof body.answerSoFar === "string" ? body.answerSoFar.slice(0, 2000) : undefined;

  try {
    const result = await ai.run<ExplainItems>(
      "core.explain",
      { pillar: ctx.pillar, question: ctx.starter.question, answerSoFar },
      aiContextFor(id, ctx.pillar),
    );
    return NextResponse.json({ kind: "guide", ...result.items, label: result.label });
  } catch (err) {
    if (err instanceof AiError) {
      return NextResponse.json({ kind: "unavailable", message: err.message, code: err.code });
    }
    console.error("Guide me failed", err);
    return NextResponse.json({
      kind: "unavailable",
      message: "Something went wrong reaching the AI helper.",
    });
  }
}
