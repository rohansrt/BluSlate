# Pillar 3 — Market Research · SPEC

> **Status: Draft — to be deep-defined.**
> This file is a verbatim copy of §4.3 and Appendix A.3 of `docs/BLUSLATE_SPEC.md` (v2.4).
> In this pillar's Stage 2 **Define** step, the PM, the founder and Claude rewrite it into the
> detailed definition: every screen, every question (with the three input modes), inputs and
> outputs, calculations, AI tasks and prompts, states, a sample fixture and acceptance tests.
> Once approved, this file is the source of truth for the pillar; the main spec stays the source
> for shared rules.

## From the main spec — §4.3

#### 4.3 Pillar 3 — Market Research

- **Question:** How large, reachable and competitive is the opportunity?
- **Minimum input:** industry or category, geography, customer description.
- **User inputs:** market boundary (geography, segment, period, currency); known competitors; overrides on any figure.
- **Reads:** Problem, Segment.
- **Workspace:** Research studio — Sizing builder · Competitor explorer · Trends panel · Source drawer.
- **Steps:**
    1. Set boundaries: geography, segment, period, currency.
    2. Bottom-up sizing: segment count × usage frequency × price, every line editable with its source.
    3. Top-down cross-check from published sources where the method is disclosed; differences are shown, never averaged.
    4. TAM → SAM → SOM, with SOM reasoned from capacity, budget and channel reach rather than a flat percentage.
    5. Competitor explorer: direct, indirect, substitutes and "do nothing" — price, features, audience, positioning, funding — plus a positioning map.
    6. Category benchmarks (conversion, CAC, gross margin, churn, repeat rate, seasonality) with sources and confidence; these calibrate the simulation.
    7. Sensitivity analysis on adoption, reach, share and price.
- **Writes:** MarketSize, Competitor[], Benchmark[] (plus Evidence).
- **Calculations:** sizing formulas; low / base / high ranges; sensitivity (tornado) chart.
- **Methods and tools:** TAM/SAM/SOM, bottom-up sizing, Porter's Five Forces (optional), competitor mapping, scenario analysis · data.gov.in, RBI DBIE, World Bank Indicators API, Google Trends, public pricing and filings, Similarweb (directional only).
- **Simulated time:** 3–7 days.
- **Done when:** SAM and SOM each have an explicit formula; 3+ competitors or substitutes are profiled; every figure has a label and a date.
- **Guardrail:** search interest is not sales; TAM is not obtainable revenue; traffic estimates are directional; data licences are respected.

Each approved Competitor becomes an agent in Launch & Growth.

## From the main spec — Appendix A.3

#### A.3 Market Research

| Task | Trigger | Tier | Tools | Output | Guard |
| --- | --- | --- | --- | --- | --- |
| `market.researchPlan` | Research started | Standard | — | Source plan: official statistics and filings first, then industry and competitor sources | — |
| `market.research` | Plan approved | Standard | Web search (10) | Claims with value, unit, period, geography, source id | Unsourced numbers go to `unknowns` |
| `market.findCompetitors` | Competitor explorer | Standard | Web search | Competitor cards with sourced, dated fields | No competitor without a resolvable official URL |
| `market.reconcile` | Conflicting claims | Standard | — | Conflict list with definitions compared | Never averages unlike definitions |
| `market.suggestSizingInputs` | Sizing builder | Standard | — | Formula lines with candidate inputs and sources | The calculator computes TAM/SAM/SOM |
| `market.benchmarks` | Before simulation | Standard | Web search | Benchmark ranges with sources and confidence | Defaults marked ASSUMED when unsourced |

**Research agent workflow:** understand the query, stage, geography and timeframe → plan source types → retrieve → extract claims with units and periods → reconcile duplicates and conflicts → score relevance → ask the founder for critical missing inputs → publish source-linked Drafts.

**Evals:** 100% of numeric claims carry a source or appear in `unknowns`; every source has a date; generated URLs resolve.
