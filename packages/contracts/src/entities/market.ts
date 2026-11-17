import { z } from "zod";
import { currency, id, line, lowBaseHigh, money, range, text } from "./common";

/** Pillar 3 · Market (§8.2). */
export const MarketSizeSchema = z
  .object({
    boundary: z.object({ geography: text, segment: text, period: text, currency }).partial(),
    topDown: z.array(line),
    bottomUp: z.array(line),
    tam: lowBaseHigh,
    sam: lowBaseHigh,
    som: lowBaseHigh,
  })
  .partial();

export const CompetitorSchema = z
  .object({
    name: text,
    kind: z.enum(["direct", "indirect", "substitute", "do_nothing"]),
    url: text,
    pricing: z.object({ amount: money, currency, period: text, note: text }).partial(),
    features: z.array(text),
    audience: text,
    positioning: text,
    funding: text,
    estimatedShare: z.number(),
    strategy: z.enum(["price_leader", "premium", "fast_follower", "incumbent"]),
  })
  .partial();

export const BenchmarkSchema = z
  .object({
    metric: text,
    range: range.extend({ unit: text }).partial(),
    category: text,
    geography: text,
    sourceId: id,
    confidence: z.enum(["low", "medium", "high"]),
  })
  .partial();
