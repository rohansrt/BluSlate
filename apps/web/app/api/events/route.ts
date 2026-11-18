import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  cleanPath,
  eventBatchSchema,
  isBot,
  mayTrack,
  parseUserAgent,
  referrerHost,
} from "@/lib/analytics/events";

/**
 * POST /api/events: product analytics from the browser (docs/decisions/0011).
 * Stores coarse device and location (country and region from Vercel's
 * headers), never the IP address or the full user agent. Signed-in events are
 * linked to the account so activation and retention can be measured; accounts
 * under 18 are not tracked at all.
 */
export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent");
  if (isBot(ua)) return new NextResponse(null, { status: 204 });

  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const parsed = eventBatchSchema.safeParse(body);
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  const session = await auth();
  let userId: string | null = session?.user?.id ?? null;
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { age: true } });
    if (user && !mayTrack(user.age)) return new NextResponse(null, { status: 204 });
    if (!user) userId = null;
  }

  const { device, browser, os } = parseUserAgent(ua ?? "");
  const country = request.headers.get("x-vercel-ip-country") || null;
  const region = request.headers.get("x-vercel-ip-country-region") || null;
  const ownHost = request.nextUrl.hostname;

  try {
    await prisma.analyticsEvent.createMany({
      data: parsed.data.events.map((e) => ({
        name: e.name,
        visitorId: e.visitorId,
        sessionId: e.sessionId,
        userId,
        path: cleanPath(e.path),
        referrer: referrerHost(e.referrer, ownHost),
        utmSource: e.utmSource ?? null,
        utmMedium: e.utmMedium ?? null,
        utmCampaign: e.utmCampaign ?? null,
        device,
        browser,
        os,
        country,
        region,
        props: e.props,
      })),
    });
  } catch (err) {
    console.error("Storing analytics events failed", err);
  }
  return new NextResponse(null, { status: 204 });
}
