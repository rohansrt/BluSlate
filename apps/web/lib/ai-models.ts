import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AiUnavailableError, type ModelResolver, type Tier } from "@bluslate/ai";
import { prisma } from "@/lib/db";
import { PILLARS, type PillarId } from "@/lib/pillars";

/**
 * The admin model registry (docs/decisions/0004). Admins add models and assign
 * them to pillars and tiers; the AI gateway asks this file which model to use.
 * API keys are never stored: a model names the environment variable that
 * holds its key, and only *_API_KEY variables are allowed.
 */

export const TIERS: { id: Tier; label: string; hint: string }[] = [
  { id: "fast", label: "Fast", hint: "Tagging, short explanations, Guide me" },
  { id: "standard", label: "Standard", hint: "Research, customer characters, coaching" },
  { id: "top", label: "Top", hint: "Long documents: pitch, report" },
];

export const SCOPES: { id: "default" | PillarId; label: string }[] = [
  { id: "default", label: "Default (every pillar)" },
  ...PILLARS.map((p) => ({ id: p.id, label: `${p.number} · ${p.name}` })),
];

const CREDENTIAL_ENV = /^[A-Z][A-Z0-9_]{0,60}_API_KEY$/;

export function isAllowedCredentialEnv(name: string): boolean {
  return CREDENTIAL_ENV.test(name);
}

/** Whether the named key is set. Never returns the key itself. */
export function credentialPresent(name: string): boolean {
  return isAllowedCredentialEnv(name) && Boolean(process.env[name]);
}

const clients = new Map<string, Anthropic>();

function clientFor(credentialEnv: string): Anthropic | null {
  if (!credentialPresent(credentialEnv)) return null;
  const key = process.env[credentialEnv]!;
  const cacheKey = `${credentialEnv}:${key.slice(-6)}`;
  let client = clients.get(cacheKey);
  if (!client) {
    client = new Anthropic({ apiKey: key, maxRetries: 3, timeout: 60_000 });
    clients.set(cacheKey, client);
  }
  return client;
}

/** Test a model's key and ID with the free Models API (no tokens are spent). */
export async function testModelConnection(m: {
  provider: string;
  modelId: string;
  credentialEnv: string;
}): Promise<{ ok: boolean; message: string }> {
  if (m.provider !== "anthropic")
    return { ok: false, message: "Only Anthropic models are supported so far." };
  if (!isAllowedCredentialEnv(m.credentialEnv)) {
    return {
      ok: false,
      message: "The key name must end in _API_KEY, for example ANTHROPIC_API_KEY.",
    };
  }
  const client = clientFor(m.credentialEnv);
  if (!client) {
    return {
      ok: false,
      message: `${m.credentialEnv} isn't set. Add it to apps/web/.env.local (or the host's settings) and restart.`,
    };
  }
  try {
    const info = await client.models.retrieve(m.modelId);
    return { ok: true, message: `Connected: ${info.display_name}.` };
  } catch (err) {
    if (err instanceof Anthropic.NotFoundError)
      return { ok: false, message: `The model "${m.modelId}" wasn't found.` };
    if (err instanceof Anthropic.AuthenticationError)
      return { ok: false, message: "The API key was rejected." };
    if (err instanceof Anthropic.PermissionDeniedError) {
      return { ok: false, message: "This key doesn't have access to that model." };
    }
    if (err instanceof Anthropic.APIConnectionError)
      return { ok: false, message: "Couldn't reach Anthropic." };
    return { ok: false, message: err instanceof Error ? err.message : "The test failed." };
  }
}

/**
 * Pick a model for a task: the pillar's own assignment for the task's tier,
 * then the default assignment. Disabled models and missing keys are skipped,
 * with a reason the founder can act on.
 */
export const resolveModel: ModelResolver = async (task, ctx) => {
  const pillarScope = task.pillar !== "core" ? task.pillar : ctx.pillar;
  const scopes = [...(pillarScope ? [pillarScope] : []), "default"];
  const rows = await prisma.aiModelAssignment.findMany({
    where: { tier: task.tier, scope: { in: scopes } },
    include: { model: true },
  });
  const ordered = scopes.map((s) => rows.find((r) => r.scope === s)).filter((r) => r !== undefined);
  const usable = ordered.find((r) => r.model.enabled);
  if (!usable) {
    throw new AiUnavailableError(
      "No AI model has been added for this step yet. An admin can add one.",
    );
  }
  const client = clientFor(usable.model.credentialEnv);
  if (!client) {
    throw new AiUnavailableError(
      "The AI model for this step isn't connected yet (its API key is missing).",
    );
  }
  return {
    client,
    model: usable.model.modelId,
    price: {
      input: usable.model.inputPerMTok,
      output: usable.model.outputPerMTok,
      cacheRead: usable.model.cacheReadPerMTok,
      cacheWrite: usable.model.inputPerMTok * 1.25,
      fallbacks: false,
    },
  };
};
