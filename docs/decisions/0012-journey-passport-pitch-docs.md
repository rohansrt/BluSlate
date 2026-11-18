# 0012 — Straight into the steps, the Passport, clear goals, Pitch docs, shared facts

- **Date:** 19 November 2026
- **Requested by:** the PM ("when someone puts an idea, they are taken to the blue road first, that screen is not needed. Rather, I loved the passport idea in career simulator … a widget at top right … with the 7 stamps and clickable …", plus the goals, Pitch docs, age, guest, market and MECE changes in the same message)
- **Status:** Accepted. Applied in spec v2.9.

## Decisions

**No city page.** After onboarding the founder lands straight in a step: the chosen tool for "Just one tool", otherwise Problem Discovery. `/startups/[id]` now redirects to the first step that isn't complete (Pitch docs when all are). The city map (`components/journey/journey-map.tsx`) is removed.

**The frame around every step** (`components/journey/journey-frame.tsx`):
- **Left:** all seven steps, always visible, plus an eighth item, **Pitch docs**. Each shows how many of its goals are complete.
- **Top right:** the **Passport**, with one stamp per step. Clicking it opens all seven stamps; each stamp opens its step. A step is *stamped* when all its goals are complete.
- **Skip:** "Skip this step" in the header, and Back / Skip (or Next, once complete) at the bottom of every step. Nothing is lost by skipping.

**Goals say clearly when they're complete.** `Goal.done` is now required on every goal in every pillar. Outcome measures (margin, payback, runway, break-even) count as complete once worked out; whether they hit a target is shown in the goal's note. One rule colours everything:
- grey empty circle: no goals complete;
- amber half circle: some complete;
- green tick: all complete.
The Goals column, the step list, the Passport stamps and the Pitch docs use it (`goalProgress` in `packages/contracts`).

**Pitch docs** (`/startups/[id]/pack`, replacing the Founder Pack report page). Five documents:
- One-page summary (PDF)
- Pitch deck (16:9 PDF)
- Business plan (PDF)
- Business Model Canvas (PDF)
- Financial model (XLSX, with live formulas)

Each document has its own **Generate** and **Download** button, and there is a **Generate all** button at the top. Download stays off until the document has been generated. It then always gives that version, a frozen snapshot in the new `PitchDoc` table, until the founder generates it again.

Anyone can generate at any time. A section exists only for a step with work in it, and empty steps are listed as "not included yet".

When the steps a document uses aren't complete, a pop-up asks the founder to choose:
- **Fill the gaps with AI predictions**, which gives a complete document; or
- **Use only what I've completed.**

AI predictions run through the gateway (`core.pitch-fill`, top tier). They write prose only, with no numbers (AI rule 5, G3). They are labelled SYNTHETIC and always boxed as "AI prediction · not your data". The Financial model never uses AI. Until an admin connects a model, the AI option is visible but disabled and says why.

`@react-pdf/renderer` and `exceljs`, both already in the approved stack, are now installed in `apps/web`. PDFs use the built-in Helvetica font, so ₹ prints as "Rs".

**Onboarding.**
- Step 1 asks only the first name. Age is no longer asked anywhere: not in onboarding, the guest form, `/welcome` or Profile. `User.age` is kept for existing accounts, and analytics still skip accounts that gave an age under 18.
- The founder's own city and country are no longer asked.
- The last step, "Save your startup", now offers **Continue as guest** (email only, since the name is known) below the email code.
- The button reads "Start building".

**The launch market** is asked where it matters: in Customer Discovery and Market Research, in the card "Where will you launch?" (country plus an optional city or region). It is one answer, stored once on the startup (`Startup.marketCountry`, `marketRegion`), so changing it in one step changes it in the other. `geography` and `currency` follow it. Until it is chosen, geography is empty and money is shown in INR. Market Research no longer has its own "Where" field.

**MECE: each fact is asked once and shared.**
- Customer Discovery's separate outreach-channel picker is gone. Outreach uses the channels picked per segment ("Where to find them").
- Facts that more than one step needs are linked through `SharedFacts`: each pillar's workspace declares the facts it is the source of (`read`) and the ones it takes in (`write`). On autosave, the app copies a changed fact into every linked field that is still empty or still matches the old value. Once the founder edits a linked field, it is theirs.
- Pillars still never import each other.
- The save line says which steps were filled in.

| Fact | Source → filled into |
| --- | --- |
| Problem | Problem Discovery ↔ Customer Discovery |
| Main segment | Problem Discovery, Customer Discovery, Market Research, Product Design ↔ each other; → Go-to-Market (beachhead) |
| Alternatives | Problem Discovery → Market Research competitors |
| Needs, top need | Customer Discovery → Product Design needs, Go-to-Market need |
| Yearly value per customer | Customer Discovery willingness to pay (monthly × 12) → Market Research |
| Customers at SOM | Market Research → Launch & Growth market cap |
| Category, benefit, alternative | Product Design ↔ Go-to-Market |
| Price | Go-to-Market ↔ Launch & Growth |
| Variable and fixed costs | Operations Setup → Go-to-Market, Launch & Growth; Go-to-Market ↔ Launch & Growth |
| Marketing budget, CAC | Go-to-Market → Launch & Growth |

This copies working state only. Twin entities still change only through publishing with approval (G5).

**Development.** `lib/db.ts` keeps one Prisma client per generated client class, so `pnpm dev` picks up a new migration without a restart.

## Migration

`20261118205457_pitch_docs_and_market`: adds `PitchDoc` and `Startup.marketCountry` / `marketRegion`. It runs on the Vercel production build (decision 0007).
