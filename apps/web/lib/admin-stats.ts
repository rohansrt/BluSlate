import "server-only";
import { prisma } from "@/lib/db";
import { PILLAR_IDS, type PillarId } from "@/lib/pillars";

/**
 * Aggregate statistics for the admin dashboard. Counts and sums only: no
 * startup names, ideas or answers are read here (Privacy Policy, G11).
 */
export async function adminStats(now = new Date()) {
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    users,
    guests,
    newUsers,
    startups,
    newStartups,
    byPath,
    versions,
    decisions,
    drafts,
    proposals,
    stale,
    assumptions,
    pillarRows,
    aiAll,
    aiWeek,
    aiByOutcome,
    aiByModel,
    aiByTask,
    models,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isGuest: true } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.startup.count(),
    prisma.startup.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.startup.groupBy({ by: ["entryPath"], _count: { _all: true } }),
    prisma.entity.count(),
    prisma.decisionEvent.count(),
    prisma.draft.count(),
    prisma.proposal.count({ where: { status: "pending" } }),
    prisma.staleMark.count(),
    prisma.assumption.count(),
    prisma.entity.groupBy({ by: ["ownerPillar", "startupId"] }),
    prisma.aiCall.aggregate({
      _count: { _all: true },
      _sum: { costUsd: true },
      _avg: { latencyMs: true },
    }),
    prisma.aiCall.aggregate({
      where: { createdAt: { gte: weekAgo } },
      _count: { _all: true },
      _sum: { costUsd: true },
    }),
    prisma.aiCall.groupBy({ by: ["outcome"], _count: { _all: true } }),
    prisma.aiCall.groupBy({ by: ["model"], _count: { _all: true }, _sum: { costUsd: true } }),
    prisma.aiCall.groupBy({ by: ["task"], _count: { _all: true }, _sum: { costUsd: true } }),
    prisma.aiModel.findMany({ select: { enabled: true, lastTestOk: true } }),
  ]);

  const adoption = Object.fromEntries(PILLAR_IDS.map((p) => [p, 0])) as Record<PillarId, number>;
  for (const row of pillarRows) {
    if (row.ownerPillar in adoption) adoption[row.ownerPillar as PillarId] += 1;
  }

  return {
    users: { total: users, guests, withEmail: users - guests, newThisWeek: newUsers },
    startups: {
      total: startups,
      newThisWeek: newStartups,
      byPath: Object.fromEntries(byPath.map((r) => [r.entryPath, r._count._all])) as Record<
        string,
        number
      >,
    },
    twin: { versions, decisions, drafts, proposals, stale, assumptions },
    adoption,
    ai: {
      calls: aiAll._count._all,
      costUsd: aiAll._sum.costUsd ?? 0,
      avgLatencyMs: Math.round(aiAll._avg.latencyMs ?? 0),
      callsThisWeek: aiWeek._count._all,
      costThisWeek: aiWeek._sum.costUsd ?? 0,
      byOutcome: Object.fromEntries(aiByOutcome.map((r) => [r.outcome, r._count._all])) as Record<
        string,
        number
      >,
      byModel: aiByModel.map((r) => ({
        model: r.model,
        calls: r._count._all,
        costUsd: r._sum.costUsd ?? 0,
      })),
      byTask: aiByTask.map((r) => ({
        task: r.task,
        calls: r._count._all,
        costUsd: r._sum.costUsd ?? 0,
      })),
    },
    models: {
      added: models.length,
      enabled: models.filter((m) => m.enabled).length,
      connected: models.filter((m) => m.enabled && m.lastTestOk).length,
    },
  };
}
