import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";

/**
 * Keeping a guest's startups when they sign up (docs/decisions/0004).
 *
 * When a guest asks for a sign-in link, we set a signed, httpOnly cookie
 * naming their guest account. When the link is opened in the same browser and
 * Auth.js signs the verified email account in, the guest's startups move to
 * it and the guest account is removed. The startups only ever move *into* an
 * account whose email was just verified, so nobody can take over someone
 * else's account this way.
 */
export const MERGE_COOKIE = "bluslate.merge-guest";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set.");
  return s;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(`guest-merge:${value}`).digest("base64url");
}

export function mergeToken(guestUserId: string): string {
  return `${guestUserId}.${sign(guestUserId)}`;
}

export function readMergeToken(token: string | undefined): string | null {
  if (!token) return null;
  const [id, mac] = token.split(".");
  if (!id || !mac) return null;
  const expected = Buffer.from(sign(id));
  const actual = Buffer.from(mac);
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? id : null;
}

/** Move a guest's startups to `userId` and remove the guest. Safe to call twice. */
export async function mergeGuestInto(guestUserId: string, userId: string): Promise<number> {
  if (guestUserId === userId) return 0;
  return prisma.$transaction(async (tx) => {
    const guest = await tx.user.findUnique({
      where: { id: guestUserId },
      include: { memberships: true },
    });
    if (!guest || !guest.isGuest) return 0;
    for (const m of guest.memberships) {
      const already = await tx.member.findFirst({ where: { startupId: m.startupId, userId } });
      if (already) await tx.member.delete({ where: { id: m.id } });
      else await tx.member.update({ where: { id: m.id }, data: { userId } });
    }
    await tx.startup.updateMany({ where: { ownerId: guestUserId }, data: { ownerId: userId } });
    // Keep what the guest told us (name and age) unless the account already has it.
    const target = await tx.user.findUnique({
      where: { id: userId },
      select: { name: true, age: true },
    });
    const keep: { name?: string; age?: number } = {};
    if (!target?.name && guest.name) keep.name = guest.name;
    if (target?.age == null && guest.age != null) keep.age = guest.age;
    if (Object.keys(keep).length) await tx.user.update({ where: { id: userId }, data: keep });
    await tx.user.delete({ where: { id: guestUserId } });
    return guest.memberships.length;
  });
}
