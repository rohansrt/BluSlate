import "server-only";
import { prisma } from "@/lib/db";
import { mayTrack, type EventName } from "@/lib/analytics/events";

/**
 * Record an event that only the server sees (for example a pillar publish).
 * Tied to the account, not a browser; skipped for under-18s. Never throws:
 * analytics must not break the product.
 */
export async function trackServer(
  name: EventName,
  userId: string,
  props?: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { age: true } });
    if (!user || !mayTrack(user.age)) return;
    await prisma.analyticsEvent.create({
      data: { name, userId, visitorId: "server", sessionId: "server", props },
    });
  } catch (err) {
    console.error("Analytics event failed", name, err);
  }
}
