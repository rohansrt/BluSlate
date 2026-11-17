import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  AiCostCapError,
  AiInvalidOutputError,
  AiRefusalError,
  AiUnavailableError,
  BASE_SYSTEM,
  costUsd,
  createAiGateway,
  defineTask,
  explainTask,
  inventedNumbers,
  type AiCallRecord,
} from "./index";

/**
 * The gateway is tested against a fake client: no network, no spend. The fake
 * records the request so we can check what the gateway sends.
 */

const ENV = {
  AI_MODEL_TOP: "claude-opus-5-5",
  AI_MODEL_STANDARD: "claude-sonnet-5-5",
  AI_MODEL_FAST: "claude-haiku-5-5",
};

const GOOD = {
  items: {
    concept: "A problem statement names who struggles and how.",
    example: "For example, commuters who miss trains.",
    questions: ["Who did you last see struggle with this?", "What did they do about it?"],
  },
  rationale: "Start with who has the problem.",
  unknowns: [],
  sourceIds: [],
  confidence: "medium",
};

function fakeClient(
  response: Partial<{
    parsed_output: unknown;
    stop_reason: string;
    model: string;
    stop_details: unknown;
  }> = {},
) {
  const parse = vi.fn(async () => ({
    model: response.model ?? "claude-haiku-5-5",
    stop_reason: response.stop_reason ?? "end_turn",
    stop_details: response.stop_details ?? null,
    parsed_output: "parsed_output" in response ? response.parsed_output : GOOD,
    usage: {
      input_tokens: 1000,
      output_tokens: 200,
      cache_read_input_tokens: 3000,
      cache_creation_input_tokens: 0,
    },
  }));
  return { client: { beta: { messages: { parse } } } as unknown as Anthropic, parse };
}

function memoryLog(spent = 0) {
  const calls: AiCallRecord[] = [];
  return {
    calls,
    log: {
      record: async (c: AiCallRecord) => {
        calls.push(c);
      },
      spentSince: async () => spent,
    },
  };
}

const ctx = {
  startupId: "s1",
  contextSummary: vi.fn(async () => "Problem v1 (ASSUMED): students are late"),
};

const input = { pillar: "discover", question: "What problem do people have?" };

describe("AI gateway: one front door", () => {
  it("falls back cleanly when no API key is configured", async () => {
    const { log } = memoryLog();
    const ai = createAiGateway({ client: null, env: ENV, log, tasks: [explainTask] });
    expect(ai.available()).toBe(false);
    await expect(ai.run("core.explain", input, ctx)).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it("uses the tier's model from env, caches the stable prompt and treats input as data", async () => {
    const { client, parse } = fakeClient();
    const { log } = memoryLog();
    const ai = createAiGateway({ client, env: ENV, log, tasks: [explainTask] });
    await ai.run("core.explain", input, ctx);

    const req = (parse.mock.calls[0] as unknown as [Record<string, unknown>])[0] as {
      model: string;
      system: { text: string; cache_control?: unknown }[];
      messages: { content: string }[];
      output_config: { effort?: string; format: unknown };
      fallbacks?: unknown;
    };
    expect(req.model).toBe("claude-haiku-5-5");
    expect(req.system[0]?.text).toBe(BASE_SYSTEM);
    expect(req.system[2]?.text).toContain("<startup_context>");
    expect(req.system[2]?.cache_control).toEqual({ type: "ephemeral" });
    expect(req.messages[0]?.content).toMatch(/^<input>\n.*\n<\/input>$/s);
    expect(req.output_config.effort).toBe("low");
    expect(req.output_config.format).toBeDefined();
    // Haiku has no server-side fallbacks.
    expect(req.fallbacks).toBeUndefined();
  });

  it("turns on refusal fallbacks for models that support them", async () => {
    const { client, parse } = fakeClient({ model: "claude-sonnet-5-5" });
    const { log } = memoryLog();
    const task = defineTask({ ...explainTask, id: "core.standard", tier: "standard" });
    const ai = createAiGateway({ client, env: ENV, log, tasks: [task] });
    await ai.run("core.standard", input, ctx);
    const req = (parse.mock.calls[0] as unknown as [{ fallbacks?: unknown; betas?: string[] }])[0];
    expect(req.fallbacks).toBe("default");
    expect(req.betas).toEqual(["server-side-fallback-2026-07-01"]);
  });

  it("labels the result itself and logs tokens and cost", async () => {
    const { client } = fakeClient();
    const { log, calls } = memoryLog();
    const ai = createAiGateway({ client, env: ENV, log, tasks: [explainTask] });
    const result = await ai.run<typeof GOOD.items>("core.explain", input, ctx);
    expect(result.label).toBe("ASSUMED");
    expect(result.items.questions).toHaveLength(2);
    expect(calls[0]).toMatchObject({
      task: "core.explain",
      model: "claude-haiku-5-5",
      promptVersion: "1.0.0",
      inputTokens: 1000,
      outputTokens: 200,
      cacheReadTokens: 3000,
      outcome: "ok",
    });
    expect(calls[0]?.costUsd).toBeCloseTo((1000 * 0.1 + 200 * 0.5 + 3000 * 0.01) / 1e6, 9);
  });

  it("only passes this task's allowed entity types to the context builder", async () => {
    const { client } = fakeClient();
    const { log } = memoryLog();
    const narrow = defineTask({ ...explainTask, id: "core.narrow", context: ["Problem"] });
    const ai = createAiGateway({ client, env: ENV, log, tasks: [narrow] });
    ctx.contextSummary.mockClear();
    await ai.run("core.narrow", input, ctx);
    expect(ctx.contextSummary).toHaveBeenCalledWith(["Problem"]);
  });
});

describe("AI gateway: checks before anything reaches the founder", () => {
  it("rejects output that breaks the task's bounds", async () => {
    const { client } = fakeClient({
      parsed_output: { ...GOOD, items: { ...GOOD.items, questions: ["Only one?"] } },
    });
    const { log, calls } = memoryLog();
    const ai = createAiGateway({ client, env: ENV, log, tasks: [explainTask] });
    await expect(ai.run("core.explain", input, ctx)).rejects.toBeInstanceOf(AiInvalidOutputError);
    expect(calls[0]?.outcome).toBe("invalid");
  });

  it("rejects sources that don't exist, and marks real ones SOURCED (G2)", async () => {
    const cited = { ...GOOD, sourceIds: ["src-1", "src-404"] };
    const { client } = fakeClient({ parsed_output: cited });
    const { log } = memoryLog();
    const ai = createAiGateway({ client, env: ENV, log, tasks: [explainTask] });
    const withSources = { ...ctx, knownSources: async () => ["src-1"] };
    await expect(ai.run("core.explain", input, withSources)).rejects.toThrow(
      "unknown sources: src-404",
    );

    const ok = fakeClient({ parsed_output: { ...GOOD, sourceIds: ["src-1"] } });
    const ai2 = createAiGateway({ client: ok.client, env: ENV, log, tasks: [explainTask] });
    expect((await ai2.run("core.explain", input, withSources)).label).toBe("SOURCED");
  });

  it("rejects numbers a narrative task made up (G3)", async () => {
    const narrate = defineTask({
      id: "test.narrate",
      pillar: "run-grow",
      tier: "fast",
      promptVersion: "1.0.0",
      system: "Narrate.",
      context: [],
      input: z.object({ revenue: z.number() }),
      output: z.object({ text: z.string() }),
      narrative: true,
      defaultLabel: "SYNTHETIC",
      maxTokens: 500,
    });
    const bad = fakeClient({
      parsed_output: { ...GOOD, items: { text: "Revenue hit 12,500, up 40%." } },
    });
    const { log } = memoryLog();
    const ai = createAiGateway({ client: bad.client, env: ENV, log, tasks: [narrate] });
    await expect(ai.run("test.narrate", { revenue: 12500 }, ctx)).rejects.toThrow(
      "numbers not in the input: 40",
    );

    const good = fakeClient({ parsed_output: { ...GOOD, items: { text: "Revenue hit 12,500." } } });
    const ai2 = createAiGateway({ client: good.client, env: ENV, log, tasks: [narrate] });
    expect((await ai2.run("test.narrate", { revenue: 12500 }, ctx)).label).toBe("SYNTHETIC");
  });

  it("surfaces a refusal instead of an answer", async () => {
    const { client } = fakeClient({ stop_reason: "refusal", stop_details: { category: "cyber" } });
    const { log, calls } = memoryLog();
    const ai = createAiGateway({ client, env: ENV, log, tasks: [explainTask] });
    const err = await ai.run("core.explain", input, ctx).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AiRefusalError);
    expect((err as AiRefusalError).category).toBe("cyber");
    expect(calls[0]?.outcome).toBe("refusal");
  });

  it("stops at the daily cost cap without calling the model", async () => {
    const { client, parse } = fakeClient();
    const { log } = memoryLog(5.01);
    const ai = createAiGateway({
      client,
      env: { ...ENV, AI_DAILY_COST_CAP_USD: "5" },
      log,
      tasks: [explainTask],
    });
    await expect(ai.run("core.explain", input, ctx)).rejects.toBeInstanceOf(AiCostCapError);
    expect(parse).not.toHaveBeenCalled();
  });

  it("validates input before spending anything", async () => {
    const { client, parse } = fakeClient();
    const { log } = memoryLog();
    const ai = createAiGateway({ client, env: ENV, log, tasks: [explainTask] });
    await expect(
      ai.run("core.explain", { pillar: "nope", question: "?" }, ctx),
    ).rejects.toMatchObject({ code: "bad_input" });
    await expect(ai.run("core.unknown", input, ctx)).rejects.toMatchObject({
      code: "unknown_task",
    });
    expect(parse).not.toHaveBeenCalled();
  });
});

describe("AI gateway: streaming", () => {
  it("yields text as it arrives and logs usage at the end", async () => {
    const events = [
      { type: "content_block_delta", delta: { type: "text_delta", text: "Hello " } },
      { type: "content_block_delta", delta: { type: "text_delta", text: "Riya" } },
    ];
    const stream = {
      async *[Symbol.asyncIterator]() {
        yield* events;
      },
      finalMessage: async () => ({
        model: "claude-haiku-5-5",
        stop_reason: "end_turn",
        stop_details: null,
        usage: { input_tokens: 10, output_tokens: 2 },
      }),
    };
    const client = { beta: { messages: { stream: vi.fn(() => stream) } } } as unknown as Anthropic;
    const { log, calls } = memoryLog();
    const ai = createAiGateway({ client, env: ENV, log, tasks: [explainTask] });
    const chunks: string[] = [];
    for await (const t of ai.stream("core.explain", [{ role: "user", content: "Hi" }], ctx))
      chunks.push(t);
    expect(chunks.join("")).toBe("Hello Riya");
    expect(calls[0]).toMatchObject({ outputTokens: 2, outcome: "ok" });
  });
});

describe("pricing and number checks", () => {
  it("prices Haiku's long prompts at the higher rate", () => {
    expect(
      costUsd("claude-haiku-5-5", {
        inputTokens: 1_000_000,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      }),
    ).toBe(0.5);
    expect(
      costUsd("claude-haiku-5-5", {
        inputTokens: 50_000,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      }),
    ).toBe(0.005);
  });

  it("prices unknown models high so caps err on the safe side", () => {
    expect(
      costUsd("claude-mystery", {
        inputTokens: 1_000_000,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      }),
    ).toBe(10);
  });

  it("finds numbers in text that the input doesn't contain", () => {
    expect(inventedNumbers({ a: ["Churn fell to 4.5% from 6"] }, { churn: 6 })).toEqual(["4.5"]);
    expect(inventedNumbers("Cash is 1,20,000", { cash: 120000 })).toEqual([]);
  });
});

describe("AI gateway: model registry resolver", () => {
  it("uses the model the registry picks for the task, at the admin's prices", async () => {
    const { client, parse } = fakeClient({ model: "claude-custom-1" });
    const { log, calls } = memoryLog();
    const resolve = vi.fn(async () => ({
      client,
      model: "claude-custom-1",
      price: { input: 1, output: 2, cacheRead: 0.1, cacheWrite: 1.25, fallbacks: false },
    }));
    const ai = createAiGateway({ resolve, env: {}, log, tasks: [explainTask] });
    await ai.run("core.explain", input, ctx);
    expect(resolve).toHaveBeenCalledWith(explainTask, ctx);
    expect((parse.mock.calls[0] as unknown as [{ model: string }])[0].model).toBe(
      "claude-custom-1",
    );
    expect(calls[0]?.costUsd).toBeCloseTo((1000 * 1 + 200 * 2 + 3000 * 0.1) / 1e6, 9);
  });

  it("is unavailable when no model is assigned", async () => {
    const { log } = memoryLog();
    const ai = createAiGateway({ resolve: async () => null, env: {}, log, tasks: [explainTask] });
    await expect(ai.run("core.explain", input, ctx)).rejects.toBeInstanceOf(AiUnavailableError);
  });
});
