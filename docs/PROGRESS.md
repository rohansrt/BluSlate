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
