# 0004 — Accounts, admin dashboard, AI model registry, pillar names

- **Date:** 17 November 2026
- **Requested by:** the PM
- **Status:** Accepted. The edits below were **applied in spec v2.4** (PM: "the instructions here are superior to spec").

## 1. Sign in, sign up, guests

- **Signed out:** the top right shows **Sign in** and **Sign up**. Both use the email-link flow. The sign-in page also offers **Continue as guest**, a private workspace in this browser.
- **Signed in or guest:** the top right shows a **profile menu** (My startups, Profile, Admin for admins, Sign out). For guests the menu offers "Sign up to keep your work" and "End guest session".
- **Logo and Home:** the logo always goes to Home. Home always opens with the hook; signed-in people with startups see a "continue" card instead of the onboarding card.
- **Guest sign-up:**
  - When a guest asks for an email link, a signed, httpOnly cookie records their guest account.
  - When the link is opened in the same browser, Auth.js's `signIn` event moves the guest's startups into the verified account and deletes the guest.
  - Startups only move *into* an account whose email was just verified, so this can't be used to take over someone else's account.
- Onboarding from Home still creates a guest workspace with no email, as in decision 0002.

## 2. Deleting a startup

- **Who and how:** owners can delete a startup from My startups or its city page, after a confirmation step.
- **What goes:** the startup and everything stored for it (entities, drafts, decisions, proposals, assumptions, personas, threads, scenarios, snapshots, reports and dependencies) are removed in one transaction.
- **AI call logs:** they keep their cost figures but lose the link to the startup, so platform spend stays accurate.
- **Why this is allowed:** this is deletion on request (G8, Privacy Policy), not a rewrite of history.

## 3. Admin dashboard (`/admin`)

- **Who gets in:** admins are verified email accounts listed in `ADMIN_EMAILS`, and guests never are. Admins sign in at `/admin/login`.
- **Overview:** people, startups, published decisions, pillar use, Twin activity, and AI calls with cost, response time, failed checks, and breakdowns by model and task. Counts and sums only: founders' ideas and answers are never shown (Privacy Policy, G11).
- **Audit log:** every admin view and model change is recorded in `AdminAudit` and listed at `/admin/audit` (spec §5.8 "audited access").

## 4. AI model registry (`/admin/models`)

- **Two new tables:** `AiModel` (provider, model ID, display name, prices, enabled, last test) and `AiModelAssignment` (scope = `default` or a pillar id, tier = fast, standard or top).
- **Empty to start:** the dashboard starts empty. Until a model is added, AI features show the manual fallback.
- **Add a model, step by step:**
  1. Provider (Anthropic only for now).
  2. Model: pick from the catalogue (Haiku 5.5, Sonnet 5.5, Opus 5.5, Fable 5.2) or type another ID.
  3. API key: the *name* of its environment variable.
  4. Prices.
  5. "Make it the default *tier* model".

  **Test connection** calls the free Models API, so no tokens are spent.
- **Pillar table:** each pillar row can override the default model for each tier.
- **How the gateway picks a model:** `ai.run` asks the registry, preferring the pillar's assignment, then the default. Shared tasks such as "Guide me" use the pillar the founder is in.
- **Keys are never stored:** a model names its environment variable, and only `*_API_KEY` names are accepted, so nothing like `DATABASE_URL` can be pointed at.
- **What `.env` still holds:** `ANTHROPIC_API_KEY` and `AI_DAILY_COST_CAP_USD`. The `AI_MODEL_TOP`, `AI_MODEL_STANDARD` and `AI_MODEL_FAST` variables are no longer read by the app; they remain only as the gateway's test fallback.

## 5. Clearer pillar names

Display names changed; ids, folders and packages did not.

| Old | New |
| --- | --- |
| Discover | Problem Discovery |
| Customers | Customer Discovery |
| Market | Market Research |
| Build | Product Design |
| Set Up | Operations Setup |
| Go to Market | Go-to-Market Plan |
| Run & Grow | Launch & Growth |

## Edits to CLAUDE.md and the spec (applied in v2.4)

1. **CLAUDE.md, AI rule 2:** replace "Models come from env (`AI_MODEL_TOP`, …). Never hard-code model IDs." with "Models are chosen in the admin model registry (`/admin/models`, `AiModel` and `AiModelAssignment`). API keys come from env by variable name only. Never hard-code model IDs in tasks."
2. **Spec §5.11 Model registry, "Lives in":** add the admin registry tables.
3. **Spec §6.0:** add `/profile`, `/admin`, `/admin/models`, `/admin/audit`, and the Sign in / Sign up / Continue as guest flow.
4. **Spec §3 and Part B §B4 / PDF:** use the new pillar names (the B9 decision "seven pillar names and their order").
