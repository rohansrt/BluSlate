# 0003 — S3: Twin workspace tables, first questions, and the AI gateway shape

- **Date:** 17 November 2026
- **Step:** S3 Shared core
- **Status:** Accepted. These choices fill gaps in §5, §8.1 and §11.3; review them at the Discover Define step.

## 1. Drafts and staleness live beside history, not in it

§8.1 gives `Entity` a `status` that includes DRAFT, NEEDS_REVIEW and MAY_BE_OUTDATED. But architecture rule 5 says entity data is never updated in place. If drafts and stale flags were Entity rows, every keystroke or upstream change would add a version, or edit one.

**Decision:**

- **`Entity` holds only published, immutable versions** (`status = APPROVED`).
- **`Draft` (new table)** is the mutable workspace for unpublished work. Publishing turns a draft into the next `Entity` version plus a `DecisionEvent`, then deletes the draft.
- **`StaleMark` (new table)** is append-only. A mark says "version N of X may be outdated because Y changed"; publishing version N+1 of X clears it. Nothing is ever rewritten.
- **The status founders see** (Not started, Draft, Needs review, Approved, May be outdated) is computed from these rows (`packages/twin/src/status.ts`), never stored.

## 2. The Twin is a pure package with a storage interface

`packages/twin` holds the rules: single writer, approval required, append-only history, per-entity staleness, proposals, assumptions and snapshots. It talks to storage through a `TwinStore` interface.

- The app supplies the Postgres store (`apps/web/lib/twin-store.ts`).
- Tests use `InMemoryTwinStore`, so the rules are tested quickly and deterministically.

## 3. FounderApproval is created only from a session

- **Where approvals come from:** `approvalFromSession(userId)` in `apps/web/lib/twin.ts` is the only place one is created, and it is called only in the publish route.
- **What the Twin checks:** the approver is a member of the startup, and the approval is recent (within 10 minutes).
- **Keeping AI out:** a lint rule stops `packages/ai` from importing the Twin or any pillar, so AI code can't publish (G5).

## 4. Every pillar opens with one question

Spec §1.2 law 7 says every pillar opens with one question, and the S3 gate needs a manual value to be publishable in every pillar. So each pillar now declares a `PillarStarter` in `pillars/<NN-id>/src/starter.ts`:

| Pillar | Entity · field | Question |
| --- | --- | --- |
| Discover | Problem · pain | In one sentence, what problem do people have? |
| Customers | Segment · name | Who has this problem? |
| Market | Competitor · name | What do people use today instead? |
| Build | Feature · name | What's one thing your first version must do? |
| Set Up | TeamRole · title | Who does the work? |
| Go to Market | Positioning · statement | Why would your first customers choose you? |
| Run & Grow | Scenario · name | Name the first what-if you want to test. |

A typed answer ("I'll decide") is labelled **ASSUMED** by the server and enters the assumptions register. Each pillar's Define step may replace its first question.

**Open question for P7:** Run & Grow's `Scenario` exists both as a Twin entity type (§3) and as a database table (§8.1). The first-question answer is stored as the entity. P7 should decide how the two relate.

## 5. AI gateway details

- **The call:** `client.beta.messages.parse` with `betaZodOutputFormat(Envelope(task.output))`. The beta path is used so that `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`) is sent for tiers whose model supports it (Opus 5.5, Sonnet 5.5). Haiku 5.5 has no server-side fallback, so none is sent.
- **Bounds:** numeric and length bounds that the API schema can't express are checked after parsing, by `task.check`.
- **Labels and checks:**
  - The gateway assigns the label: SOURCED when the output cites existing `Source` rows, otherwise the task's default.
  - Narrative tasks are rejected if their text contains a number that isn't in the input (G3).
- **Prompt and data:**
  - The prompt order is base rules, then the task prompt, then a cached `<startup_context>` block.
  - Founder input is sent inside `<input>` and treated as data.
- **Cost:**
  - Every call is logged to `AiCall`.
  - When `AI_DAILY_COST_CAP_USD` is set, a call is refused once today's spend for the startup reaches it.
  - Models missing from the price table are priced high on purpose.
- **Without a key:** with no `ANTHROPIC_API_KEY`, "Guide me" says the helper isn't available and the founder answers by hand. "Research & suggest" is shown as arriving with each pillar's Build step.

## 6. Small UI decisions

- **Dev bubble:** the floating Next.js dev bubble is turned off (`devIndicators: false`), because it covered bottom-left buttons on phones.
- **Phone width fix:** screen-reader-only text inside the hub rail made the page scroll sideways on phones. Each hub link is now its own positioning container, and the end-to-end tests check that no page scrolls sideways.
