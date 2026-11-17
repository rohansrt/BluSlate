/**
 * Model registry (spec §5.11, §11.2). Model IDs come from env only; this file
 * holds what the gateway needs to know about each model: price and whether it
 * supports server-side refusal fallbacks.
 *
 * Prices are USD per million tokens (first-party API, checked 17 Nov 2026).
 * Cache writes (5-minute TTL) bill at 1.25× input; cache reads as listed.
 */
export type Tier = "top" | "standard" | "fast";

export interface ModelInfo {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  /** Server-side fallbacks on refusal ("default" routing). Not offered on Haiku. */
  fallbacks: boolean;
  /** Higher prices beyond this many prompt tokens, where they apply. */
  longPrompt?: { over: number; input: number; output: number };
}

const per = (input: number, output: number, cacheRead: number, fallbacks: boolean): ModelInfo => ({
  input,
  output,
  cacheRead,
  cacheWrite: input * 1.25,
  fallbacks,
});

export const MODELS: Record<string, ModelInfo> = {
  "claude-fable-5-2": per(8, 40, 0.2, true),
  "claude-opus-5-5": per(4, 20, 0.2, true),
  "claude-sonnet-5-5": per(2, 10, 0.1, true),
  "claude-haiku-5-5": {
    ...per(0.1, 0.5, 0.01, false),
    longPrompt: { over: 100_000, input: 0.5, output: 2.5 },
  },
  // Models a fallback may route to.
  "claude-opus-5": per(5, 25, 0.5, false),
  "claude-sonnet-5": per(2, 10, 0.2, false),
  "claude-opus-4-8": per(5, 25, 0.5, false),
};

/** Used when a model isn't listed: priced high on purpose, so cost caps err on the safe side. */
export const UNKNOWN_MODEL: ModelInfo = per(10, 50, 1, false);

export function modelInfo(model: string): ModelInfo {
  return MODELS[model] ?? UNKNOWN_MODEL;
}

export interface ModelEnv {
  AI_MODEL_TOP?: string;
  AI_MODEL_STANDARD?: string;
  AI_MODEL_FAST?: string;
}

/** Resolve a tier to a model ID from env (never hard-coded in tasks). */
export function modelForTier(tier: Tier, env: ModelEnv): string {
  const id = { top: env.AI_MODEL_TOP, standard: env.AI_MODEL_STANDARD, fast: env.AI_MODEL_FAST }[
    tier
  ];
  if (!id)
    throw new Error(
      `No model configured for the "${tier}" tier. Set AI_MODEL_${tier.toUpperCase()}.`,
    );
  return id;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export function costUsd(model: string, u: TokenUsage, price?: ModelInfo): number {
  const m = price ?? modelInfo(model);
  const promptTokens = u.inputTokens + u.cacheReadTokens + u.cacheWriteTokens;
  const long = m.longPrompt && promptTokens > m.longPrompt.over ? m.longPrompt : null;
  const input = long?.input ?? m.input;
  const output = long?.output ?? m.output;
  const cacheWrite = long ? long.input * 1.25 : m.cacheWrite;
  const usd =
    (u.inputTokens * input +
      u.outputTokens * output +
      u.cacheReadTokens * m.cacheRead +
      u.cacheWriteTokens * cacheWrite) /
    1_000_000;
  return Math.round(usd * 1e6) / 1e6;
}

/** Models offered in the admin "Add a model" picker, with a suggested tier. */
export const MODEL_CATALOG: {
  provider: "anthropic";
  modelId: string;
  displayName: string;
  suggestedTier: Tier;
  summary: string;
}[] = [
  {
    provider: "anthropic",
    modelId: "claude-haiku-5-5",
    displayName: "Claude Haiku 5.5",
    suggestedTier: "fast",
    summary: "Fast and low-cost: tagging, short explanations, Guide me.",
  },
  {
    provider: "anthropic",
    modelId: "claude-sonnet-5-5",
    displayName: "Claude Sonnet 5.5",
    suggestedTier: "standard",
    summary: "The everyday workhorse: research, customer characters, coaching.",
  },
  {
    provider: "anthropic",
    modelId: "claude-opus-5-5",
    displayName: "Claude Opus 5.5",
    suggestedTier: "top",
    summary: "Most capable Opus: long documents like the pitch and report.",
  },
  {
    provider: "anthropic",
    modelId: "claude-fable-5-2",
    displayName: "Claude Fable 5.2",
    suggestedTier: "top",
    summary: "Anthropic's most capable model, priced above Opus.",
  },
];
