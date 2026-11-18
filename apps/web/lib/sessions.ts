import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Auth.js database sessions created outside Auth.js: guest workspaces
 * (docs/decisions/0010) and the admin password sign-in. auth() then reads them
 * like any other session, so tenant isolation and every page work unchanged.
 */

const SESSION_DAYS = 30;

/** Auth.js v5 cookie names; the __Secure- prefix applies on HTTPS. */
export function sessionCookieName(secure: boolean): string {
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

export interface StartedSession {
  userId: string;
  sessionToken: string;
  expires: Date;
}

/**
 * A guest: a browser-only account with the first name and the (unverified)
 * email they typed, plus a session for this browser.
 */
export async function createGuest(
  tx: Prisma.TransactionClient,
  contact: { name: string; email: string },
): Promise<StartedSession> {
  const user = await tx.user.create({
    data: { name: contact.name, guestEmail: contact.email, isGuest: true },
    select: { id: true },
  });
  return createSessionFor(tx, user.id);
}

/**
 * Start an Auth.js database session for a user (guests, and the admin
 * password sign-in).
 * auth() then reads it like any other session.
 */
export async function createSessionFor(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<StartedSession> {
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await tx.session.create({ data: { sessionToken, userId, expires } });
  return { userId, sessionToken, expires };
}
