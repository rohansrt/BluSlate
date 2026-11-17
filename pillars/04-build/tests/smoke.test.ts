import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALL_PILLAR_ENTITY_TYPES,
  ENTITY_OWNER,
  PILLAR_ENTITY_TYPES,
  PillarNotBuiltError,
  SHARED_ENTITY_TYPES,
} from "@bluslate/contracts";
import { buildModule } from "../src/module";
import { PLANNED_AI_TASKS } from "../src/ai-tasks";

const known = new Set<string>([...SHARED_ENTITY_TYPES, ...ALL_PILLAR_ENTITY_TYPES]);
const ctx = { startupId: "smoke-test" };

describe("pillar build: skeleton smoke test", () => {
  it("identifies itself with a semver schema version", () => {
    expect(buildModule.id).toBe("build");
    expect(buildModule.schemaVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("writes exactly the entity types §3 gives it", () => {
    expect([...buildModule.writes].sort()).toEqual([...PILLAR_ENTITY_TYPES["build"]].sort());
    for (const t of buildModule.writes) expect(ENTITY_OWNER[t]).toBe("build");
  });

  it("reads the §3.1 types, all known, none of its own", () => {
    const expected: string[] = ["Problem", "Need", "Segment", "Competitor"];
    expect([...buildModule.reads].sort()).toEqual([...expected].sort());
    for (const t of buildModule.reads) {
      expect(known.has(t), t).toBe(true);
      expect((buildModule.writes as readonly string[]).includes(t), t).toBe(false);
    }
  });

  it("works standalone: input validation needs no upstream data", () => {
    expect(buildModule.validateInput({}, ctx).ok).toBe(true);
    expect(
      buildModule.onUpstreamChanged(
        { type: "Startup", logicalId: "x", fromVersion: 1, toVersion: 2 },
        ctx,
      ),
    ).toEqual([]);
  });

  it("refuses to analyse or publish until its Build step", async () => {
    await expect(buildModule.runAnalysis({}, ctx)).rejects.toBeInstanceOf(PillarNotBuiltError);
    await expect(
      buildModule.publish(
        { pillar: "build", payload: {}, createdBy: "founder" },
        { userId: "u", approvedAt: "2026-11-17" },
      ),
    ).rejects.toBeInstanceOf(PillarNotBuiltError);
  });

  it("lists its Appendix A.4 AI tasks", () => {
    expect(PLANNED_AI_TASKS.length).toBeGreaterThan(0);
  });

  it("has a SPEC.md marked as a draft to be deep-defined", () => {
    const spec = readFileSync(path.join(import.meta.dirname, "../SPEC.md"), "utf8");
    expect(spec).toContain("Draft — to be deep-defined");
    expect(spec).toContain("#### 4.4 Pillar 4 — Build");
  });
});
