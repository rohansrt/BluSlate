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

/**
 * Delete a startup and everything stored for it (Privacy Policy: delete on
 * request). Only the owner can. AI call logs keep their cost figures but lose
 * the link to the startup.
 */
export async function deleteStartupForOwner(id: string, userId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const startup = await tx.startup.findFirst({
      where: { id, members: { some: { userId, role: "owner" } } },
      select: { id: true },
    });
    if (!startup) return false;
    const logicalIds = (
      await tx.entity.findMany({
        where: { startupId: id },
        select: { logicalId: true },
        distinct: ["logicalId"],
      })
    ).map((e) => e.logicalId);
    const threads = (
      await tx.thread.findMany({ where: { startupId: id }, select: { id: true } })
    ).map((t) => t.id);
    const scenarios = (
      await tx.scenario.findMany({ where: { startupId: id }, select: { id: true } })
    ).map((s) => s.id);

    if (logicalIds.length > 0) {
      await tx.dependency.deleteMany({
        where: { OR: [{ fromLogicalId: { in: logicalIds } }, { toLogicalId: { in: logicalIds } }] },
      });
    }
    if (threads.length > 0) await tx.message.deleteMany({ where: { threadId: { in: threads } } });
    if (scenarios.length > 0) {
      await tx.period.deleteMany({ where: { scenarioId: { in: scenarios } } });
      await tx.leverChange.deleteMany({ where: { scenarioId: { in: scenarios } } });
      await tx.marketEvent.deleteMany({ where: { scenarioId: { in: scenarios } } });
    }
    const snapshots = (
      await tx.snapshot.findMany({ where: { startupId: id }, select: { id: true } })
    ).map((s) => s.id);
    if (snapshots.length > 0)
      await tx.report.deleteMany({ where: { snapshotId: { in: snapshots } } });
    await Promise.all([
      tx.thread.deleteMany({ where: { startupId: id } }),
      tx.draft.deleteMany({ where: { startupId: id } }),
      tx.staleMark.deleteMany({ where: { startupId: id } }),
      tx.decisionEvent.deleteMany({ where: { startupId: id } }),
      tx.proposal.deleteMany({ where: { startupId: id } }),
      tx.assumption.deleteMany({ where: { startupId: id } }),
      tx.persona.deleteMany({ where: { startupId: id } }),
      tx.snapshot.deleteMany({ where: { startupId: id } }),
      tx.aiCall.updateMany({ where: { startupId: id }, data: { startupId: null } }),
    ]);
    // Entities, members and scenarios go with the startup (cascade).
    await tx.startup.delete({ where: { id } });
    return true;
  });
}
