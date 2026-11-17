import { z } from "zod";
import { id, text } from "./common";

/** Pillar 4 · Build (§8.2). */
export const FeatureSchema = z
  .object({
    name: text,
    needIds: z.array(id),
    effortPersonWeeks: z.number(),
    rice: z
      .object({ reach: z.number(), impact: z.number(), confidence: z.number(), effort: z.number() })
      .partial(),
    priority: z.number(),
    inScope: z.boolean(),
  })
  .partial();

export const ARCHETYPES = [
  "digital_subscription",
  "physical_product",
  "shop",
  "recurring_service",
  "marketplace",
  "mixed_b2b",
] as const;

export const OfferingSchema = z
  .object({
    archetype: z.enum(ARCHETYPES),
    mvpType: text,
    featureIds: z.array(id),
    mockupRef: text,
    testResults: z.array(text),
  })
  .partial();

export const ValuePropositionSchema = z
  .object({
    jobs: z.array(text),
    pains: z.array(text),
    gains: z.array(text),
    painRelievers: z.array(text),
    gainCreators: z.array(text),
    statement: text,
  })
  .partial();

export const RevenueModelSchema = z
  .object({
    type: z.enum([
      "one_time",
      "subscription",
      "usage",
      "commission",
      "freemium",
      "ads",
      "rental",
      "licence",
    ]),
    billingPeriod: text,
    notes: text,
  })
  .partial();
