# Pillar 4 — Product Design · SPEC

> **Status: Draft — to be deep-defined.**
> This file is a verbatim copy of §4.4 and Appendix A.4 of `docs/BLUSLATE_SPEC.md` (v2.4).
> In this pillar's Stage 2 **Define** step, the PM, the founder and Claude rewrite it into the
> detailed definition: every screen, every question (with the three input modes), inputs and
> outputs, calculations, AI tasks and prompts, states, a sample fixture and acceptance tests.
> Once approved, this file is the source of truth for the pillar; the main spec stays the source
> for shared rules.

## From the main spec — §4.4

#### 4.4 Pillar 4 — Product Design

- **Question:** What should the product or service actually be?
- **Minimum input:** a list of needs (or a problem) and a business type.
- **User inputs:** features or service steps; must-haves; constraints (budget, time, skills); MVP type; revenue model type (one-time, subscription, usage, commission, freemium, ads, rental, licence).
- **Reads:** Problem, Need, Segment, Competitor.
- **Workspace:** Need → feature map · Priority board · MVP studio · live Business Model Canvas.
- **Steps:**
    1. Map each need to features, service steps or operational capabilities. Flag uncovered needs, features with no need, and table-stakes gaps against competitors.
    2. Prioritize with the simplest suitable method — RICE, MoSCoW or impact × effort; an optional Kano test runs on the personas.
    3. Choose an MVP type for the archetype (table below) and draw the scope line.
    4. Generate a virtual MVP: a clickable UI mock, a product render with bill of materials, a shop floor plan with a location card, or a service blueprint.
    5. Test with synthetic users (usability walkthroughs, commitment tests such as pre-order or deposit) and import real test results.
    6. Choose the revenue model and draft the value proposition.
- **Writes:** Feature[], Offering (the MVP), ValueProposition, RevenueModel.
- **Calculations:** coverage of top needs (%); RICE scores; effort totals in person-weeks; product-fit score = Σ (need weight × coverage quality), used by the engine.
- **Methods and tools:** Value Proposition Canvas, Lean Startup build–measure–learn, MVP, RICE, Kano · Figma, Maze, PostHog, Notion.
- **Simulated time:** effort is defined here; who builds it and when is scheduled in Operations Setup.
- **Done when:** each top-3 need is covered or deferred with a reason; the MVP scope line is set; a revenue model is chosen.
- **Guardrail:** a generated prototype is not a deployed app, a manufactured product or a certified design.

| Archetype | MVP options | What the simulation models |
| --- | --- | --- |
| Digital subscription / SaaS | Landing-page test, clickable prototype, no-code build, coded build | Onboarding, activation, hosting cost, uptime, bugs |
| Physical product (D2C) | Prototype, small batch, pre-orders | Bill of materials, unit cost by MOQ, packaging, defects, shelf life |
| Shop / F&B / retail | Pop-up, kiosk, cloud kitchen, full store | Location, footfall, rent, fit-out, staff hours, wastage |
| Recurring service | Concierge MVP, pilot with 5–10 clients | Service blueprint, delivery hours, utilization, quality |
| Two-sided marketplace | One-side seeding, manual matching | Supply–demand liquidity, take rate |
| Mixed / B2B | Design partners, paid pilot | Sales-cycle length, procurement steps, implementation effort |

## From the main spec — Appendix A.4

#### A.4 Product Design

| Task | Trigger | Tier | Tools | Output | Guard |
| --- | --- | --- | --- | --- | --- |
| `build.mapNeeds` | Needs available | Standard | — | Need → feature mapping, uncovered needs, orphan features | Every feature traces to a need or is flagged |
| `build.suggestFeatures` | Uncovered need | Standard | — | 2–4 feature options with examples and effort | Effort labelled ASSUMED |
| `build.riceInputs` | Priority board | Fast | — | Suggested reach, impact, confidence, effort | Score computed by the calculator |
| `build.mvpSpec` | MVP type chosen | Top | — | Spec: screens and flows, or BOM, or floor plan, or service steps | Scope limited to in-scope features |
| `build.mvpMockup` | Spec approved | Standard | — | Self-contained HTML or SVG rendered in a sandboxed iframe | Labelled SIMULATED DESIGN; no network calls |
| `build.usabilityTest` | Mock ready | Standard | — | Persona walkthrough findings and commitment-test responses | Synthetic; never counted as validation |
| `build.suggestRevenueModels` | Revenue model picker | Standard | — | 2–3 models with examples and trade-offs | — |
| `build.valueProposition` | Needs and features approved | Standard | — | Value Proposition Canvas draft | — |

**Evals:** traceability coverage; mockups render offline; specs never exceed the chosen scope.
