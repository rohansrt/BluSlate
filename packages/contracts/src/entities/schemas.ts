import type { z } from "zod";
import type { PillarEntityType } from "../entity-types";
import { FeatureSchema, OfferingSchema, RevenueModelSchema, ValuePropositionSchema } from "./build";
import {
  InsightSchema,
  InterviewSchema,
  NeedSchema,
  PersonaSchema,
  SegmentSchema,
} from "./customers";
import { HypothesisSchema, OpportunitySchema, ProblemSchema } from "./discover";
import {
  CampaignSchema,
  ChannelPlanSchema,
  LaunchPlanSchema,
  PositioningSchema,
  PricePlanSchema,
} from "./gtm";
import { BenchmarkSchema, CompetitorSchema, MarketSizeSchema } from "./market";
import {
  KpiSeriesSchema,
  LeverChangeSchema,
  MarketEventSchema,
  PeriodSchema,
  ScenarioEntitySchema,
  SimRunSchema,
} from "./run-grow";
import {
  CapacitySchema,
  CommitmentSchema,
  CostItemSchema,
  EnablerSchema,
  ProcessSchema,
  TeamRoleSchema,
} from "./setup";

/** One Zod schema per pillar-owned entity type: DB JSON, API, forms and AI output. */
export const ENTITY_SCHEMAS: Record<PillarEntityType, z.ZodType> = {
  Problem: ProblemSchema,
  Opportunity: OpportunitySchema,
  Hypothesis: HypothesisSchema,
  Segment: SegmentSchema,
  Persona: PersonaSchema,
  Interview: InterviewSchema,
  Insight: InsightSchema,
  Need: NeedSchema,
  MarketSize: MarketSizeSchema,
  Competitor: CompetitorSchema,
  Benchmark: BenchmarkSchema,
  Feature: FeatureSchema,
  Offering: OfferingSchema,
  ValueProposition: ValuePropositionSchema,
  RevenueModel: RevenueModelSchema,
  Process: ProcessSchema,
  Enabler: EnablerSchema,
  Commitment: CommitmentSchema,
  TeamRole: TeamRoleSchema,
  CostItem: CostItemSchema,
  Capacity: CapacitySchema,
  Positioning: PositioningSchema,
  PricePlan: PricePlanSchema,
  ChannelPlan: ChannelPlanSchema,
  Campaign: CampaignSchema,
  LaunchPlan: LaunchPlanSchema,
  Scenario: ScenarioEntitySchema,
  SimRun: SimRunSchema,
  Period: PeriodSchema,
  LeverChange: LeverChangeSchema,
  MarketEvent: MarketEventSchema,
  KpiSeries: KpiSeriesSchema,
};
