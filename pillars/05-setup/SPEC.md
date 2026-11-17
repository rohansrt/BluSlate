# Pillar 5 — Operations Setup · SPEC

> **Status: Draft — to be deep-defined.**
> This file is a verbatim copy of §4.5 and Appendix A.5 of `docs/BLUSLATE_SPEC.md` (v2.4).
> In this pillar's Stage 2 **Define** step, the PM, the founder and Claude rewrite it into the
> detailed definition: every screen, every question (with the three input modes), inputs and
> outputs, calculations, AI tasks and prompts, states, a sample fixture and acceptance tests.
> Once approved, this file is the source of truth for the pillar; the main spec stays the source
> for shared rules.

## From the main spec — §4.5

#### 4.5 Pillar 5 — Operations Setup

- **Question:** What people, partners and resources make delivery possible?
- **Minimum input:** the offering (or a description) and a target launch volume.
- **User inputs:** build-or-buy choices; team roles (salary, equity, start date); enabler selections; capacity targets; inventory policy; compliance answers.
- **Reads:** Offering, Feature, RevenueModel, Segment.
- **Workspace:** Process map (order → delivery → payment → support → returns) · Responsibility map (founder vs enabler) · Enabler marketplace · Implementation timeline · Risk register.
- **Steps:**
    1. Map the operating process (SIPOC) for the archetype.
    2. For every feature, component and process step, answer "Who does this?" — the founder team or a named enabler.
    3. Find enablers: real providers researched with dated public terms, and synthetic quotes for simulation, each clearly labelled. Compare price, MOQ, lead time, quality, reliability and payment terms. Negotiate with synthetic enablers in chat.
    4. Build the implementation calendar with lead times and the critical path.
    5. Model capacity and unit cost (per unit, per customer, per month).
    6. Keep a risk register: single points of failure, cash tied up in inventory, compliance gaps, fallbacks.
- **Writes:** Process, Enabler[], Commitment[] (a simulated contract or a planned real one — never auto-signed), TeamRole[], CostItem[], Capacity.
- **Calculations:** unit cost build-up; capacity = minimum across stages; critical path; cash tied up; risk priority number.
- **Methods and tools:** SIPOC, capacity planning, critical path, unit cost modelling, FMEA · Miro, Jira or Notion, supplier and cloud pricing calculators, Zoho Books or another accounting tool.
- **Simulated time:** 2–8 weeks, mostly enabler lead times and hiring.
- **Done when:** every feature and component has an owner; launch capacity covers forecast month-one demand; every cost is labelled actual, estimated or synthetic.
- **Guardrail:** AI can never bind the founder to a vendor; synthetic quotes are never shown as real; regulated sectors get a specialist-review flag.

## From the main spec — Appendix A.5

#### A.5 Operations Setup

| Task | Trigger | Tier | Tools | Output | Guard |
| --- | --- | --- | --- | --- | --- |
| `setup.processMap` | Offering approved | Standard | — | SIPOC steps for the archetype | — |
| `setup.whoDoesThis` | Responsibility map | Fast | — | Founder or enabler suggestion per step | Founder decides |
| `setup.findProviders` | Enabler search | Standard | Web search | Real providers with official URL, public terms and last-checked date | No provider without a URL and date |
| `setup.syntheticQuoteTerms` | Simulated quote | Fast | — | Terms text around engine-sampled numbers | Numbers come from configured bounds; labelled SYNTHETIC |
| `setup.negotiate` | Negotiation chat (streaming) | Standard | — | Enabler reply within its hidden floor price and terms | Cannot accept on the founder's behalf |
| `setup.riskRegister` | Plan drafted | Standard | — | FMEA rows: failure, effect, cause, severity, occurrence, detection | Risk priority number computed |
| `setup.complianceFlags` | Category known | Standard | Web search | Questions for a professional and a regulated-sector flag | Never certifies legality |
| `setup.extractQuote` | Real quote PDF uploaded | Fast | — | Extracted price, MOQ, lead time, terms | Founder verifies critical values |

**Evals:** synthetic quotes stay inside configured bounds; real providers always have a URL and date; negotiation never closes a deal.
