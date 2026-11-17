# Pillar 6 — Go-to-Market Plan · SPEC

> **Status: Draft — to be deep-defined.**
> This file is a verbatim copy of §4.6 and Appendix A.6 of `docs/BLUSLATE_SPEC.md` (v2.4).
> In this pillar's Stage 2 **Define** step, the PM, the founder and Claude rewrite it into the
> detailed definition: every screen, every question (with the three input modes), inputs and
> outputs, calculations, AI tasks and prompts, states, a sample fixture and acceptance tests.
> Once approved, this file is the source of truth for the pillar; the main spec stays the source
> for shared rules.

## From the main spec — §4.6

#### 4.6 Pillar 6 — Go-to-Market Plan

- **Question:** Who buys first, at what price, and through which channels?
- **Minimum input:** a segment and an offering description.
- **User inputs:** beachhead segment; positioning statement; pricing method and price points or tiers; discounts; channel shortlist and budget; campaign plan; launch date; sales motion (self-serve, inside sales, field sales, retail).
- **Reads:** Segment, Need, ValueProposition, Offering, Competitor, Benchmark, CostItem, Capacity.
- **Workspace:** STP board · Pricing Lab · Channel Finder · Campaign planner · Funnel view · Launch checklist.
- **Steps:**
    1. Segment, target and position from the evidence.
    2. Pricing Lab: a cost-plus floor, the competitor range and a value-based ceiling; Van Westendorp and Gabor-Granger on the simulated population (or a real survey); a net price waterfall after channel fees, payment fees, taxes and discounts; break-even volume.
    3. Channel Finder: a Bullseye shortlist with benchmark CPM, CPC, CTR and CAC ranges; small tests before scaling.
    4. Message testing on personas: qualitative reactions, with click-through computed by the engine.
    5. Campaign plan: audience, offer, message, channel, budget, duration, success metric.
    6. Funnel forecast from reach to leads to customers, with CAC and payback; a launch checklist tied to Operations Setup readiness.
- **Writes:** Positioning, PricePlan, ChannelPlan, Campaign[], LaunchPlan.
- **Calculations:** price waterfall; contribution per unit; break-even volume; funnel maths; diminishing-returns spend curve per channel.
- **Methods and tools:** STP, Bullseye (Traction), marketing funnel, pricing research, Crossing the Chasm (optional) · Google Ads Keyword Planner, Meta Ads, LinkedIn Ads, HubSpot CRM, Google Analytics, Razorpay where suitable.
- **Simulated time:** 1–3 weeks of planning; pre-launch campaigns spend on the clock.
- **Done when:** net contribution per unit is known; the launch date is set and every dependency is ready before it; CAC is labelled validated or assumed.
- **Guardrail:** no promised ROI; no real spend or sending without approval; ad reach is never treated as buyers.

## From the main spec — Appendix A.6

#### A.6 Go-to-Market Plan

| Task | Trigger | Tier | Tools | Output | Guard |
| --- | --- | --- | --- | --- | --- |
| `gtm.positioning` | STP board | Standard | — | 2–3 positioning statements linked to evidence | — |
| `gtm.competitorPrices` | Pricing Lab | Standard | Web search | Sourced, dated competitor price points | — |
| `gtm.explainPricingMethod` | Guide me | Fast | — | Concept card for the chosen method | — |
| `gtm.channelShortlist` | Channel Finder | Standard | Web search | Bullseye rings with benchmark ranges and sources | Ranges, not promises |
| `gtm.messageVariants` | Campaign planner | Standard | — | Copy variants per channel | — |
| `gtm.messageReactions` | Message test | Fast | — | Persona reactions (qualitative) | Click-through computed by the engine |
| `gtm.campaignPlan` | Campaign planner | Standard | — | Campaign draft | No spend without approval |
| `gtm.launchChecklist` | Launch date set | Fast | — | Checklist from Operations Setup readiness and dependencies | — |

Van Westendorp and Gabor-Granger curves are computed by the engine from the population's willingness-to-pay distribution; the LLM never produces them.

**Evals:** no ROI promises in text; every price number comes from the founder, a source or the engine.
