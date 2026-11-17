import { z } from "zod";
import { currency, id, isoDate, money, text } from "./common";

/** Pillar 5 · Set Up (§8.2). */
export const ProcessSchema = z
  .object({
    steps: z.array(
      z
        .object({
          name: text,
          owner: z.object({ kind: z.enum(["founder", "enabler"]), enablerId: id }).partial(),
          inputs: z.array(text),
          outputs: z.array(text),
        })
        .partial(),
    ),
  })
  .partial();

/** Real providers carry a URL and last-checked date; synthetic quotes are labelled SYNTHETIC. */
export const EnablerSchema = z
  .object({
    name: text,
    category: text,
    kind: z.enum(["real", "synthetic"]),
    url: text,
    lastChecked: isoDate,
    quote: z
      .object({
        price: money,
        currency,
        moq: z.number(),
        leadTimeDays: z.number(),
        quality: z.number(),
        reliability: z.number(),
        terms: text,
      })
      .partial(),
  })
  .partial();

/** A simulated contract or a planned real one. Never auto-signed. */
export const CommitmentSchema = z
  .object({
    enablerId: id,
    kind: z.enum(["simulated", "planned_real"]),
    terms: text,
    startAt: isoDate,
    noticeDays: z.number(),
  })
  .partial();

export const TeamRoleSchema = z
  .object({
    title: text,
    salary: money,
    currency,
    equityPct: z.number(),
    startAt: isoDate,
    capacityHours: z.number(),
  })
  .partial();

export const CostItemSchema = z
  .object({
    name: text,
    behaviour: z.enum(["fixed", "variable"]),
    basis: z.enum(["per_unit", "per_customer", "per_month"]),
    amount: money,
    currency,
  })
  .partial();

export const CapacitySchema = z
  .object({
    stages: z.array(z.object({ name: text, throughputPerDay: z.number() }).partial()),
    bottleneck: text,
  })
  .partial();
