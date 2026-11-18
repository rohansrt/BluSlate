import { describe, expect, it } from "vitest";
import {
  canContinue,
  onboardingSchema,
  parseDraft,
  toStartupCreate,
  type OnboardingDraft,
} from "./onboarding";

const riyaIdea: OnboardingDraft = {
  firstName: "  Riya ",
  path: "new-idea",
  newIdeaMode: "idea",
  idea: "Cheaper e-bike rentals for students",
};

describe("onboarding: new idea", () => {
  it("creates a startup named after the founder, with no market chosen yet", () => {
    const parsed = parseDraft(riyaIdea);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(toStartupCreate(parsed.data)).toMatchObject({
      name: "Riya's idea",
      stage: "idea",
      businessType: null,
      // The market is chosen later, in Customer Discovery or Market Research (decision 0012).
      geography: "",
      currency: "INR",
      marketCountry: null,
      entryPath: "NEW_IDEA",
      highlightPillar: "discover",
    });
  });

  it("still honours a country saved by an older version of the card", () => {
    const parsed = parseDraft({ ...riyaIdea, city: "Pune", country: "GB" });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(toStartupCreate(parsed.data)).toMatchObject({
      geography: "Pune, United Kingdom",
      currency: "GBP",
      marketCountry: "GB",
    });
  });

  it("keeps the idea exactly as typed (trimmed), as a founder statement", () => {
    const parsed = parseDraft({ ...riyaIdea, idea: "  Cheaper e-bikes  " });
    expect(parsed.success && parsed.data.path === "new-idea" && parsed.data.details).toMatchObject({
      mode: "idea",
      idea: "Cheaper e-bikes",
    });
  });

  it("accepts 'help me discover' with an interest area instead of an idea", () => {
    const parsed = parseDraft({
      ...riyaIdea,
      newIdeaMode: "discover",
      idea: undefined,
      interest: "student transport",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a missing idea or an unknown country", () => {
    expect(parseDraft({ ...riyaIdea, idea: "" }).success).toBe(false);
    expect(parseDraft({ ...riyaIdea, country: "XX" }).success).toBe(false);
  });

  it("rejects an idea longer than one short line", () => {
    expect(parseDraft({ ...riyaIdea, idea: "x".repeat(281) }).success).toBe(false);
  });
});

describe("onboarding: existing startup", () => {
  const existing: OnboardingDraft = {
    firstName: "Arjun",
    path: "existing",
    startupName: "ChaiCart",
    stage: "launched",
    industry: "Food and beverage",
  };

  it("uses the startup's own name and stage", () => {
    const parsed = parseDraft(existing);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(toStartupCreate(parsed.data)).toMatchObject({
      name: "ChaiCart",
      stage: "launched",
      geography: "",
      currency: "INR",
      entryPath: "EXISTING",
      highlightPillar: null,
    });
  });

  it("rejects an unknown stage", () => {
    expect(parseDraft({ ...existing, stage: "unicorn" }).success).toBe(false);
  });
});

describe("onboarding: just one tool", () => {
  it("highlights the chosen pillar", () => {
    const parsed = parseDraft({ firstName: "Sam", path: "one-tool", tool: "market" });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(toStartupCreate(parsed.data)).toMatchObject({
      name: "Sam's Market Research workspace",
      stage: "unspecified",
      entryPath: "ONE_TOOL",
      highlightPillar: "market",
    });
  });

  it("rejects a tool that is not one of the seven pillars", () => {
    expect(parseDraft({ firstName: "Sam", path: "one-tool", tool: "crm" }).success).toBe(false);
  });
});

describe("onboarding: step gating", () => {
  it("step 1 needs only a first name (no age, decision 0012)", () => {
    expect(canContinue(1, {})).toBe(false);
    expect(canContinue(1, { firstName: "   " })).toBe(false);
    expect(canContinue(1, { firstName: "Riya" })).toBe(true);
  });

  it("step 2 needs one of the three paths", () => {
    expect(canContinue(2, { firstName: "Riya" })).toBe(false);
    expect(canContinue(2, { firstName: "Riya", path: "existing" })).toBe(true);
  });

  it("step 3 needs everything the chosen path requires, but no place", () => {
    expect(canContinue(3, { ...riyaIdea, idea: undefined })).toBe(false);
    expect(canContinue(3, riyaIdea)).toBe(true);
  });

  it("rejects a first name that is too long", () => {
    expect(
      onboardingSchema.safeParse({
        path: "one-tool",
        firstName: "x".repeat(61),
        details: { tool: "build" },
      }).success,
    ).toBe(false);
  });
});
