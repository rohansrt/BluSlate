import { describe, expect, it } from "vitest";
import { entityStatus, pillarStatus } from "./status";

describe("entity status", () => {
  it.each([
    [{ hasPublished: false, stale: false, draft: null }, "NOT_STARTED"],
    [{ hasPublished: false, stale: false, draft: "DRAFT" }, "DRAFT"],
    [{ hasPublished: true, stale: false, draft: null }, "APPROVED"],
    [{ hasPublished: true, stale: true, draft: null }, "MAY_BE_OUTDATED"],
    [{ hasPublished: true, stale: true, draft: "DRAFT" }, "DRAFT"],
    [{ hasPublished: true, stale: false, draft: "NEEDS_REVIEW" }, "NEEDS_REVIEW"],
  ] as const)("%o → %s", (input, expected) => {
    expect(entityStatus(input)).toBe(expected);
  });
});

describe("pillar status", () => {
  it("puts anything needing a look first", () => {
    expect(pillarStatus(["APPROVED", "MAY_BE_OUTDATED", "DRAFT"]).status).toBe("needs_review");
    expect(pillarStatus(["APPROVED", "DRAFT"]).status).toBe("draft");
    expect(pillarStatus(["APPROVED"]).status).toBe("approved");
    expect(pillarStatus([]).status).toBe("not_started");
  });
});
