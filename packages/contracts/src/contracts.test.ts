import { describe, expect, it } from "vitest";
import {
  ALL_PILLAR_ENTITY_TYPES,
  ENTITY_OWNER,
  PILLARS,
  PILLAR_ENTITY_TYPES,
  PILLAR_IDS,
  SHARED_ENTITY_TYPES,
} from "./index";

describe("contracts: pillars", () => {
  it("lists the seven pillars in spec order, numbered 1 to 7", () => {
    expect(PILLARS.map((p) => p.id)).toEqual([...PILLAR_IDS]);
    expect(PILLARS.map((p) => p.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("names each pillar's folder and package after its id", () => {
    for (const p of PILLARS) {
      expect(p.folder).toBe(`0${p.number}-${p.id}`);
      expect(p.packageName).toBe(`@bluslate/pillar-${p.id}`);
    }
  });
});

describe("contracts: single writer (§3)", () => {
  it("gives every pillar-owned entity type exactly one owner", () => {
    const counts = new Map<string, number>();
    for (const types of Object.values(PILLAR_ENTITY_TYPES)) {
      for (const t of types) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    for (const [type, count] of counts) expect(count, type).toBe(1);
    expect(Object.keys(ENTITY_OWNER).sort()).toEqual([...ALL_PILLAR_ENTITY_TYPES].sort());
  });

  it("never lets a pillar own a shared type", () => {
    for (const shared of SHARED_ENTITY_TYPES) {
      expect(ALL_PILLAR_ENTITY_TYPES as string[]).not.toContain(shared);
    }
  });
});
