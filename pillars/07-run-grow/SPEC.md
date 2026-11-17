# Pillar 7 — Launch & Growth · SPEC

> **Status: Draft — to be deep-defined.**
> This file is a verbatim copy of §4.7 and Appendix A.7 of `docs/BLUSLATE_SPEC.md` (v2.4).
> In this pillar's Stage 2 **Define** step, the PM, the founder and Claude rewrite it into the
> detailed definition: every screen, every question (with the three input modes), inputs and
> outputs, calculations, AI tasks and prompts, states, a sample fixture and acceptance tests.
> Once approved, this file is the source of truth for the pillar; the main spec stays the source
> for shared rules.

## From the main spec — §4.7

#### 4.7 Pillar 7 — Launch & Growth

- **Question:** What happens when the startup operates over time?
- **Minimum input:** Sandbox — a business type and a few assumptions (labelled defaults allowed); Actuals + Sandbox — imported monthly revenue, costs and customers.
- **User inputs:** mode; start date; horizon; difficulty (Optimistic · Realistic · Harsh); levers — price and discounts, spend by channel, headcount and salaries, capacity and inventory, supplier switch, feature releases, new segment or city, funding.
- **Reads:** every approved upstream entity (§3.1).
- **Workspace:** Control room — KPI header, cash chart, revenue vs cost, funnel, cohorts, market share, operating constraints, customer-voice feed, event feed, levers drawer, what-if lab.
- **Steps:**
  1. Launch: the clock switches to continuous; personas seed a larger simulated population; competitor agents and enablers start acting.
  2. Advance time: pause, step one period, play, fast-forward. The clock auto-pauses on critical events (runway under 3 months, stock-out, major competitor move, churn spike).
  3. Change levers at any time. Each change is a dated LeverChange with a lead time and an impact preview.
  4. Board meeting every period: what happened, why, three suggested moves, what to watch.
  5. "Why did this move?" on any chart point opens a driver breakdown.
  6. Branch a what-if, compare side by side, then apply or discard.
  7. Send observed or simulated learning back as Proposals to the owning pillars.
- **Writes:** Scenario, SimRun, Period[], LeverChange[], MarketEvent[], KpiSeries.
- **Calculations:** the simulation kernel (Appendix B) — ledger, demand, choice, capacity, cohorts, attribution.
- **Methods and tools:** Lean Analytics, unit economics, cohort analysis, forecasting, controlled experiments, accounting identities · PostHog funnels and experiments, Zoho Books, Excel or Google Sheets, CRM exports.
- **Simulated time:** continuous after launch; one tick is one simulated day.
- **Done when:** a run reproduces exactly with the same seed; price, capacity and supplier changes have traced effects; the ledger reconciles.
- **Guardrail:** no LLM-generated revenue; forecasts are not guarantees; actuals are immutable; demand is capped by reach and capacity.

## From the main spec — Appendix A.7

#### A.7 Launch & Growth

| Task                  | Trigger                  | Tier     | Tools                                                                                                                 | Output                                                                     | Guard                                               |
| --------------------- | ------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------- |
| `run.competitorMove`  | Competitor trigger fires | Fast     | Strict tool use: `hold`, `cutPrice(pct)`, `launchFeature(id)`, `marketingPush(budget)`, `partnerExclusive(enablerId)` | One action                                                                 | Engine bounds every parameter and applies it        |
| `run.eventNarrative`  | Engine emits an event    | Fast     | —                                                                                                                     | Short event text                                                           | Numbers only from the event payload                 |
| `run.customerVoice`   | Each period              | Fast     | —                                                                                                                     | Reviews, posts and tickets matching engine satisfaction drivers            | Sentiment must match the engine; labelled SYNTHETIC |
| `run.boardMeeting`    | End of each period       | Standard | —                                                                                                                     | Summary, causes (from attribution), 3 moves as lever proposals, watch list | Moves are proposals; numbers from the payload       |
| `run.explainMetric`   | "Why did this move?"     | Standard | —                                                                                                                     | Plain-English explanation of the engine's attribution                      | Never generates numbers                             |
| `run.proposeUpstream` | Pattern detected         | Standard | —                                                                                                                     | Proposals for owning pillars (e.g. a new Need from churn reasons)          | Status Needs review                                 |
| `run.mapActuals`      | Actuals import           | Standard | —                                                                                                                     | Column → ledger account mapping                                            | Founder confirms before import                      |

**Evals:** every number in narratives matches the engine payload; competitor actions stay inside budgets; customer voice matches satisfaction direction.
