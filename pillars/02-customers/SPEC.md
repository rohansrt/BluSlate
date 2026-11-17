# Pillar 2 — Customer Discovery · SPEC

> **Status: Draft — to be deep-defined.**
> This file is a verbatim copy of §4.2 and Appendix A.2 of `docs/BLUSLATE_SPEC.md` (v2.4).
> In this pillar's Stage 2 **Define** step, the PM, the founder and Claude rewrite it into the
> detailed definition: every screen, every question (with the three input modes), inputs and
> outputs, calculations, AI tasks and prompts, states, a sample fixture and acceptance tests.
> Once approved, this file is the source of truth for the pillar; the main spec stays the source
> for shared rules.

## From the main spec — §4.2

#### 4.2 Pillar 2 — Customer Discovery

- **Question:** Who experiences the problem, and what evidence exists?
- **Minimum input:** a problem statement or a customer description.
- **User inputs:** segments (user, payer, buyer, influencer, decision-maker; B2C or B2B); outreach plan (channels, message, number of contacts); interview guide; real interview notes, recordings or surveys (with consent).
- **Reads:** Problem, Hypothesis.
- **Workspace:** Segment builder · Outreach planner · Interview room (chat or voice) · Evidence board.
- **Steps:**
  1. Define 2–5 segments (AI proposes them if blank).
  2. Plan outreach. The simulation returns realistic reply rates by channel, segment and message quality, and consumes simulated days. The real path drafts outreach for real recruitment; sending requires approval.
  3. Interview AI personas. Each has a visible profile (name, context, job) and a hidden profile (true pain level, budget, current spend, switching triggers, politeness bias). A live coach scores each question: past behaviour, leading, hypothetical or closed.
  4. Survey a simulated population (50–1,000 responses with realistic noise) or import a real survey.
  5. The Evidence board tags quotes (pain, need, gain, workaround, objection, willingness to pay), clusters them, and shows hypothesis status — with real and synthetic evidence counted separately.
- **Writes:** Segment[], Persona[], Interview[], Insight[], Need[].
- **Calculations:** need score = frequency × severity × evidence weight (real field evidence 1.0, synthetic 0.3 by default; editable); hypothesis status rules; reply-rate sampling for simulated outreach.
- **Methods and tools:** Customer Development, The Mom Test, Jobs to Be Done, Value Proposition Canvas (customer side) · Tally, Calendly, Dovetail, a CRM or spreadsheet.
- **Simulated time:** outreach 3–10 days; about half a day per interview; surveys 3–7 days.
- **Done when:** 8+ interviews across 2+ segments; each of the top 3 needs backed by 3+ sources; every synthetic item labelled.
- **Guardrail:** synthetic interviews never count as real validation; personas never change their core facts to please the founder; personal data needs consent.

Personas persist. The same characters later test the MVP (Product Design), react to messages and prices (Go-to-Market Plan), and seed the simulated population (Launch & Growth).

## From the main spec — Appendix A.2

#### A.2 Customer Discovery

| Task                        | Trigger                         | Tier            | Tools | Output                                                                        | Guard                                                |
| --------------------------- | ------------------------------- | --------------- | ----- | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| `customers.suggestSegments` | Segment builder empty           | Standard        | —     | 3–5 segments with roles and reasons                                           | —                                                    |
| `customers.outreachDraft`   | Outreach planner                | Standard        | —     | Message variants per channel                                                  | Real sending needs approval                          |
| `customers.scoreMessage`    | Simulated outreach              | Fast            | —     | Message quality 0–1 with reasons                                              | Reply rates are sampled by the engine, not the model |
| `customers.generatePersona` | Outreach replies arrive         | Standard        | —     | Visible and hidden profile, seeded                                            | Hidden profile stored server-side only               |
| `customers.personaReply`    | Each interview turn (streaming) | Standard        | —     | In-character reply plus which hidden facts were revealed                      | Never contradicts the hidden profile; never flatters |
| `customers.coachQuestion`   | Each founder question           | Fast            | —     | Label (past behaviour · leading · hypothetical · closed) and a better rewrite | —                                                    |
| `customers.surveyOpenText`  | Simulated survey                | Fast            | —     | Open-text answers for sampled respondents                                     | Closed answers are sampled by the engine             |
| `customers.extractInsights` | Interview ends or upload        | Fast            | —     | Tagged quotes with transcript offsets                                         | Quotes must exist verbatim in the transcript         |
| `customers.clusterInsights` | Evidence board refresh          | Standard        | —     | Clusters with member ids and labels                                           | Keep minority and contradictory views                |
| `customers.transcribe`      | Real recording uploaded         | Speech provider | —     | Transcript                                                                    | Consent recorded first                               |

**Persona design.** Hidden profile fields: true pain (0–1), current spend, budget, switching triggers, objections, alternatives used, politeness bias (0–1), knowledge limits. Reveal rules: a fact is revealed only when a question addresses it concretely (past behaviour scores highest). Each persona has a seed, so it answers the same way across sessions.

**Evals:** consistency across 20 turns; leading-question detection precision; extraction recall on gold transcripts; the persona never volunteers a buying commitment it would not make.
