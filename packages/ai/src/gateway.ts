import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import type { EntityType, EvidenceLabel } from "@bluslate/contracts";
import { inventedNumbers } from "./checks";
import { Envelope } from "./envelope";
import {
  AiCostCapError,
  AiError,
  AiInvalidOutputError,
  AiRefusalError,
  AiUnavailableError,
} from "./errors";
import { BASE_SYSTEM } from "./prompts";
import { costUsd, modelForTier, modelInfo, type ModelEnv, type TokenUsage } from "./registry";
import type { AiTask } from "./task";

/**
 * The AI gateway (spec §11.3): the only place in BluSlate that calls a model.
 *
 * Every call: picks the model for the task's tier from env, enforces the
 * per-startup daily cost cap, sends the base rules + task prompt + an allowed
 * Twin summary (cached), asks for structured output, validates it, checks
 * sources and invented numbers, assigns the evidence label itself, and logs
 * tokens, cost and latency. The caller saves the result as a Draft; the
 * gateway can't publish anything (G5).
 */

export interface AiCallRecord {
  startupId: string | null;
  task: string;
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
  latencyMs: number;
  outcome: "ok" | "refusal" | "invalid" | "error";
}

/** Where AI calls are logged and today's spend is read from (the AiCall table in the app). */
export interface AiCallLog {
  record(call: AiCallRecord): Promise<void>;
  spentSince(startupId: string, since: Date): Promise<number>;
}

/** Context for one call. Only this startup's data is ever included (G11). */
export interface AiContext {
  startupId: string;
  /** A plain-text summary of approved Twin entities of the given types, for this startup only. */
  contextSummary?: (types: readonly EntityType[]) => Promise<string>;
  /** Of the given source ids, the ones that exist with a retrieval date (G2). */
  knownSources?: (ids: string[]) => Promise<string[]>;
}

export interface AiResult<T> {
  items: T;
  rationale: string;
  unknowns: string[];
  sourceIds: string[];
  confidence: "low" | "medium" | "high";
  /** Assigned by the gateway, never by the model (rule 6). */
  label: EvidenceLabel;
  model: string;
  usage: TokenUsage;
  costUsd: number;
}

export interface GatewayOptions {
  /** null means "no API key configured": every call fails with AiUnavailableError. */
  client: Anthropic | null;
  env: ModelEnv & { AI_DAILY_COST_CAP_USD?: string };
  log: AiCallLog;
  tasks: readonly AiTask[];
  now?: () => Date;
}

const FALLBACK_BETA = "server-side-fallback-2026-07-01";

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function usageOf(u: {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}): TokenUsage {
  return {
    inputTokens: u.input_tokens,
    outputTokens: u.output_tokens,
    cacheReadTokens: u.cache_read_input_tokens ?? 0,
    cacheWriteTokens: u.cache_creation_input_tokens ?? 0,
  };
}

export function createAiGateway(options: GatewayOptions) {
  const now = options.now ?? (() => new Date());
  const tasks = new Map(options.tasks.map((t) => [t.id, t]));
  const cap = Number(options.env.AI_DAILY_COST_CAP_USD ?? "");

  function taskFor(taskId: string): AiTask {
    const task = tasks.get(taskId);
    if (!task) throw new AiError(`Unknown AI task "${taskId}".`, "unknown_task");
    return task;
  }

  async function guard(ctx: AiContext): Promise<Anthropic> {
    if (!options.client) throw new AiUnavailableError();
    if (Number.isFinite(cap) && cap > 0) {
      const spent = await options.log.spentSince(ctx.startupId, startOfUtcDay(now()));
      if (spent >= cap) throw new AiCostCapError(cap);
    }
    return options.client;
  }

  async function systemFor(task: AiTask, ctx: AiContext) {
    const summary =
      task.context.length > 0 && ctx.contextSummary ? await ctx.contextSummary(task.context) : "";
    // Stable first (base rules, task prompt), then the startup summary; the
    // breakpoint on the last block caches all three for repeat calls.
    return [
      { type: "text" as const, text: BASE_SYSTEM },
      { type: "text" as const, text: task.system },
      {
        type: "text" as const,
        text: `<startup_context>\n${summary || "(nothing approved yet)"}\n</startup_context>`,
        cache_control: { type: "ephemeral" as const },
      },
    ];
  }

  function fallbackParams(model: string) {
    return modelInfo(model).fallbacks
      ? { betas: [FALLBACK_BETA], fallbacks: "default" as const }
      : {};
  }

  return {
    /** Run a structured task and return its checked, labelled result. */
    async run<T>(taskId: string, rawInput: unknown, ctx: AiContext): Promise<AiResult<T>> {
      const task = taskFor(taskId);
      const input = task.input.safeParse(rawInput);
      if (!input.success) throw new AiError(`Bad input for ${taskId}.`, "bad_input");
      const client = await guard(ctx);
      const model = modelForTier(task.tier, options.env);
      const envelope = Envelope(task.output);
      const started = Date.now();
      const base = { startupId: ctx.startupId, task: task.id, promptVersion: task.promptVersion };

      let response;
      try {
        response = await client.beta.messages.parse({
          model,
          max_tokens: task.maxTokens,
          system: await systemFor(task, ctx),
          messages: [{ role: "user", content: `<input>\n${JSON.stringify(input.data)}\n</input>` }],
          output_config: {
            format: betaZodOutputFormat(envelope),
            ...(task.effort ? { effort: task.effort } : {}),
          },
          ...fallbackParams(model),
        });
      } catch (err) {
        await options.log.record({
          ...base,
          model,
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          costUsd: 0,
          latencyMs: Date.now() - started,
          outcome: "error",
        });
        if (
          err instanceof Anthropic.APIConnectionError ||
          err instanceof Anthropic.InternalServerError
        ) {
          throw new AiUnavailableError();
        }
        if (
          err instanceof Anthropic.AuthenticationError ||
          err instanceof Anthropic.PermissionDeniedError
        ) {
          throw new AiUnavailableError("The AI service rejected BluSlate's API key.");
        }
        if (err instanceof Anthropic.RateLimitError) {
          throw new AiUnavailableError("The AI service is busy. Try again in a minute.");
        }
        throw err;
      }

      const servedBy = response.model ?? model;
      const usage = usageOf(response.usage);
      const cost = costUsd(servedBy, usage);
      const record = (outcome: AiCallRecord["outcome"]) =>
        options.log.record({
          ...base,
          model: servedBy,
          ...usage,
          costUsd: cost,
          latencyMs: Date.now() - started,
          outcome,
        });

      if (response.stop_reason === "refusal") {
        await record("refusal");
        throw new AiRefusalError(response.stop_details?.category ?? null);
      }

      const problems: string[] = [];
      if (response.stop_reason === "max_tokens") problems.push("the answer was cut off");
      const parsed = envelope.safeParse(response.parsed_output);
      if (!parsed.success) problems.push("the answer didn't match the expected format");
      const out = parsed.success ? (parsed.data as z.infer<typeof envelope>) : null;
      if (out) {
        problems.push(...(task.check?.(out.items) ?? []));
        if (out.sourceIds.length > 0) {
          const known = new Set((await ctx.knownSources?.(out.sourceIds)) ?? []);
          const missing = out.sourceIds.filter((id) => !known.has(id));
          if (missing.length > 0) problems.push(`unknown sources: ${missing.join(", ")}`);
        }
        if (task.narrative) {
          const invented = inventedNumbers(out.items, input.data);
          if (invented.length > 0)
            problems.push(`numbers not in the input: ${invented.join(", ")}`);
        }
      }
      if (!out || problems.length > 0) {
        await record("invalid");
        throw new AiInvalidOutputError(problems);
      }

      await record("ok");
      return {
        items: out.items as T,
        rationale: out.rationale,
        unknowns: out.unknowns,
        sourceIds: out.sourceIds,
        confidence: out.confidence,
        label:
          out.sourceIds.length > 0 && task.defaultLabel !== "SYNTHETIC"
            ? "SOURCED"
            : task.defaultLabel,
        model: servedBy,
        usage,
        costUsd: cost,
      };
    },

    /**
     * Stream a chat reply (interviews, AI rail, negotiation, consultant). Yields
     * text as it arrives; usage is logged when the stream ends.
     */
    async *stream(
      taskId: string,
      messages: Anthropic.Beta.Messages.BetaMessageParam[],
      ctx: AiContext,
    ): AsyncGenerator<string, void, undefined> {
      const task = taskFor(taskId);
      const client = await guard(ctx);
      const model = modelForTier(task.tier, options.env);
      const started = Date.now();
      const stream = client.beta.messages.stream({
        model,
        max_tokens: task.maxTokens,
        system: await systemFor(task, ctx),
        messages,
        ...(task.effort ? { output_config: { effort: task.effort } } : {}),
        ...fallbackParams(model),
      });
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield event.delta.text;
        }
      }
      const final = await stream.finalMessage();
      const servedBy = final.model ?? model;
      const usage = usageOf(final.usage);
      await options.log.record({
        startupId: ctx.startupId,
        task: task.id,
        model: servedBy,
        promptVersion: task.promptVersion,
        ...usage,
        costUsd: costUsd(servedBy, usage),
        latencyMs: Date.now() - started,
        outcome: final.stop_reason === "refusal" ? "refusal" : "ok",
      });
      if (final.stop_reason === "refusal")
        throw new AiRefusalError(final.stop_details?.category ?? null);
    },

    /** Whether a model is configured at all (the UI shows the manual path otherwise). */
    available(): boolean {
      return options.client !== null;
    },
  };
}

export type AiGateway = ReturnType<typeof createAiGateway>;

/**
 * The app's Anthropic client, or null when no key is set. Uses the SDK's
 * built-in retries with backoff for 408/409/429/5xx and connection errors.
 */
export function createAnthropicClient(env: { ANTHROPIC_API_KEY?: string }): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 3, timeout: 60_000 });
}
