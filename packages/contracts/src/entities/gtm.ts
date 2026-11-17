import { z } from "zod";
import { currency, id, isoDate, money, text } from "./common";

/** Pillar 6 · Go to Market (§8.2). */
export const PositioningSchema = z
  .object({
    beachheadSegmentId: id,
    statement: text,
    alternatives: z.array(text),
    differentiation: text,
  })
  .partial();

export const PricePlanSchema = z
  .object({
    method: text,
    tiers: z.array(z.object({ name: text, price: money, currency, period: text }).partial()),
    discounts: z.array(z.object({ name: text, pct: z.number() }).partial()),
    waterfall: z.array(z.object({ label: text, amount: money }).partial()),
    contributionPerUnit: money,
  })
  .partial();

export const ChannelPlanSchema = z
  .object({
    channels: z.array(
      z
        .object({
          channel: text,
          monthlyBudget: money,
          currency,
          benchmarkIds: z.array(id),
          ring: z.enum(["inner", "middle", "outer"]),
          expectedCac: money,
        })
        .partial(),
    ),
  })
  .partial();

export const CampaignSchema = z
  .object({
    audience: text,
    offer: text,
    message: text,
    channel: text,
    budget: money,
    currency,
    durationDays: z.number(),
    successMetric: text,
  })
  .partial();

export const LaunchPlanSchema = z
  .object({
    date: isoDate,
    dependencies: z.array(id),
    checklist: z.array(z.object({ item: text, done: z.boolean() }).partial()),
  })
  .partial();
