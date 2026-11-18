# 0007 — Production on Vercel at bluslate.yoppi.in, deployed by GitHub Actions

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
  - the app runs on Vercel, with Root Directory `apps/web`;
  - its functions are in Mumbai (`bom1`);
  - the database is Neon Postgres in Mumbai (`aws-ap-south-1`), added through Vercel Storage.
- **The only way to deploy is GitHub Actions** (`.github/workflows/deploy.yml`). It runs after the CI workflow passes on a push to `main`, or by hand. In order, it:
  1. applies migrations with `prisma migrate deploy`, using the direct Neon URL;
  2. runs `vercel pull`;
  3. runs `vercel build --prod` on the runner;
  4. runs `vercel deploy --prebuilt --prod`.

  Vercel's own Git deploys are off (`apps/web/vercel.json`), so code that fails CI or the end-to-end tests never reaches production. Migrations always run before the code that needs them.
- **Secrets:**
  - Runtime secrets live in Vercel env: `AUTH_SECRET`, `ADMIN_PASSWORD_HASH`, `DATABASE_URL`, and later Resend and Anthropic keys.
  - Deploy secrets live in GitHub repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL`.
  - None go in the repo. Without the deploy secrets, the workflow skips with a warning.
- **The Vercel CLI is pinned** (`vercel@65.9.0`); bump it on purpose.

## Consequences

- Production uses a new admin password; the development one in the README never applies there.
- Magic-link sign-in needs `AUTH_RESEND_KEY` and `EMAIL_FROM` with a verified `yoppi.in` sender. Until then guests and admin password sign-in work, and email sign-in errors.
- Migrations must stay backward compatible (add, don't drop or rename in one step). Rolling back in Vercel doesn't roll back the database.
- Hobby is for non-commercial use: move to Vercel Pro before the public launch (B10.2).
- Setup steps: `docs/DEPLOY.md`.
