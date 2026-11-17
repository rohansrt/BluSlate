import "server-only";
import type { FounderApproval } from "@bluslate/contracts";
import { createTwin } from "@bluslate/twin";
import { prisma } from "@/lib/db";
import { PrismaTwinStore } from "@/lib/twin-store";

/** The Business Twin, backed by Postgres. */
export const twin = createTwin(new PrismaTwinStore(prisma));

/**
 * A FounderApproval can only be made here, from the signed-in user's own
 * session, at the moment they press Approve (G5). AI code never sees this.
 */
export function approvalFromSession(userId: string): FounderApproval {
  return { userId, approvedAt: new Date().toISOString() };
}
