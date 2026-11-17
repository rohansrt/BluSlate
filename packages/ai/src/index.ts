// AI gateway: ai.run(taskId, input, ctx), task registry, model tiers (§11.3, Appendix A.0).
export * from "./errors";
export * from "./registry";
export * from "./task";
export * from "./checks";
export { Envelope } from "./envelope";
export { BASE_SYSTEM } from "./prompts";
export {
  createAiGateway,
  createAnthropicClient,
  type AiCallLog,
  type AiCallRecord,
  type AiContext,
  type AiGateway,
  type AiResult,
  type GatewayOptions,
  type ModelResolver,
  type ResolvedModel,
} from "./gateway";
export { explainTask, CORE_TASKS } from "./tasks/core";
