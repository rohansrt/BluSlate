# Pillar 1 — Problem Discovery · SPEC

> **Status: Draft — to be deep-defined.**
> This file is a verbatim copy of §4.1 and Appendix A.1 of `docs/BLUSLATE_SPEC.md` (v2.4).
> In this pillar's Stage 2 **Define** step, the PM, the founder and Claude rewrite it into the
> detailed definition: every screen, every question (with the three input modes), inputs and
> outputs, calculations, AI tasks and prompts, states, a sample fixture and acceptance tests.
> Once approved, this file is the source of truth for the pillar; the main spec stays the source
> for shared rules.

## From the main spec — §4.1

#### 4.1 Pillar 1 — Problem Discovery

- **Question:** What real problem is worth solving?
- **Minimum input:** an idea in one line, or an interest area plus geography.
- **User inputs:** idea or frustration; who faces it; how they cope today; why now; founder experience and advantage; business type if known; budget band; region and currency.
- **Reads:** Startup.
- **Workspace:** Problem canvas → Opportunity board → Assumption map.
- **Steps:**
  1. Capture the idea (text or voice), or choose "Help me discover".
  2. Reframe it as a problem statement: who, pain, frequency, current workaround, cost of the pain.
  3. Compare 2–5 opportunity options on severity, frequency, urgency, workaround strength and feasibility.
  4. Generate falsifiable hypotheses across desirability, viability and feasibility; rank by risk × uncertainty.
  5. Produce a short next-research plan for Customer Discovery and Market Research.
- **Writes:** Problem, Opportunity[], Hypothesis[] (plus Assumption entries).
- **Calculations:** opportunity score = weighted sum of criteria (weights editable); hypothesis priority = risk × uncertainty.
- **Methods and tools:** Design Thinking, Jobs to Be Done, Lean Canvas, assumption mapping · Google Trends, Miro/FigJam, a founder observation log.
- **Simulated time:** 2–5 days.
- **Done when:** the problem is stated without naming a solution; at least 3 testable hypotheses exist; unknowns are marked.
- **Guardrail:** reject "no competition" claims without examining alternatives; public discussion is not validated demand.

## From the main spec — Appendix A.1

#### A.1 Problem Discovery

| Task                         | Trigger            | Tier     | Tools          | Output                                                                 | Guard                                                             |
| ---------------------------- | ------------------ | -------- | -------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `discover.reframeProblem`    | Idea submitted     | Standard | —              | Problem draft: who, pain, frequency, workaround, cost of pain, why now | No solution words in the problem statement                        |
| `discover.exploreSpaces`     | "Help me discover" | Standard | Web search (5) | 3–5 problem spaces with trend signals and sources                      | Every trend claim has a source                                    |
| `discover.rateOpportunities` | 2+ options exist   | Standard | —              | Proposed criterion ratings with reasons                                | Ratings labelled ASSUMED; the total is computed by the calculator |
| `discover.hypotheses`        | Problem approved   | Standard | —              | Hypotheses: statement, kind, test method, risk, uncertainty            | Each hypothesis is falsifiable                                    |
| `discover.challenge`         | Publish preview    | Fast     | —              | Counterexamples, alternatives, "no competition" flags                  | Shown as Reality Check, never blocking                            |

**Evals:** problem statements contain no solution; at least 3 falsifiable hypotheses; no statistic without a source.
