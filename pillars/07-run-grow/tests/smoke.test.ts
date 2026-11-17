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
import { runGrowModule, runGrowStarter } from "../src/module";
import { PLANNED_AI_TASKS } from "../src/ai-tasks";

const known = new Set<string>([...SHARED_ENTITY_TYPES, ...ALL_PILLAR_ENTITY_TYPES]);
const ctx = { startupId: "smoke-test" };

describe("pillar run-grow: skeleton smoke test", () => {
  it("identifies itself with a semver schema version", () => {
    expect(runGrowModule.id).toBe("run-grow");
    expect(runGrowModule.schemaVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("writes exactly the entity types §3 gives it", () => {
    expect([...runGrowModule.writes].sort()).toEqual([...PILLAR_ENTITY_TYPES["run-grow"]].sort());
    for (const t of runGrowModule.writes) expect(ENTITY_OWNER[t]).toBe("run-grow");
  });

  it("reads the §3.1 types, all known, none of its own", () => {
    const expected: string[] = [
      "Startup",
      ...ALL_PILLAR_ENTITY_TYPES.filter((t) => ENTITY_OWNER[t] !== "run-grow"),
    ];
    expect([...runGrowModule.reads].sort()).toEqual([...expected].sort());
    for (const t of runGrowModule.reads) {
      expect(known.has(t), t).toBe(true);
      expect((runGrowModule.writes as readonly string[]).includes(t), t).toBe(false);
    }
  });

  it("works standalone: input validation needs no upstream data", () => {
    expect(runGrowModule.validateInput({}, ctx).ok).toBe(true);
    expect(
      runGrowModule.onUpstreamChanged(
        { type: "Startup", logicalId: "x", fromVersion: 1, toVersion: 2 },
        ctx,
      ),
    ).toEqual([]);
  });

  it("refuses to analyse or publish until its Build step", async () => {
    await expect(runGrowModule.runAnalysis({}, ctx)).rejects.toBeInstanceOf(PillarNotBuiltError);
    await expect(
      runGrowModule.publish(
        { pillar: "run-grow", payload: {}, createdBy: "founder" },
        { userId: "u", approvedAt: "2026-11-17" },
      ),
    ).rejects.toBeInstanceOf(PillarNotBuiltError);
  });

  it("asks a first question whose answer is an entity it owns", () => {
    expect(runGrowModule.writes).toContain(runGrowStarter.entityType);
    expect(runGrowStarter.question.length).toBeGreaterThan(10);
  });

  it("lists its Appendix A.7 AI tasks", () => {
    expect(PLANNED_AI_TASKS.length).toBeGreaterThan(0);
  });

  it("has a SPEC.md marked as a draft to be deep-defined", () => {
    const spec = readFileSync(path.join(import.meta.dirname, "../SPEC.md"), "utf8");
    expect(spec).toContain("Draft — to be deep-defined");
    expect(spec).toContain("#### 4.7 Pillar 7 — Launch & Growth");
  });
});
