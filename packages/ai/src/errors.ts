/** Gateway errors. Callers fall back to manual input for all of them (§11.3 Failure). */
export type AiErrorCode =
  "ai_unavailable" | "cost_cap" | "refusal" | "invalid_output" | "unknown_task" | "bad_input";

export class AiError extends Error {
  constructor(
    message: string,
    readonly code: AiErrorCode,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class AiUnavailableError extends AiError {
  constructor(reason = "The AI service isn't configured or can't be reached.") {
    super(reason, "ai_unavailable");
  }
}

export class AiCostCapError extends AiError {
  constructor(capUsd: number) {
    super(`Today's AI budget for this startup ($${capUsd.toFixed(2)}) has been used.`, "cost_cap");
  }
}

export class AiRefusalError extends AiError {
  constructor(readonly category: string | null) {
    super("The AI declined this request.", "refusal");
  }
}

export class AiInvalidOutputError extends AiError {
  constructor(readonly problems: string[]) {
    super(`The AI's answer didn't pass checks: ${problems.join("; ")}`, "invalid_output");
  }
}
