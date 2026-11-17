import { z } from "zod";
import { COUNTRY_CODES, countryByCode } from "@/lib/countries";
import { PILLAR_IDS, pillarById, type PillarId } from "@/lib/pillars";

/**
 * Home-page onboarding (spec §6.0, §2.1): four short steps on one card.
 *   1. "What should we call you?"   first name
 *   2. "Where are you starting?"    new idea · existing startup · just one tool
 *   3. The one input that path needs
 *   4. "Save your startup"          sign in with email
 *
 * Steps 1–3 work before sign-in; the draft is kept in the browser and turned
 * into a Startup once the founder is signed in. The answers are stored as the
 * founder typed them: they are founder statements, not Twin entities. Discover
 * turns the idea into a Problem in its own, approved step.
 */

export const ENTRY_PATHS = ["new-idea", "existing", "one-tool"] as const;
export type EntryPathId = (typeof ENTRY_PATHS)[number];

export const EXISTING_STAGES = [
  { id: "pre-launch", label: "Pre-launch: building or testing" },
  { id: "launched", label: "Launched: first customers" },
  { id: "growing", label: "Growing: steady revenue" },
] as const;

const EXISTING_STAGE_IDS = EXISTING_STAGES.map((s) => s.id) as [
  (typeof EXISTING_STAGES)[number]["id"],
  ...(typeof EXISTING_STAGES)[number]["id"][],
];

export const LIMITS = {
  firstName: 60,
  idea: 280,
  city: 80,
  startupName: 80,
  industry: 80,
} as const;

const text = (max: number, min = 1) => z.string().trim().min(min).max(max);

export const firstNameSchema = text(LIMITS.firstName);
const city = text(LIMITS.city);
const country = z.enum(COUNTRY_CODES);

/** Path "new idea": an idea in one line, or "help me discover" with an interest area. */
export const newIdeaSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("idea"), idea: text(LIMITS.idea, 3), city, country }),
  z.object({ mode: z.literal("discover"), interest: text(LIMITS.idea, 2), city, country }),
]);

/** Path "existing startup": name, stage, industry and where it operates. */
export const existingSchema = z.object({
  startupName: text(LIMITS.startupName),
  stage: z.enum(EXISTING_STAGE_IDS),
  industry: text(LIMITS.industry),
  city,
  country,
});

/**
 * Path "just one tool": the pillar to open. Country is also asked so every
 * startup has a geography and currency (see docs/decisions/0001).
 */
export const oneToolSchema = z.object({
  tool: z.enum(PILLAR_IDS),
  city: z.string().trim().max(LIMITS.city).optional(),
  country,
});

export const onboardingSchema = z.discriminatedUnion("path", [
  z.object({ path: z.literal("new-idea"), firstName: firstNameSchema, details: newIdeaSchema }),
  z.object({ path: z.literal("existing"), firstName: firstNameSchema, details: existingSchema }),
  z.object({ path: z.literal("one-tool"), firstName: firstNameSchema, details: oneToolSchema }),
]);

export type Onboarding = z.infer<typeof onboardingSchema>;

/** Fields needed to create a Startup row, derived from a validated onboarding. */
export interface StartupCreate {
  name: string;
  stage: string;
  businessType: string | null;
  geography: string;
  currency: string;
  entryPath: "NEW_IDEA" | "EXISTING" | "ONE_TOOL";
  /** The pillar the city should highlight first, if any. */
  highlightPillar: PillarId | null;
  onboarding: Onboarding;
}

function possessive(name: string): string {
  return `${name}'s`;
}

function geography(cityName: string | undefined, countryCode: string): string {
  const countryName = countryByCode(countryCode)?.name ?? countryCode;
  const trimmed = cityName?.trim();
  return trimmed ? `${trimmed}, ${countryName}` : countryName;
}

function currencyFor(countryCode: string): string {
  const found = countryByCode(countryCode);
  if (!found) throw new Error(`Unknown country code: ${countryCode}`);
  return found.currency;
}

/** Turn validated onboarding answers into the Startup to create. Pure; no I/O. */
export function toStartupCreate(input: Onboarding): StartupCreate {
  const owner = possessive(input.firstName);
  switch (input.path) {
    case "new-idea": {
      const d = input.details;
      return {
        name: `${owner} idea`,
        stage: "idea",
        businessType: null,
        geography: geography(d.city, d.country),
        currency: currencyFor(d.country),
        entryPath: "NEW_IDEA",
        highlightPillar: "discover",
        onboarding: input,
      };
    }
    case "existing": {
      const d = input.details;
      return {
        name: d.startupName,
        stage: d.stage,
        businessType: null,
        geography: geography(d.city, d.country),
        currency: currencyFor(d.country),
        entryPath: "EXISTING",
        highlightPillar: null,
        onboarding: input,
      };
    }
    case "one-tool": {
      const d = input.details;
      const pillar = pillarById(d.tool);
      return {
        name: `${owner} ${pillar?.name ?? "tool"} workspace`,
        stage: "unspecified",
        businessType: null,
        geography: geography(d.city, d.country),
        currency: currencyFor(d.country),
        entryPath: "ONE_TOOL",
        highlightPillar: d.tool,
        onboarding: input,
      };
    }
  }
}

/**
 * The draft the card keeps while the founder types. Every field is optional
 * and loosely typed, because it may be half-filled or come from an older
 * version of the card. Validate with `onboardingSchema` before using it.
 */
export interface OnboardingDraft {
  step?: 1 | 2 | 3 | 4;
  firstName?: string;
  path?: EntryPathId;
  newIdeaMode?: "idea" | "discover";
  idea?: string;
  interest?: string;
  startupName?: string;
  stage?: string;
  industry?: string;
  tool?: string;
  city?: string;
  country?: string;
}

/** Build the structured onboarding from a flat draft (does not validate). */
export function draftToOnboarding(draft: OnboardingDraft): unknown {
  const base = { path: draft.path, firstName: draft.firstName };
  switch (draft.path) {
    case "new-idea":
      return {
        ...base,
        details:
          draft.newIdeaMode === "discover"
            ? {
                mode: "discover",
                interest: draft.interest,
                city: draft.city,
                country: draft.country,
              }
            : { mode: "idea", idea: draft.idea, city: draft.city, country: draft.country },
      };
    case "existing":
      return {
        ...base,
        details: {
          startupName: draft.startupName,
          stage: draft.stage,
          industry: draft.industry,
          city: draft.city,
          country: draft.country,
        },
      };
    case "one-tool":
      return {
        ...base,
        details: { tool: draft.tool, city: draft.city || undefined, country: draft.country },
      };
    default:
      return base;
  }
}

/** Validate the draft as a whole. */
export function parseDraft(draft: OnboardingDraft) {
  return onboardingSchema.safeParse(draftToOnboarding(draft));
}

/** Whether the founder may move past `step` with the current draft. */
export function canContinue(step: 1 | 2 | 3, draft: OnboardingDraft): boolean {
  if (step === 1) return firstNameSchema.safeParse(draft.firstName ?? "").success;
  if (step === 2) return ENTRY_PATHS.includes(draft.path as EntryPathId);
  return parseDraft(draft).success;
}
