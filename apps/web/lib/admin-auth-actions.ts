"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { createSessionFor, sessionCookieName } from "@/lib/guest";
import { verifyPassword } from "@/lib/password";

export interface AdminLoginState {
  error?: string;
}

const form = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) });

// Simple per-IP throttle: 5 failed tries per 15 minutes (per server process).
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const failures = new Map<string, { count: number; first: number }>();

function throttled(ip: string) {
  const f = failures.get(ip);
  if (!f) return false;
  if (Date.now() - f.first > WINDOW_MS) {
    failures.delete(ip);
    return false;
  }
  return f.count >= MAX_FAILS;
}

function recordFailure(ip: string) {
  const f = failures.get(ip);
  if (!f || Date.now() - f.first > WINDOW_MS) failures.set(ip, { count: 1, first: Date.now() });
  else f.count += 1;
}

/**
 * Admin sign-in with email and password (docs/decisions/0005). Only emails in
 * ADMIN_EMAILS can sign in, against ADMIN_PASSWORD_HASH. A wrong email or a
 * wrong password gives the same message, so admin emails aren't revealed.
 */
export async function adminPasswordLogin(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (throttled(ip)) return { error: "Too many attempts. Wait 15 minutes and try again." };

  const parsed = form.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const ok =
    parsed.success &&
    isAdminEmail(parsed.data.email) &&
    Boolean(hash) &&
    (await verifyPassword(parsed.data.password, hash));
  if (!parsed.success || !ok) {
    recordFailure(ip);
    if (!hash) console.error("ADMIN_PASSWORD_HASH is not set: admin password sign-in is off.");
    return { error: "Wrong email or password." };
  }
  failures.delete(ip);

  const email = parsed.data.email;
  const session = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      create: { email, emailVerified: new Date(), isGuest: false },
      update: {},
      select: { id: true },
    });
    return createSessionFor(tx, user.id);
  });

  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const secure = proto
    ? proto === "https"
    : (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
  (await cookies()).set(sessionCookieName(secure), session.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    expires: session.expires,
  });
  await audit(email, "admin.login", { method: "password" });
  redirect("/admin");
}
