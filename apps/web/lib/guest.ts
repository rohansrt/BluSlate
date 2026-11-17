import "server-only";
import { randomBytes } from "node:crypto";
import type { NextResponse } from "next/server";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Guest workspaces (docs/decisions/0002). While sign-in is switched off, the
 * first startup creates a guest User and an Auth.js database session for this
 * browser. auth() then treats the visitor like any signed-in user, so tenant
 * isolation and every page work unchanged.
 */

const SESSION_DAYS = 30;

/** Auth.js v5 cookie names; the __Secure- prefix applies on HTTPS. */
export function sessionCookieName(secure: boolean): string {
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

export function isSecureRequest(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
  return new URL(request.url).protocol === "https:";
}

export interface GuestSession {
  userId: string;
  sessionToken: string;
  expires: Date;
}

export async function createGuest(
  tx: Prisma.TransactionClient,
  firstName: string,
): Promise<GuestSession> {
  const user = await tx.user.create({
    data: { name: firstName, isGuest: true },
    select: { id: true },
  });
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await tx.session.create({ data: { sessionToken, userId: user.id, expires } });
  return { userId: user.id, sessionToken, expires };
}

export function setGuestCookie(response: NextResponse, guest: GuestSession, secure: boolean): void {
  response.cookies.set(sessionCookieName(secure), guest.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    expires: guest.expires,
  });
}
