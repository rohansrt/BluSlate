import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Platform admins (spec §5.8): people whose verified email is listed in
 * ADMIN_EMAILS (comma-separated). Guests are never admins. Admin pages show
 * aggregate statistics only, never founders' ideas.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email) && adminEmails().includes(email!.toLowerCase());
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
}

/** The current admin, or null if the visitor isn't one. */
export async function currentAdmin(): Promise<AdminUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || user.isGuest || !user.email || !isAdminEmail(user.email)) return null;
  return { id: user.id, email: user.email, name: user.name ?? null };
}

/** For admin pages: sends visitors to the admin login, and non-admins to a no-access page. */
export async function requireAdmin(): Promise<AdminUser> {
  const session = await auth();
  if (!session?.user?.id || session.user.isGuest || !session.user.email) redirect("/admin/login");
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/no-access");
  return admin;
}

/** Record an admin action (audited access). */
export async function audit(actorEmail: string, action: string, detail?: Record<string, unknown>) {
  await prisma.adminAudit.create({
    data: { actorEmail, action, detail: detail ? JSON.parse(JSON.stringify(detail)) : undefined },
  });
}
