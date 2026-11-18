# Deploying BluSlate to bluslate.yoppi.in

BluSlate is a server app with a database, so it can't run on GitHub Pages (static files only). It runs on **Vercel** (project `blu-slate`, team "JoyBoy's projects"), with a **Neon** Postgres database in Singapore (decision 0007).

**How deploys work:** Vercel is connected to the GitHub repo, and every push to `main` deploys to production.

- `apps/web/vercel.json` runs the app in Singapore (`sin1`), next to the database, and pins pnpm 12.
- Its build runs `scripts/vercel-build.sh`. On production builds, that applies new database migrations first, then builds the app.
- GitHub Actions CI still runs on every push, but it doesn't block the deploy. Check that CI is green.

## One-time setup

1. **Import** `rohansrt/BluSlate` in Vercel with Root Directory `apps/web`, then click Deploy. The first build fails without a database; that's expected. *(Done.)*
2. **Database:** in the project, open **Storage → Create Database → Neon**. Choose the Free plan and the **Singapore (aws-ap-southeast-1)** region (Neon has no Mumbai region). Leave **Auth** and **Realtime** off: BluSlate has its own sign-in. Connect it to all environments. *(Done.)* This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
3. **Secret:** go to **Settings → Environment Variables** and add `AUTH_SECRET`. Make the value with `openssl rand -base64 32`.
4. **Redeploy:** open **Deployments**, click the latest deployment's **⋯** menu and choose **Redeploy**.
5. **Domain:**
   1. In Vercel, add `bluslate.yoppi.in` under **Settings → Domains**. Vercel shows a CNAME value for it.
   2. In **Namecheap**, open **Domain List → yoppi.in → Manage → Advanced DNS**. Change the CNAME for host `bluslate` from `rohansrt.github.io.` to that value. Leave the other records alone.
   3. In **GitHub → BluSlate → Settings → Pages**, remove the custom domain.

## Optional, when needed

| To switch on | Add in Vercel → Settings → Environment Variables, then redeploy |
| --- | --- |
| Admin (`/admin/login`) | `ADMIN_EMAILS=founder@yoppi.in` and `ADMIN_PASSWORD_HASH`, from `pnpm admin:password "a new strong password"`. Don't reuse the development password |
| Email sign-in | `AUTH_RESEND_KEY` and `EMAIL_FROM` (e.g. `BluSlate <signin@yoppi.in>`), after verifying `yoppi.in` at resend.com |
| AI | `ANTHROPIC_API_KEY`, then add a model at `/admin/models` |

Without these, visitors still use BluSlate as guests.

## Notes

- **Env vars only apply to new deployments,** so redeploy after changing one.
- **Rollback:** in **Deployments**, pick an earlier deployment and choose **Promote to Production**. The database isn't rolled back, so write migrations that only add things.
- **Plan:** Vercel's free Hobby plan is for non-commercial use. Move to Pro (spec B10.2) before the public launch.
- **The site URL** defaults to `https://bluslate.yoppi.in` in production. Set `NEXT_PUBLIC_SITE_URL` to override it.
