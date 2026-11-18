import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, readJson, requireMember } from "@/lib/api";
import { COUNTRY_CODES } from "@/lib/countries";
import { setStartupMarket } from "@/lib/startups";

type Params = { params: Promise<{ id: string }> };

const marketSchema = z.object({
  country: z.enum(COUNTRY_CODES),
  region: z.string().max(80).default(""),
});

/**
 * PUT /api/startups/[id]/market: the market the founder wants to launch in
 * (decision 0012). Shown in Customer Discovery and Market Research; stored
 * once on the startup, and geography and currency follow it.
 */
export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const member = await requireMember(id);
  if (member instanceof NextResponse) return member;
  const parsed = marketSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(400, "Choose a country from the list.");
  const result = await setStartupMarket(id, member.userId, parsed.data);
  if (!result) return fail(404, "Startup not found.");
  return NextResponse.json(result);
}
