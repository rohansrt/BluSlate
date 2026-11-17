# 0006 — v1 of all seven pillars, live goals and the Founder Pack report

- **Date:** 17 November 2026
- **Requested by:** the PM ("complete v1 for each of the 7 pillars… add the report out block… goals at the right side like TAM… dynamic as the process proceeds… without AI, but the UI should have the elements… don't overcomplicate")
- **Status:** Accepted, built, and applied in spec v2.5. It supersedes the "one pillar at a time, Define → Build → Review" order for this first version.

## What changed

1. **All seven pillars have a working v1 at once**, instead of one pillar at a time. Each pillar's Define step still exists for its v2. `pillars/01-discover/SPEC.md` is the deep definition for P1; its v1 is a simpler subset of it.
2. **Each pillar has its own screen**, designed for what that pillar serves. Inputs are mostly structured (rating dots, chips, segmented choices, numbers, lists of small cards), not long text.
3. **Every pillar works alone.** If upstream pillars have published, their entities pre-fill the screen, marked "From <pillar>". If not, the pillar asks for what it needs itself.
4. **A live Goals column on the right** replaces the AI rail as the first thing on the right. Each pillar lists its own goals, such as TAM / SAM / SOM in Market Research or runway and break-even in Launch & Growth. A goal shows "—" until it can be calculated and fills in as the founder types. Every value has its evidence label.
5. **"Report out" block** at the end of every pillar: a headline and labelled key lines, with Copy. The **Founder Pack report** (`/startups/[id]/pack`) shows all seven blocks with their status and goals, and can be printed or saved as PDF. The other exports (pitch, XLSX, BMC, funding list) are placeholders.
6. **AI is placeholders only.** Each pillar lists its AI helpers on the right and shows them inline where they'd act. They're dashed "AI · coming soon" cards that never show fake output.

## How it's built

- **`PillarWorkspaceDef`** (`packages/contracts/src/workspace.ts`): each pillar defines, in `pillars/<NN-id>/src/workspace.ts`:
  - its state schema (Zod, with defaults);
  - `initial(ctx)`, which pre-fills from upstream;
  - `goals`, `report` and `entities`;
  - its AI helper names.

  Everything is pure and deterministic, and tested.
- **The screen** is `pillars/<NN-id>/ui/index.tsx`. It's built from shared pieces in `packages/ui/src/components/workbench.tsx`: Section, Field, Segmented, ChipSelect, TagInput, Dots, NumberField, RowList, GoalsPanel, AiPlaceholder, Bars, Quadrant, LineChart, Stat, ReportOut and FromUpstream.
- **`PillarWorkspace` table** (new migration): the founder's working state per pillar, autosaved after 0.8 s idle (`PUT …/pillars/[pillar]/workspace`). It is **not** Twin history.
- **Publishing** (`POST …/workspace/publish`):
  - turns the workspace into the pillar's own entities, saves each as a Twin draft and publishes it with an approval from the founder's session (G5);
  - skips unchanged entities, so publishing twice adds no history;
  - records the approved upstream entities as dependencies, so "May be outdated" still works;
  - can't remove entities: an item deleted from the workspace keeps its last published version, and v1 doesn't retire it.
- **Contracts:** additive, optional fields only:
  - Problem: statement, frequencyBand, severity, alternatives, parkedSolution, unknowns;
  - Hypothesis: successCriterion;
  - Interview: date, segmentName, painLevel;
  - Competitor: priceLevel, quality;
  - ChannelPlan channel: ring, expectedCac.
- **The S3 first-question UI was removed.** Each pillar's first question is now the first field of its own screen. The starter draft and publish API routes and `starter.ts` stay, because they're still part of the contract tests.

## What each pillar does in v1

| Pillar | Steps on the screen | Goals on the right | Publishes |
| --- | --- | --- | --- |
| 1 Problem Discovery | Problem canvas with live statement and 6 checks → compare framings (weighted score, bars) → beliefs (risk × uncertainty, 2×2 map, starters) → next-week plan | Problem strength, best framing, testable beliefs, riskiest belief, sprint days, readiness | Problem, Opportunity, Hypothesis |
| 2 Customer Discovery | Problem (from P1 or typed) → segments → outreach plan → interview log (FIELD) → needs with score and matrix → belief check (status computed) | Real interviews of 8, segments interviewed, top need, needs with 3+ sources, beliefs ✓/✗/?, expected replies, willingness to pay | Segment, Interview, Insight, Need |
| 3 Market Research | Boundary → bottom-up funnel with uncertainty band → top-down cross-check → competitors and positioning map → trend | TAM, SAM, SOM (with ranges), customers at SOM, cross-check gap, competitors mapped, sources cited | MarketSize, Competitor |
| 4 Product Design | Needs → value proposition (jobs, pains, gains, statement) → features with RICE and MVP line → business model and mini canvas | Value proposition, MVP features, MVP effort, time to build, needs covered, top feature, business model | Feature, Offering, ValueProposition, RevenueModel |
| 5 Operations Setup | Process with owners and throughput → team → costs (fixed or variable) → real providers and lead times → risks | Monthly fixed cost, variable cost per unit, capacity and bottleneck, team, time to get ready, providers, top risk | Process, Capacity, TeamRole, CostItem, Enabler |
| 6 Go-to-Market Plan | Positioning statement → Pricing Lab (waterfall to contribution) → Bullseye channels (CAC) → launch date and checklist | Price, contribution per unit, margin, blended CAC, new customers a month, break-even, CAC payback, launch checklist | Positioning, PricePlan, ChannelPlan, LaunchPlan |
| 7 Launch & Growth | Scenario → starting numbers (pre-filled from P5 and P6) → levers from a month → control room (cash chart, revenue vs costs, month table) | Runway, break-even month, customers at the end, monthly revenue, lowest cash point, cash at the end (all SYNTHETIC) | Scenario, KpiSeries |

## Not in v1

- Live AI: personas, research, web search, mockups and explanations.
- The full simulation kernel. P7 uses a simple deterministic monthly model with difficulty multipliers and a price-rise churn effect.
- An Evidence tab and per-entity publish choices.
- Retiring entities deleted from a workspace.
- The other Founder Pack exports.
