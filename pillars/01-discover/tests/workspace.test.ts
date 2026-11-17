import { describe, expect, it } from "vitest";
import {
  composeStatement,
  discoverStateSchema,
  discoverWorkspace,
  isTestable,
  opportunityScore,
  problemChecks,
  quadrant,
  rankHypotheses,
  robustness,
  solutionSignals,
  timeCostDays,
  type DiscoverState,
} from "../src/workspace";

const ctx = {
  startup: {
    name: "Ride",
    geography: "Pune, IN",
    currency: "INR",
    idea: "Affordable e-bike rental for college students",
  },
  upstream: {},
};

function fixture(): DiscoverState {
  const s = discoverStateSchema.parse({});
  return {
    ...s,
    who: "College students in Pune who live 3–8 km from campus and don't own a two-wheeler",
    pain: "lose time and money getting to class",
    frequencyBand: "most-days",
    severity: 4,
    costOfPain: "40–60 minutes and ₹60–₹120 a day",
    alternatives: [
      { id: "a1", name: "Walking", kind: "diy" },
      { id: "a2", name: "The city bus", kind: "service" },
      { id: "a3", name: "Autos and bike taxis", kind: "service" },
    ],
    whyNow: "E-bikes and app unlocking have become cheaper",
    parkedSolution: "Affordable e-bike rental for college students",
    opportunities: [
      {
        id: "A",
        title: "Daily commute",
        severity: 4,
        frequency: 5,
        urgency: 3,
        workaroundStrength: 3,
        feasibility: 4,
      },
      {
        id: "B",
        title: "Late evenings",
        severity: 4,
        frequency: 3,
        urgency: 4,
        workaroundStrength: 2,
        feasibility: 3,
      },
      {
        id: "C",
        title: "Weekend trips",
        severity: 2,
        frequency: 2,
        urgency: 2,
        workaroundStrength: 4,
        feasibility: 4,
      },
    ],
    hypotheses: [
      {
        id: "h1",
        kind: "desirability",
        statement: "Students living 3–8 km away spend more than 30 minutes each way",
        risk: 4,
        uncertainty: 3,
        testMethod: "interviews",
        success: "At least 6 of 10 say yes",
      },
      {
        id: "h2",
        kind: "viability",
        statement: "These students would pay ₹40 or more a day for a reliable ride",
        risk: 5,
        uncertainty: 5,
        testMethod: "interviews",
        success: "At least 5 of 10 spend ₹40+ a day",
      },
      {
        id: "h3",
        kind: "desirability",
        statement: "Buses and autos fail these students often enough that they'd switch",
        risk: 4,
        uncertainty: 4,
        testMethod: "interviews",
        success: "Most describe a bad trip",
      },
      {
        id: "h4",
        kind: "feasibility",
        statement: "The college will allow parking and charging near the main gate",
        risk: 5,
        uncertainty: 4,
        testMethod: "interviews",
        success: "At least 1 trial spot agreed",
      },
      {
        id: "h5",
        kind: "feasibility",
        statement: "Enough students live 3–8 km away to keep 50 bikes busy",
        risk: 3,
        uncertainty: 4,
        testMethod: "desk research",
        success: "More than 1,000 students in the band",
      },
      {
        id: "h6",
        kind: "feasibility",
        statement: "Cheaper e-bikes and app unlocking make a small fleet affordable",
        risk: 2,
        uncertainty: 3,
        testMethod: "desk research",
        success: "At least 2 suppliers quote within budget",
      },
    ],
  };
}

describe("discover workspace (SPEC.md §14 fixture)", () => {
  it("scores the framings 3.9 / 3.6 / 2.4 and calls it a clear winner", () => {
    const s = fixture();
    expect(s.opportunities.map((o) => opportunityScore(o, s.weights)!.toFixed(1))).toEqual([
      "3.9",
      "3.6",
      "2.4",
    ]);
    expect(robustness(s)).toBe("clear");
  });

  it("inverts workaround strength into a gap", () => {
    const s = fixture();
    expect(
      opportunityScore({ ...s.opportunities[0]!, workaroundStrength: 1 }, s.weights)!.toFixed(1),
    ).toBe("4.1");
    expect(opportunityScore({ ...s.opportunities[0]!, urgency: null }, s.weights)).toBeNull();
  });

  it("ranks beliefs by risk × uncertainty with the risk tie-break, and places them in quadrants", () => {
    const s = fixture();
    expect(rankHypotheses(s).map((r) => r.h.id)).toEqual(["h2", "h4", "h3", "h1", "h5", "h6"]);
    expect(s.hypotheses.map(quadrant)).toEqual([
      "Confirm",
      "Test first",
      "Test first",
      "Test first",
      "Explore later",
      "Safe for now",
    ]);
    expect(s.hypotheses.every(isTestable)).toBe(true);
  });

  it("flags solution words, but not the people the problem is about", () => {
    expect(
      solutionSignals(
        "Affordable e-bike rental for college students",
        "Affordable e-bike rental for college students",
        "College students",
      ),
    ).toEqual(expect.arrayContaining(["e-bike", "rental"]));
    expect(problemChecks(fixture()).every((c) => c.pass)).toBe(true);
    expect(problemChecks({ ...fixture(), who: "everyone" })[1]!.pass).toBe(false);
  });

  it("composes a statement and costs 4 simulated days", () => {
    const s = fixture();
    expect(composeStatement(s)).toBe(
      "College students in Pune who live 3–8 km from campus and don't own a two-wheeler lose time and money getting to class almost every day. Today they get by with walking, the city bus or autos and bike taxis, which costs them 40–60 minutes and ₹60–₹120 a day.",
    );
    expect(timeCostDays(s)).toBe(4);
  });

  it("parks a solution-sounding onboarding idea instead of using it as the problem", () => {
    const s = discoverWorkspace.initial(ctx);
    expect(s.parkedSolution).toBe(ctx.startup.idea);
    expect(s.pain).toBe("");
  });
});
