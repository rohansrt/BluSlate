# BluSlate — handover detail

The README is the short version. This file holds the detail a developer or a new Claude session needs. The full spec is `docs/BLUSLATE_SPEC.md`; the history is `docs/PROGRESS.md` and `docs/decisions/`.

## Rules that matter most

- **The PM's instructions win over the spec.** When they differ: implement the instruction, write a decision record in `docs/decisions/`, and update `docs/BLUSLATE_SPEC.md` and `CLAUDE.md` in the same piece of work. Then run `pnpm docs:readme` so this README's embedded copy matches.
- **Build in spec order** (Part C §10).
  - Stage 1 structure is done.
  - Each pillar then goes **Define → Build → Review**. Never build a pillar before the PM signs off its `pillars/<NN-id>/SPEC.md`.
  - Show the plan before each step.
- **Guardrails (§9) are non-negotiable:**
  - Real data is never confused with simulated.
  - AI never publishes; every publish needs the founder's approval.
  - No real-world action happens without explicit approval.
  - No invented numbers, sources, investors or suppliers.
  - API keys never go in code or the database.
- **When a step ends:**
  1. Run `pnpm lint && pnpm typecheck && pnpm test` (plus `pnpm test:e2e` for UI changes).
  2. Append to `docs/PROGRESS.md`.
  3. Commit straight to `main`.

## How the app behaves (v1)

- **Onboarding:** visitors onboard in three steps without an account; a guest workspace is created. They can sign up later and keep their startups.
- **Pillars (v1):** each pillar page is its own set of numbered steps. Answers autosave to the pillar's workspace (`PillarWorkspace`). The right column shows live Goals, Publish and the AI helpers. "Review and publish" lists every entity it will create, and Approve publishes them through the Twin; unchanged ones are skipped.
- **Upstream pre-fill:** a fresh workspace reads the approved entities the pillar may read (§3.1), so Customer Discovery starts from the published Problem, Go-to-Market from the costs, and so on. Used alone, each pillar asks for what it needs.
- **AI:** every AI feature is a visible "AI · coming soon" placeholder in v1. The gateway and model registry from S3 are in place for when they're built.

**Adding to a pillar:** change `pillars/<NN-id>/src/workspace.ts` (schema with defaults, `goals`, `report`, `entities`) and `ui/index.tsx`. Keep new state fields defaulted, so saved workspaces still parse.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Web app on :3000 |
| `pnpm lint` / `pnpm typecheck` | ESLint (incl. architecture boundaries) / TypeScript across all packages |
| `pnpm test` | Vitest unit tests (Twin, gateway, contracts, pillar smoke, UI, boundaries, README sync) |
| `pnpm test:e2e` | Playwright on desktop + mobile (starts or reuses `pnpm dev`) |
| `pnpm build` | Production build |
| `pnpm db:migrate` | Prisma migrate (dev) |
| `pnpm docs:readme` | Refresh this README's embedded spec from `docs/BLUSLATE_SPEC.md` |
| `pnpm admin:password "…"` | Print the hash to put in `ADMIN_PASSWORD_HASH` |
| `pnpm worker`, `pnpm eval` | Stubs until later steps |

## Environment (`apps/web/.env.local`, never committed)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres (docker-compose locally) |
| `AUTH_SECRET` | Auth.js secret |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL, sitemap, Open Graph |
| `ADMIN_EMAILS` | Comma-separated emails allowed into `/admin` |
| `ADMIN_PASSWORD_HASH` | Admin sign-in password as a scrypt hash (`pnpm admin:password`). Never the password itself |
| `ANTHROPIC_API_KEY` | The app's own Claude key. Models are chosen in `/admin/models`, which refers to this variable by name |
| `AI_DAILY_COST_CAP_USD` | Optional per-startup daily AI spend cap |
| `AUTH_RESEND_KEY`, `EMAIL_FROM` | Production sign-in email (Resend, verified domain) |
| `NEXT_PUBLIC_REQUIRE_SIGN_IN` | `true` restores email sign-in as onboarding step 4 |

## Where things live

```
apps/web/                 Next.js 16 app (App Router)
  app/                    pages: / about privacy terms cookies signin profile
                          startups/[id] (city) and startups/[id]/[pillar]
                          admin (overview, models, models/new, audit, login)
                          api/startups/... (§7.4 routes)
  components/             header, profile menu, onboarding card, home (hero art, steps loop),
                          journey map (city), pillar shell + workspace, admin
  lib/                    db, auth actions, guest + guest-merge, twin (+ Postgres store),
                          ai (+ model registry resolver), admin (+ stats, actions), pillar registry
pillars/0N-<id>/          one package per pillar: SPEC.md, src/workspace.ts (state, calculators,
                          goals, report out, entities), src/{module,starter,ai-tasks}.ts,
                          ui/index.tsx (the pillar's screen), tests/
packages/contracts        pillar metadata, entity types + Zod schemas, PillarModule, PillarStarter
packages/twin             Business Twin: drafts, approval-gated publish, versions, decisions,
                          dependencies, staleness, statuses, proposals, snapshots, assumptions
packages/ai               AI gateway: ai.run / ai.stream, tasks, envelope, checks, pricing,
                          model catalogue, ModelResolver
packages/ui               design tokens, components, slate drawings, workbench pieces (Goals panel,
                          Dots, chips, number fields, row lists, charts, Report out, AI placeholder)
packages/sim-kernel, reports   placeholders (P7, F1)
prisma/                   schema + migrations
tests/e2e, tests/architecture  Playwright; import-boundary and README-sync tests
docs/                     BLUSLATE_SPEC.md (source of truth), PM review PDF (v2.3, outdated),
                          PROGRESS.md, DEPLOY.md, decisions/0001–0007, brand/
```

**Key mechanics:**

- **Business Twin:** `Entity` rows are immutable published versions. `Draft` is the editable workspace and `StaleMark` holds the "may be outdated" marks. Statuses are computed.
- **Single writer:** only the owning pillar publishes a type. Enforced in `packages/twin` and by ESLint (pillars never import each other; `packages/ai` can't import the Twin).
- **Model choice:** `AiModelAssignment` holds the pillar's tier first, then the default. Keys are read from env by `*_API_KEY` name.
- **Guests:**
  - A `User` with `isGuest = true` plus an Auth.js database session.
  - On sign-up, a signed cookie moves a guest's startups into the verified account, in the same browser only.

## Decisions so far (`docs/decisions/`)

- **0001:** S1 schema additions, onboarding details, legal pages (they need a lawyer's review before launch).
- **0002:** no sign-in for now; guest workspaces.
- **0003:** Twin workspace tables, each pillar's first question, AI gateway details.
- **0004:** accounts and profile menu, guest sign-up, deleting startups, the admin dashboard, the AI model registry, new pillar names.
- **0005:** admin sign-in with email and password (a hash in env, failed attempts throttled).
- **0006:** v1 of all seven pillars at once: own screens, live Goals, Report out, the Founder Pack report, AI as placeholders, the `PillarWorkspace` table.
- **0007:** production on Vercel (Singapore) with Neon, at `bluslate.yoppi.in`; Vercel deploys every push to `main` and runs migrations first.

## Known limitations

- **Launch & Growth:** its `Scenario` exists as both an entity and a table; decide in P7.
- **Unbuilt parts:** the Evidence view, the time strip, the full simulation kernel (P7 v1 uses a simple monthly model), and the Founder Pack's pitch, workbook, canvas and funding exports.
- **Removing published items:** deleting a row from a workspace doesn't retire its last published entity (v1 limitation, decision 0006).
- **PDF:** `docs/BluSlate_PM_Review.pdf` is still v2.3.

## Gotchas

- The Docker CLI is at `/Applications/Docker.app/Contents/Resources/bin/docker`. Start the app with `open -a Docker`.
- pnpm 12 refuses very fresh releases (minimum release age). Pick a slightly older version; don't add exemptions.
- After a Prisma migration, **restart `pnpm dev`**: the dev server keeps the old client cached.
- End-to-end tests share the local database. Admin model tests run on desktop only and clean up after themselves.
- The admin end-to-end test needs the password: `E2E_ADMIN_EMAIL=founder@yoppi.in E2E_ADMIN_PASSWORD='…' pnpm test:e2e`. It's skipped otherwise; CI uses its own test-only admin.
- Next.js expands `$NAME` inside `.env` values. Avoid `$` in env values, which is why password hashes use `:`.
