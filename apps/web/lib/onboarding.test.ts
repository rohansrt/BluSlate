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
  city: "Pune",
  country: "IN",
};

describe("onboarding: new idea", () => {
  it("creates a startup named after the founder, in their city, in local currency", () => {
    const parsed = parseDraft(riyaIdea);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const startup = toStartupCreate(parsed.data);
    expect(startup).toMatchObject({
      name: "Riya's idea",
      stage: "idea",
      businessType: null,
      geography: "Pune, India",
      currency: "INR",
      entryPath: "NEW_IDEA",
      highlightPillar: "discover",
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

  it("rejects a missing idea, city or unknown country", () => {
    expect(parseDraft({ ...riyaIdea, idea: "" }).success).toBe(false);
    expect(parseDraft({ ...riyaIdea, city: " " }).success).toBe(false);
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
    city: "Bengaluru",
    country: "IN",
  };

  it("uses the startup's own name and stage", () => {
    const parsed = parseDraft(existing);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(toStartupCreate(parsed.data)).toMatchObject({
      name: "ChaiCart",
      stage: "launched",
      geography: "Bengaluru, India",
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
  it("highlights the chosen pillar and works without a city", () => {
    const parsed = parseDraft({
      firstName: "Sam",
      path: "one-tool",
      tool: "market",
      country: "GB",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(toStartupCreate(parsed.data)).toMatchObject({
      name: "Sam's Market workspace",
      stage: "unspecified",
      geography: "United Kingdom",
      currency: "GBP",
      entryPath: "ONE_TOOL",
      highlightPillar: "market",
    });
  });

  it("rejects a tool that is not one of the seven pillars", () => {
    expect(
      parseDraft({ firstName: "Sam", path: "one-tool", tool: "crm", country: "GB" }).success,
    ).toBe(false);
  });
});

describe("onboarding: step gating", () => {
  it("step 1 needs a first name", () => {
    expect(canContinue(1, {})).toBe(false);
    expect(canContinue(1, { firstName: "   " })).toBe(false);
    expect(canContinue(1, { firstName: "Riya" })).toBe(true);
  });

  it("step 2 needs one of the three paths", () => {
    expect(canContinue(2, { firstName: "Riya" })).toBe(false);
    expect(canContinue(2, { firstName: "Riya", path: "existing" })).toBe(true);
  });

  it("step 3 needs everything the chosen path requires", () => {
    expect(canContinue(3, { ...riyaIdea, city: undefined })).toBe(false);
    expect(canContinue(3, riyaIdea)).toBe(true);
  });

  it("rejects a first name that is too long", () => {
    expect(
      onboardingSchema.safeParse({
        path: "one-tool",
        firstName: "x".repeat(61),
        details: { tool: "build", country: "IN" },
      }).success,
    ).toBe(false);
  });
});
