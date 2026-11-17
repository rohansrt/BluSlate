import { describe, expect, it } from "vitest";
import { ALL_PILLAR_ENTITY_TYPES, ENTITY_SCHEMAS, PILLAR_IDS } from "@bluslate/contracts";
import { PILLAR_MODULES, PILLAR_STARTERS } from "./pillar-modules";

describe("pillar registry", () => {
  it("registers all seven pillars under their own ids", () => {
    expect(Object.keys(PILLAR_MODULES).sort()).toEqual([...PILLAR_IDS].sort());
    for (const id of PILLAR_IDS) expect(PILLAR_MODULES[id].id).toBe(id);
  });

  it("gives every pillar-owned entity type exactly one writer across the app", () => {
    const writes = PILLAR_IDS.flatMap((id) => [...PILLAR_MODULES[id].writes]);
    expect(new Set(writes).size).toBe(writes.length);
    expect([...writes].sort()).toEqual([...ALL_PILLAR_ENTITY_TYPES].sort());
  });

  it("gives every pillar a first question it can publish to its own entity", () => {
    for (const id of PILLAR_IDS) {
      const starter = PILLAR_STARTERS[id];
      expect(PILLAR_MODULES[id].writes).toContain(starter.entityType);
      const parsed = ENTITY_SCHEMAS[starter.entityType].safeParse({ [starter.field]: "An answer" });
      expect(parsed.success, id).toBe(true);
      expect((parsed.data as Record<string, unknown>)[starter.field], id).toBe("An answer");
    }
  });
});
