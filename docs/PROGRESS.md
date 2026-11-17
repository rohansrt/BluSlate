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
