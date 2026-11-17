import { describe, expect, it } from "vitest";
import { ALL_PILLAR_ENTITY_TYPES, PILLAR_IDS } from "@bluslate/contracts";
import { PILLAR_MODULES } from "./pillar-modules";

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
});
