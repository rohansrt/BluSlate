/** Errors the Twin raises. Each maps to a guardrail or contract rule. */
export class TwinError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Architecture rule 3 / §3: only the owning pillar may publish a type. */
export class SingleWriterError extends TwinError {
  constructor(pillar: string, type: string, owner: string | undefined) {
    super(
      owner
        ? `Pillar "${pillar}" cannot publish ${type}; only "${owner}" can.`
        : `${type} is not a pillar-owned entity type and cannot be published by a pillar.`,
      "single_writer",
    );
  }
}

/** G5: publishing needs a founder's approval from a user session. */
export class ApprovalRequiredError extends TwinError {
  constructor(reason: string) {
    super(`Publishing needs the founder's approval: ${reason}`, "approval_required");
  }
}

export class NotFoundError extends TwinError {
  constructor(what: string) {
    super(`${what} was not found.`, "not_found");
  }
}

export class EntityValidationError extends TwinError {
  constructor(
    type: string,
    readonly issues: unknown,
  ) {
    super(`The ${type} data does not match its schema.`, "invalid_entity");
  }
}
