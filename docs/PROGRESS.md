# BluSlate progress log

One entry per step (CLAUDE.md, "Source of truth").

---

## 17 November 2026 — S1 Website and accounts ✅

**Built**

- **Monorepo** laid out as in §7.3, using pnpm workspaces:
  - `apps/web` (Next.js 16 App Router, strict TypeScript)
  - `packages/{contracts,twin,ai,sim-kernel,reports}` (placeholders)
  - `packages/ui` (design tokens and base components)
  - `worker/` (placeholder)
  - `pillars/` (empty)
- **Design system:**
  - §6.5 tokens as CSS variables in `packages/ui/src/styles.css`, light and dark. Dark follows the system setting.
  - shadcn/ui-style Button, Input, Select, Textarea, Label, Card and Badge. Badge has variants for founder, AI, enabler, review, synthetic, actual and danger.
  - Inter as the type family.
  - Brand logos cropped to transparent PNGs (`scripts/make-logos.py`), plus favicon, app icon and Open Graph image.
- **Database:**
  - `docker-compose.yml` runs Postgres 16.
  - Prisma 7 with Startup, Member, Entity, Dependency and DecisionEvent (§8.1), plus the Auth.js tables.
  - First migration: `s1_accounts_and_core`.
- **Accounts:**
  - Auth.js v5 with email magic links and database sessions.
  - Resend sends the links in production. In development they are printed to the terminal and saved to `.dev-mail/`.
- **Pages (§6.0):**
  - **Home:** product name, promise and the four-step onboarding card. The draft is kept in the browser until sign-in. Returning founders see "Welcome back", their startups and "Start another".
  - **About:** every listed section, with contact `founder@yoppi.in`.
  - **Sign in** and **Check your email**.
  - **My startups**, with rename.
  - **Start another** (`/startups/new`).
  - **City:** a 2D road map with seven hubs, all "Not started", and the suggested first hub. Below `lg` it becomes a vertical route.
  - **Legal:** `/privacy`, `/terms`, `/cookies`.
  - 404 page.
- **API:** `POST /api/startups` creates a startup from validated onboarding answers. It needs a session and is scoped to the user.
- **SEO:**
  - Per-page titles, descriptions and canonical links.
  - Open Graph and Twitter metadata, and JSON-LD on Home.
  - `sitemap.xml` (public pages only), `robots.txt` (signed-in areas disallowed), web manifest.
- **Tooling:**
  - ESLint (flat config with Next.js rules, plus the pillar import-boundary rule, ready for S2), Prettier, Vitest and Playwright.
  - GitHub Actions: lint, typecheck, unit tests and build, then end-to-end tests against Postgres.
  - Every script listed in CLAUDE.md exists. `pnpm worker` and `pnpm eval` are stubs until their steps.

**Tests**

- Unit: `apps/web/lib/onboarding.test.ts` has 13 tests covering each entry path, validation limits, step gating and the derived startup.
- End-to-end (desktop and mobile, 16 tests):
  - the full Home onboarding → magic link → empty city flow (the S1 exit gate);
  - the draft surviving a reload;
  - "Welcome back" on return;
  - sign-in redirects for private pages;
  - the API returning 401 without a session;
  - About sections, legal pages with canonical links, and the SEO files.

**Decisions:** `docs/decisions/0001-s1-schema-and-onboarding.md`.

**Open issues**

- The legal pages need a lawyer's review before public launch (entity name, jurisdiction, liability cap, retention periods, list of service providers).
- Production email needs `AUTH_RESEND_KEY` and `EMAIL_FROM` on a domain verified in Resend.
- City hubs don't open yet (S2).
- `apps/web/lib/pillars.ts` is temporary navigation metadata until packages/contracts (S2/S3).
- Deployment (Vercel and Neon) hasn't been set up yet.

---

## 17 November 2026 — S1 follow-up: no sign-in for now, seven-step visuals ✅

**Built**

- **No sign-in (PM request).** Onboarding is three steps, and "Open my city" creates a private guest workspace in the browser (see `docs/decisions/0002-no-sign-in-for-now.md`).
  - Email sign-in is kept behind `NEXT_PUBLIC_REQUIRE_SIGN_IN=true`.
  - Migration `guest_users`: `User.email` is optional, and `User.isGuest` was added.
  - Privacy and Cookies wording updated, and guests see a notice that their startups live in this browser.
- **Seven steps with icons and visuals.**
  - One icon per pillar (`PillarIcon` and `PillarTile` in packages/ui).
  - Home has an icon strip in the hero, and a road-map journey with icon hubs, labels and a Founder Pack tile.
  - Under the map, cards show each step's question and "You get" deliverable. On phones these become a vertical route.
  - The city uses the same `JourneyMap` (status badges, "Start here"), and the onboarding tool picker shows the icons too.
- Pillar metadata (ids, names, questions, deliverables, folders, package names) moved into `packages/contracts` as the single source of truth.

**Tests:** the end-to-end tests cover the three-step guest flow, a second browser being refused another browser's startup, private pages sending visitors back to Home, and the `/signin` magic link still working.

---

## 17 November 2026 — S2 Pillar skeletons ✅

**Built**

- **`packages/contracts`:**
  - pillar metadata and the §3 entity catalogue (`PILLAR_ENTITY_TYPES`, `SHARED_ENTITY_TYPES`, `ENTITY_OWNER`);
  - evidence labels and statuses;
  - the §5.2 `PillarModule` interface, with placeholder supporting types that S3 fills in, and `PillarNotBuiltError`.
- **Seven pillar packages**, `pillars/01-discover` … `pillars/07-run-grow` (`@bluslate/pillar-<id>`), each with the same skeleton:
  - `SPEC.md`: a verbatim copy of §4.n and Appendix A.n, marked "Draft — to be deep-defined";
  - `src/module.ts`: a `PillarModule` stub with the correct id, and reads (§3.1) and writes (§3). Analysis and publish throw `PillarNotBuiltError`;
  - `src/schema.ts`: typed placeholders;
  - `src/calculators.ts`: the planned calculators;
  - `src/ai-tasks.ts`: the planned Appendix A task ids (52 in all);
  - `ui/index.tsx`: a placeholder screen showing the pillar's question, deliverable, reads and writes, and the three input modes;
  - `tests/smoke.test.ts`.
- **Pillar route `/startups/[id]/[pillar]`** with the standard layout (§6.1, §6.3):
  - a hub rail (a horizontal strip on phones);
  - Work · Evidence · Publish tabs, with Work active and the others "Coming soon";
  - an AI rail placeholder.
  City hubs link to their pillars, and unknown pillars return 404.
- **App wiring.** `apps/web/lib/pillar-modules.ts` and `pillar-screens.tsx` are the only places pillars meet.
- **Import boundaries (ESLint `no-restricted-imports`):**
  - pillars can't import another pillar's package or UI entry, or reach into its folder by path;
  - shared packages can't depend on pillars.

**Tests:** 74 unit tests and 24 end-to-end tests.

- Unit:
  - contracts (single writer, pillar metadata);
  - seven pillar smoke tests (id, reads, writes, standalone, stubs refuse to run, SPEC.md draft marker);
  - the registry (all seven registered, writes disjoint and complete);
  - import-boundary tests that run the real ESLint config;
  - the onboarding tests.
- End-to-end, desktop and mobile:
  - every pillar placeholder opens from the city;
  - the hub rail moves between pillars and marks the current one;
  - an unknown pillar is a 404.

**Open issues**

- The proposed §6.0 spec edit for no sign-in is in decision 0002 and waits for PM approval.
- The supporting types in `packages/contracts/src/module.ts` are placeholders that S3 defines properly.
- Hub statuses are all "Not started" until the Twin exists (S3).
- Guests: account upgrade, rate limiting and retention (decision 0002).

---

## 17 November 2026 — Home redesign (PM feedback) ✅

**Built**

- **Hook first:**
  - The headline is the question "Got a business idea? Will it work?", followed by one line.
  - The "Startup simulator" badge is gone, and the text is cut down throughout.
- **Hero image:**
  - Original SVG artwork: a blue slate board with chalk sketches of the journey (problem, customers, market, launch) and three floating notes.
  - It sits above the onboarding card on phones.
- **Seven steps as a loop:**
  - Each step is a chalk drawing on a blue slate, with its name underneath.
  - Clicking (or using the arrow keys) shows that step's short brief in one panel.
  - Run & Grow loops back to Discover.
  - The road map and the step cards were removed from Home.
- **Slate drawings:** `Slate`, `SlateDrawing` and `ChalkDefs` in packages/ui. Pillar tiles in the city and on pillar pages use the same drawings.

**Tests:** a new end-to-end test covers the loop: seven tabs, the brief changing on click, and keyboard wrap-around (26 end-to-end tests in total).

---

## 17 November 2026 — S3 Shared core ✅

**Built**

- **`packages/contracts`:**
  - Zod schemas for every §8.2 entity (`entities/<pillar>.ts`, `ENTITY_SCHEMAS`). Every field is optional, so pillars tolerate unknowns.
  - The `PillarStarter` type for each pillar's first question.
- **`packages/twin`, the Business Twin** (pure logic behind a `TwinStore` port):
  - drafts, with publishing that needs a FounderApproval (G5);
  - append-only versions with a DecisionEvent each, inside one atomic transaction;
  - the single-writer rule, and schema validation;
  - dependencies, and entity-level "May be outdated" marks;
  - computed entity and hub statuses, snapshots, proposals (accepting one publishes through the owning pillar), and the assumptions register.
- **Database:**
  - the remaining §8.1 tables (Proposal, Source, SourceLink, Assumption, Persona, Thread, Message, Scenario, Period, LeverChange, MarketEvent, Snapshot, Report, AiCall);
  - two new tables, `Draft` and `StaleMark` (decision 0003);
  - migration `s3_shared_core`.
- **`packages/ai`, the AI gateway:**
  - `ai.run(taskId, input, ctx)` and `ai.stream(...)`, with tiers taken from env;
  - structured output via `client.beta.messages.parse` and `betaZodOutputFormat`;
  - refusal fallbacks (`"default"`) where the model supports them;
  - prompt caching, post-parse bounds, source-id and invented-number checks, and labels assigned by the gateway;
  - AiCall logging with cost per call, a per-startup daily cost cap, SDK retries, and typed errors that fall back to the manual path;
  - the generic `core.explain` task for "Guide me".
- **`packages/ui`:** EvidenceBadge, InputModeSwitch, DecisionCard, SuggestionCard, EnablerCard, ReviewBanner, PublishPanel (with impact preview), AiRailPanel and TimeStrip.
- **App:**
  - Each pillar page asks its first question with the three input modes. "I'll decide" saves a draft, the Publish panel shows the change, its label and what it affects, and approval publishes.
  - "Guide me" goes through the gateway and falls back when AI isn't connected.
  - The city and the hub rail show live statuses: Approved, Draft, Needs a look, Not started.
  - API routes from §7.4: drafts, preview, publish, analyze, twin, proposals. All are membership-checked and return 404 across startups.
- **Lint:** `packages/ai` can't import the Twin or pillars (G5), with a test.

**Tests: 132 unit tests and 34 end-to-end tests.**

- **Unit:**
  - Twin: single writer, approval, append-only history, rollback, ripple, statuses, proposals, assumptions, snapshots;
  - gateway, against a fake client: tiers, caching, fallbacks, labels, bounds, sources, invented numbers, refusal, cost cap, streaming, pricing;
  - UI rendering, the pillar first questions, and import boundaries.
- **End-to-end, desktop and mobile:**
  - the S3 gate: a manual value published in all seven pillars, with the city showing "Approved" ×7;
  - versioning and drafts;
  - "Guide me" falling back without a key;
  - API refusing writes without a session or across startups;
  - no sideways scroll on phones.

**Open issues**

- No `ANTHROPIC_API_KEY` is set yet, so "Guide me" only shows the fallback. Add the app's key to `apps/web/.env.local` to try it (it costs a fraction of a cent per call on Haiku 5.5).
- Run & Grow's Scenario exists as both an entity and a table (decision 0003 §4, for P7).
- The Evidence and Publish tabs are placeholders until the pillars need them. The Publish panel already works inline.
- The TimeStrip component is built, but it only appears once a scenario exists (P7).

---

## 17 November 2026 — Accounts, admin dashboard, AI model registry (PM request) ✅

**Built** (see `docs/decisions/0004-accounts-admin-and-model-registry.md`)

- **Top right:**
  - "Sign in" and "Sign up" for visitors, with "Continue as guest" on the sign-in page.
  - A profile menu for everyone signed in: My startups, Profile, Admin (for admins), Sign out or End guest session.
  - A new `/profile` page with name editing.
- **The logo always goes to Home.** Home keeps the hook, and signed-in founders see a "continue" card.
- **Guests who sign up keep their startups:** a signed cookie, merged on verified sign-in in the same browser.
- **Delete a startup** (owner, with confirmation) from My startups or the city. Everything stored for it is removed; AI cost logs are kept without the startup link.
- **Admin back end** (`ADMIN_EMAILS` + email sign-in at `/admin/login`):
  - **Overview:** aggregate statistics only.
  - **AI models:** an empty state, model cards (connection status, prices, usage, test, turn on or off, remove) and the pillar × tier assignment table.
  - **Add a model:** a five-step workflow with a free connection test.
  - **Audit log:** every admin action.
- **AI gateway:** now takes a `ModelResolver`. The app resolves from the admin registry: the pillar's assignment, then the default. Keys are read from env by name and only `*_API_KEY` names are allowed; the admin's prices are used for cost.
- **Clearer pillar names:** Problem Discovery, Customer Discovery, Market Research, Product Design, Operations Setup, Go-to-Market Plan, Launch & Growth.

**Tests**

- **Unit:** resolver tests (registry pick, admin prices, unavailable when nothing is assigned).
- **End-to-end:**
  - continue as guest;
  - the profile menu;
  - a guest sign-up that keeps their startups;
  - deleting a startup;
  - admin pages refusing non-admins;
  - an admin adding a model and assigning it, with the action in the audit log;
  - the logo going to Home.

**Open issues**

- Proposed CLAUDE.md and spec edits for the model registry and pillar names wait for PM approval (decision 0004).
- AI stays off until a model is added *and* `ANTHROPIC_API_KEY` is set.

---

## 17 November 2026 — Spec v2.4 ✅

- **`docs/BLUSLATE_SPEC.md` is now v2.4.** The PM's instructions take precedence and the spec is updated to match. There's a changelog under the header.
- **Pillar names:** the new names are used throughout. The §6.1 layout diagram was redrawn, and every pillar's SPEC.md copy was regenerated.
- **Guest-first onboarding and accounts:** Sign in, Sign up, Continue as guest, the profile menu, the logo going to Home, and deleting a startup are in §6.0 and B3.
- **Admin back end and AI model registry:** in §5.8, §5.11, §11.2 and §11.3, and in Part A AI rule 2. Structured outputs are documented as the beta `parse` call, which carries refusal fallbacks.
- **Schema additions:** in a new §8.3 (Draft, StaleMark, Auth.js tables, guests, the model registry, the admin audit log), with each pillar's first question.
- **`CLAUDE.md`** was regenerated from Part A, so the two stay identical.
- **Still out of date:** `BluSlate_PM_Review.pdf` still shows v2.3, as noted in the spec header.

---

## 17 November 2026 — README as the handover file ✅

- **`README.md` Part 1 is a handover for new Claude sessions:** a start prompt, the rules, what's built, how to run it, commands, environment, a repo map, decisions, open issues, gotchas and what's next.
- **Part 2 embeds the full spec (v2.4)** word for word. `pnpm docs:readme` refreshes it, and `tests/architecture/readme-spec.test.ts` fails if it falls behind.
- **Spec additions:** brand and illustration style (slates and chalk), the Home design, the city layout, and the "no sideways scroll" rule (§6.2, §6.5).
- **Part A and CLAUDE.md:** after a spec change, run `pnpm docs:readme`.

---

## 17 November 2026 — Admin sign-in with email and password ✅

- **Sign-in:** `/admin/login` now takes email and password (decision 0005). Only `ADMIN_EMAILS` can sign in, against the scrypt hash in `ADMIN_PASSWORD_HASH`.
- **Failures:** wrong details give one generic message, and five failures per IP in 15 minutes block further attempts.
- **Audit:** every login is in the audit log.
- **Setup:** `pnpm admin:password` prints a hash. The PM's admin (`founder@yoppi.in`) is set in `.env.local`, which is gitignored; no password is in the repo.
- **Tests:**
  - unit tests for hashing;
  - end-to-end tests for wrong-password and non-admin refusals, and for an admin signing in and plugging in a model;
  - CI uses a test-only admin.
- **Fix:** hashes use `:` separators, because Next.js expands `$NAME` in `.env` values.

---

## 17 November 2026 — Pillars v1 (all seven) and the Founder Pack report ✅

The PM asked for a working v1 of every pillar at once (decision 0006, spec v2.5).

- **Each pillar has its own screen** of numbered steps with structured inputs: rating dots, chips, choices, numbers and small cards. Its logic lives in `pillars/<NN-id>/src/workspace.ts`: state schema, calculators, goals, report out and entities.
- **Works alone, better together:** a fresh workspace pre-fills from approved upstream entities ("From <pillar>"); without them, the pillar asks.
- **Live Goals column** on the right. Each goal fills in when it can be calculated, for example:
  - TAM / SAM / SOM with ranges (Market Research);
  - unit cost and capacity (Operations Setup);
  - contribution, CAC and break-even (Go-to-Market Plan);
  - runway and break-even month (Launch & Growth).
- **Report out** at the end of every pillar. **Founder Pack report** at `/startups/[id]/pack` with all seven blocks; print or save as PDF.
- **Autosave** to a new `PillarWorkspace` table (migration `pillar_workspaces`). **Publish** turns the workspace into the pillar's entities through the Twin, with the founder's approval. Unchanged entities are skipped, and upstream entities become dependencies.
- **AI:** placeholders only, shown where each helper would act.
- **P1 Define:** `pillars/01-discover/SPEC.md` was rewritten in depth and is awaiting sign-off, as the plan for P1 v2.
- **Removed:** the S3 first-question UI (`pillar-workspace.tsx`). The starter API routes stay.
- **Tests:**
  - unit: 159 passing, including P1, P3, P6 and P7 calculators, plus cross-pillar checks that every pillar works alone and publishes only valid entities it owns;
  - end-to-end: 46 passing (2 admin tests skipped without the password), including new v1 flows: P1 → P2 pre-fill, live TAM, the P7 control room and the Founder Pack.
- **Note:** after pulling, run `pnpm db:migrate` and restart `pnpm dev`.

---

## 18 November 2026 — Hosting: bluslate.yoppi.in on Vercel ⚙️

The PM added the custom domain and asked to make the site live. GitHub Pages can't run BluSlate (it needs a server and Postgres), so the PM chose the full app on Vercel (decision 0007).

- **`.github/workflows/deploy.yml`:**
  - runs after CI passes on `main`, or by hand;
  - order: `prisma migrate deploy` → `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod` → a live-site check;
  - skips with a warning until its four secrets exist.
- **`apps/web/vercel.json`:** functions in Mumbai (`bom1`), and Vercel's own Git deploys off.
- **`docs/DEPLOY.md`:** the one-time setup:
  - the Vercel project (Root Directory `apps/web`);
  - Neon in Mumbai;
  - the Namecheap CNAME and removing the GitHub Pages domain;
  - tokens and secrets;
  - Resend and rollback.
- **Checked:** `vercel build --prod` (CLI 65.9.0) succeeds locally on the monorepo. pnpm workspaces, the Prisma 7 client and every route end up in the output.
- **Waiting on the PM:** the one-time setup. The site goes live on the first Deploy run after it.

- **Simplified the same day.** The PM found the token and secrets setup too complicated, so the Actions deploy workflow was removed. Vercel's Git integration now deploys every push to `main`:
  - `apps/web/vercel.json` pins pnpm 12 and calls `scripts/vercel-build.sh`;
  - on production builds, that script runs `prisma migrate deploy` (with `DATABASE_URL_UNPOOLED`), then `next build`;
  - the site URL defaults to bluslate.yoppi.in in production.
  
  A local `vercel build --prod` with `VERCEL_ENV=production` installed with pnpm 12.21.0, applied migrations ("No pending migrations") and built.

- **Region: Singapore, not Mumbai.** Neon offers no Mumbai region, so the database was created in Singapore (`aws-ap-southeast-1`), and `apps/web/vercel.json` now runs the functions in Singapore (`sin1`) as well, so queries don't cross between cities. Decision 0007, `docs/DEPLOY.md` and the README updated.

- **Live (pilot), 18 November 2026.** A duplicate Vercel import (`blu-slate-pf3t`) was deleted; the project is `blu-slate`, with the Neon database `bluslate-db` and the domain. `AUTH_SECRET` is set (a pilot value; rotate it before launch). Against https://bluslate.yoppi.in, the public-page and guest onboarding end-to-end tests pass (the full onboarding test needs a longer timeout over the network). The email sign-in test was skipped: production has no Resend key yet.

- **README shortened (18 November 2026).** The README is now a one-screen summary: done, remaining, accounts and credentials (no secrets; the repo is public), running locally. Working rules, commands, env vars, the code map, decisions, limitations and gotchas moved to `docs/HANDOVER.md`. The embedded spec is folded into a `<details>` block; `pnpm docs:readme` and its drift test still work.

---

## 18 November 2026 — Product README (decision 0008)

The PM asked for a much shorter, product-focused README. `README.md` is now 44 lines: what BluSlate does, the seven steps, what's ready, what's coming. Developer detail, accounts, setup and the embedded spec moved to `docs/HANDOVER.md`; `pnpm docs:readme` became `pnpm docs:handover`, and the drift test checks the handover file.

- **Fix: push deploys failed with a cached build.** From the second successful build on, Vercel restored its build cache, `pnpm install` had nothing to do and skipped `postinstall` (`prisma generate`), so `next build` couldn't find `@/lib/generated/prisma/client` (gitignored). Dashboard redeploys without the cache worked. `scripts/vercel-build.sh` now runs `prisma generate` itself on every build. Checked locally by deleting the generated client and running the script.

---

## 18 November 2026 — Sign in with an email code; guests end; demo video slot (decision 0009) ✅

The PM chose email codes for sign-in, asked that an account remember its email and past work, ended guest login, and asked for a demo video of the user journey instead.

**Built**

- **6-digit email codes.**
  - Auth.js's Resend provider generates the code (`lib/sign-in-code.ts`).
  - The code form checks the code, then opens Auth.js's email callback; the callback route is guarded by the same check.
  - Codes work for 10 minutes and once, and a new code cancels the old one.
  - Five wrong codes cancel an email's codes. Code requests are limited per email and per IP.
  - The new `RateLimit` table (migration `sign_in_codes`) holds the counters.
  - The email subject carries the code.
- **One form, two places** (`components/auth/email-code-form.tsx`): onboarding's new step 4 ("Save your startup") and `/signin`. It remembers the last email on the device, has "Use a different email", and unlocks "Send a new code" after 30 seconds.
- **Where sign-in lands:** `/signin/continue` opens the only startup, My startups when there are several, and Home's onboarding when there are none.
- **Guests end:**
  - `POST /api/startups` needs a session, and private pages send signed-out visitors to `/signin`.
  - "Continue as guest", `NEXT_PUBLIC_REQUIRE_SIGN_IN`, the check-email page and the guest-creation helpers are gone (`lib/guest.ts` became `lib/sessions.ts`).
  - Legacy guests see a notice and can still merge into an account.
- **Header:** one Sign in button.
- **Demo video:** `NEXT_PUBLIC_DEMO_VIDEO_URL` (a YouTube link in privacy-enhanced mode, or a file in `apps/web/public/demo/`) shows a "See a founder's journey" section on Home and a "Watch the demo" link under the onboarding card. It is hidden until set.
- **Fix:** a failed save right after sign-in now reopens step 3 with the error, instead of step 1 with the error hidden.
- **Legal pages:** Privacy, Terms and Cookies now describe codes and accounts (no guest use), list the new local storage item and the YouTube note, and are dated 18 November 2026.

**Tests**

- **Unit:** `lib/sign-in-code.test.ts` covers the code format, normalising, and the hash matching Auth.js's exactly; `lib/demo-video.test.ts` covers the video URL parsing. All 169 unit tests pass (10 of them new).
- **End-to-end:**
  - The onboarding helper now signs up by code.
  - New tests: a returning founder on another device lands straight in their startup; the device remembers the email; a new person who signs in first starts onboarding; a wrong code is refused; guessing against the Auth.js callback is cut off after five tries; private pages and `POST /api/startups` need an account; the sign-in page has no guest option.
  - Run one at a time, all sign-in tests pass on desktop and mobile. With parallel workers the Mac's load average was around 100, and timing tests flaked (pillar navigation, delete, a menu click during a dev recompile). They passed on rerun.
  - The admin password test tripped its 15-minute throttle after repeated runs, as before.

**Not done**

- Not deployed. Production needs Resend first (`docs/DEPLOY.md`), or nobody can sign up.
- Google sign-in, phone OTP, and removing legacy guest accounts are left for later.

---

## 18 November 2026 — Guest login with a name and an email (decision 0010)

The PM asked for guest login again, below the code sign-in, asking only for a name and an email so the team knows who the guests were.

**Built**

- **The guest form** (`components/auth/guest-form.tsx`) sits on `/signin` under "or continue as a guest". It asks for a first name and an email, with no code.
- **`continueAsGuest`** (`lib/auth-actions.ts`):
  - creates a guest `User`, with the email in the new `guestEmail` column (migration `guest_contact`); it never goes in `email`, so it can't sign anyone in;
  - starts a session cookie for this browser;
  - lands on Home's onboarding at step 2 of 3, because the name is known;
  - caps guest creation at 10 per IP per hour in production.
- **Guests keep their work:**
  - the city and My startups show a notice;
  - the profile shows the email they gave;
  - on `/signin` that email is pre-filled, and signing in with a code merges their startups into the verified account.
- The remembered-email helper moved to `components/auth/remembered-email.ts`, shared by both forms.
- Privacy and Cookies describe the guest name and email.

**Tests**

- Lint, typecheck and the 169 unit tests pass.
- New end-to-end test: guest sign-up → onboarding at step 2 → city → profile shows the guest email → sign in with a code, the email pre-filled → the startup is kept.
- After restarting `pnpm dev`, the full end-to-end suite (one worker) passes on desktop and mobile: 52 tests, 2 skipped (the admin model test without `E2E_ADMIN_PASSWORD`). A rerun tripped the admin login throttle as usual.
- **Fix found by the guest test:** a visitor who opened Home, then continued as a guest, came back to step 1 with their name filled in. A known name now always skips step 1.

---

## 18 November 2026 — Live admin and analytics; Start, Try and Pitch on the circle; Product Overview; name and age; account pages (decision 0011)

**Built**

- **Analytics** (`lib/analytics/*`, `POST /api/events`, `AnalyticsEvent` table):
  - first-party product events: page views, onboarding steps and starting point, code requested/verified/failed, guest started, startup created, circle views/tries/start, demo plays, account-page actions;
  - pillar publishes recorded on the server;
  - no IP, no full user agent, nothing typed;
  - skipped for under-18s, Do Not Track, automated browsers and bots;
  - an opt-out on the Cookies page; 13-month retention.
- **Admin:**
  - **Analytics** (`/admin/analytics`, 7/30/90 days): headline tiles, visitors per day, funnels for Home sign-up, code sign-in and guests with drop-off per step, sources/campaigns/landing pages, countries/devices/browsers/systems/ages, pillars opened and published, circle use, code health, account pages;
  - **Consult requests**, with status;
  - **Feedback**: tallies, NPS and comments.
- **Circle** (`components/home/steps-cycle.tsx`):
  - Start in the centre;
  - Try this pillar on each card;
  - Pitch as the eighth stop after step 7, with investors and incubators coming soon;
  - the onboarding card opens beside the circle and shares one store with the hero card (`lib/onboarding-store.ts`);
  - About shows it as **Product Overview**, linking to Home's `?start=1` and `?try=<pillar>`.
- **Name and age:**
  - asked in onboarding step 1, the guest form, and `/welcome` after a first sign-in by code; editable on Profile;
  - all ages allowed; under-18s are not tracked;
  - signed-in founders get a two-step onboarding.
- **Profile menu:** My startups · Collaborate (with a badge for new requests) · Consult · Idea Book · Feedback · Profile · Admin · Log out.
- **Account pages:**
  - Idea Book: memos, 12 suggestions, "Start with this";
  - Collaborate: friend requests by email; verified accounts only; the reply never reveals whether an email has an account;
  - Consult: a form emailed to `CONSULT_NOTIFY_EMAIL` and shown in admin, plus the WhatsApp link;
  - Feedback: five questions and a note.
- **Founder Pack:** the funding placeholder becomes "Investors and incubators to reach out to" (coming soon).
- **Privacy and Cookie policies:** analytics, age, the account pages, retention, and young founders.

**Tests**

- Unit: 178 pass, with new tests for analytics parsing, cleaning, the under-18 rule, the event schema, funnels and NPS.
- End-to-end: new `tests/e2e/account-pages.spec.ts` (circle Start and shared draft, Try this pillar, Pitch, Product Overview, menu order, Idea Book, friend requests between two accounts, Consult, Feedback). The onboarding and guest tests now cover name and age, `/welcome` and the two-step signed-in card.
- Checked by hand:
  - a real-user-agent visitor's events reach the admin funnel;
  - the bot filter works;
  - paths and referrers are cleaned;
  - Home's circle on desktop and phone, with no sideways scroll.

**Fixes found by the tests**

- A visitor who opened Home, then signed in as a guest through in-app navigation, saw step 1 again. The shared onboarding store now re-checks its step when the signed-in state changes.
- A guest who later signed in with a code kept their name but lost their age, and was asked again on `/welcome`. The merge now keeps the age too.
- Leaving `/welcome` stuck on `/signin/continue`, because a server action can't follow a route handler's redirect. The landing page is now worked out on the server (`lib/landing.ts`).

**Waiting on the PM:** `ADMIN_EMAILS`, `ADMIN_PASSWORD_HASH` and `CONSULT_NOTIFY_EMAIL` in Vercel, and a legal view on under-18 consent and EU analytics consent.

