# 0007 — Production on Vercel at bluslate.yoppi.in

- **Date:** 18 November 2026
- **Requested by:** the PM ("I have added the custom domain bluslate.yoppi.in… configure GitHub Actions and make the website live"), choosing the full app on Vercel over a static GitHub Pages site
- **Status:** Accepted. It follows the spec's hosting choice (Vercel + Neon, B10.2) and fixes how deploys happen.

## Context

The domain was first pointed at GitHub Pages. Pages serves static files only. BluSlate needs a server for:

- Auth.js sessions and guest workspaces;
- autosave;
- Twin publishing;
- the Founder Pack and admin;

and all of those need Postgres. So a Pages build could only have shown the home page.

## Decision

- **Hosting:**
  - the app runs on Vercel (project `blu-slate-pf3t`, Root Directory `apps/web`), with its functions in Singapore (`sin1`), next to the database;
  - the database is Neon Postgres in Singapore (`aws-ap-southeast-1`), added through Vercel Storage. Neon has no Mumbai region, so both moved from the first plan (Mumbai) to Singapore, the closest region it offers.
- **Deploys come from Vercel's Git integration:** every push to `main` goes to production.
  - **First attempt:** a GitHub Actions deploy workflow (Vercel token plus four repository secrets). The PM found the setup too complicated, so it was removed the same day.
  - **Build pins:** `apps/web/vercel.json` pins pnpm 12 for install, and builds through `scripts/vercel-build.sh`.
  - **Migrations first:** on production builds, that script runs `prisma migrate deploy` before `next build`, using `DATABASE_URL_UNPOOLED` (the direct Neon connection; see `prisma.config.ts`). A build without a database stops with a clear message.
- **CI** (`.github/workflows/ci.yml`) still runs on every push, but doesn't gate the deploy.
- **Secrets** live only in Vercel env: `AUTH_SECRET`, the Neon variables, and optional admin, Resend and Anthropic keys.
- **The site URL** defaults to `https://bluslate.yoppi.in` on production builds.

## Consequences

- A push that fails CI can still deploy; check CI. Gating deploys on CI can come back later, when the setup is worth it.
- Admin stays off in production until `ADMIN_PASSWORD_HASH` is set with a new password (never the development one).
- Magic-link sign-in needs `AUTH_RESEND_KEY` and `EMAIL_FROM` with a verified `yoppi.in` sender. Until then guests (and admin, once set up) work, and email sign-in errors.
- Migrations must stay backward compatible (add, don't drop or rename in one step). Rolling back in Vercel doesn't roll back the database.
- Hobby is for non-commercial use: move to Vercel Pro before the public launch (B10.2).
- Setup steps: `docs/DEPLOY.md`.
