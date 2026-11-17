import "server-only";
import { prisma } from "@/lib/db";

/**
 * Startup reads, always scoped to the signed-in user's memberships
 * (tenant isolation, guardrail G8/G11).
 */

export async function listStartupsForUser(userId: string) {
  return prisma.startup.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      geography: true,
      stage: true,
      entryPath: true,
      createdAt: true,
    },
  });
}

export async function getStartupForUser(id: string, userId: string) {
  return prisma.startup.findFirst({
    where: { id, members: { some: { userId } } },
    select: {
      id: true,
      name: true,
      stage: true,
      geography: true,
      currency: true,
      entryPath: true,
      onboarding: true,
      createdAt: true,
      members: { where: { userId }, select: { role: true } },
    },
  });
}

export async function renameStartupForOwner(id: string, userId: string, name: string) {
  const { count } = await prisma.startup.updateMany({
    where: { id, members: { some: { userId, role: "owner" } } },
    data: { name },
  });
  return count === 1;
}

export const ENTRY_PATH_LABEL = {
  NEW_IDEA: "New idea",
  EXISTING: "Existing business",
  ONE_TOOL: "One tool",
} as const;
