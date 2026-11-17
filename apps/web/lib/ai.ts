import "server-only";
import { CORE_TASKS, createAiGateway, type AiCallLog, type AiContext } from "@bluslate/ai";
import type { EntityType, PillarEntityType } from "@bluslate/contracts";
import { isPillarEntityType } from "@bluslate/contracts";
import { resolveModel } from "@/lib/ai-models";
import { prisma } from "@/lib/db";
import type { PillarId } from "@/lib/pillars";
import { twin } from "@/lib/twin";

/** AI calls are logged to the AiCall table, which is also where today's spend comes from. */
const log: AiCallLog = {
  async record(call) {
    await prisma.aiCall.create({ data: call });
  },
  async spentSince(startupId, since) {
    const agg = await prisma.aiCall.aggregate({
      where: { startupId, createdAt: { gte: since } },
      _sum: { costUsd: true },
    });
    return agg._sum.costUsd ?? 0;
  },
};

/**
 * The app's AI gateway. Models come from the admin model registry
 * (lib/ai-models.ts); with no model added, every AI feature falls back to
 * manual input.
 */
export const ai = createAiGateway({
  resolve: resolveModel,
  env: { AI_DAILY_COST_CAP_USD: process.env.AI_DAILY_COST_CAP_USD },
  log,
  tasks: [...CORE_TASKS],
});

/**
 * The context the gateway may use for one startup: approved entities of the
 * task's allowed types, for this startup only (G11). Persona hidden profiles
 * aren't entities, so they can never appear here (G6).
 */
export function aiContextFor(startupId: string, pillar?: PillarId): AiContext {
  return {
    startupId,
    pillar,
    async contextSummary(types: readonly EntityType[]) {
      const pillarTypes = types.filter((t): t is PillarEntityType => isPillarEntityType(t));
      const entities = await twin.approved(startupId, pillarTypes);
      return entities
        .map((e) => `${e.type} v${e.version} [${e.evidenceLabel}]: ${JSON.stringify(e.data)}`)
        .join("\n");
    },
    async knownSources(ids: string[]) {
      const rows = await prisma.source.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });
      return rows.map((r) => r.id);
    },
  };
}
