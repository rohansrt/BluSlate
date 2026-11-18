import { describe, expect, it } from "vitest";
import { follow, followList, goalProgress, type Goal } from "./workspace";

const goal = (done: boolean): Goal => ({
  id: String(Math.random()),
  title: "g",
  value: null,
  done,
});

describe("goalProgress (decision 0012)", () => {
  it("is empty with no goals met, partial with some, complete with all", () => {
    expect(goalProgress([goal(false), goal(false)])).toEqual({ met: 0, total: 2, state: "empty" });
    expect(goalProgress([goal(true), goal(false)])).toEqual({ met: 1, total: 2, state: "partial" });
    expect(goalProgress([goal(true), goal(true)])).toEqual({ met: 2, total: 2, state: "complete" });
  });
});

describe("follow: a linked field follows its source until the founder changes it", () => {
  it("fills an empty field", () => {
    expect(follow("", "Students in Pune", undefined)).toBe("Students in Pune");
    expect(follow<number | null>(null, 1200, undefined)).toBe(1200);
  });
  it("keeps following while it still says what the source said", () => {
    expect(follow("Students", "Students in Pune", "Students")).toBe("Students in Pune");
  });
  it("stops once the founder has changed it", () => {
    expect(follow("Parents", "Students in Pune", "Students")).toBe("Parents");
  });
  it("leaves the field alone when the source has nothing", () => {
    expect(follow("Parents", undefined, "Students")).toBe("Parents");
  });
});

describe("followList", () => {
  it("adds new items and removes the ones the source removed, keeping its own", () => {
    expect(followList(["Auto", "Mine"], ["Auto", "Bus"], ["Auto"])).toEqual([
      "Auto",
      "Mine",
      "Bus",
    ]);
    expect(followList(["Auto", "Mine", "Bus"], ["Bus"], ["Auto", "Bus"])).toEqual(["Mine", "Bus"]);
  });
  it("matches case-insensitively and skips blanks", () => {
    expect(followList(["auto"], ["Auto", " "], [])).toEqual(["auto"]);
  });
});
