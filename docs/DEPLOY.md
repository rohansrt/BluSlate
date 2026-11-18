# Deploying BluSlate to bluslate.yoppi.in

BluSlate is a server app with a database, so it can't run on GitHub Pages (static files only). It runs on **Vercel**, with its **Neon** Postgres database in Mumbai. GitHub Actions does the deploying (decision 0007):

1. You push to `main`.
2. **CI** runs: lint, typecheck, unit tests, build, end-to-end tests.
3. If CI passes, **Deploy** (`.github/workflows/deploy.yml`):
   - applies new database migrations (`prisma migrate deploy`);
   - builds on GitHub's runner;
   - ships the build to Vercel production.

Vercel's own Git deploys are switched off (`apps/web/vercel.json`), so a commit that fails CI never goes live. You can also run Deploy by hand: **GitHub → Actions → Deploy → Run workflow**.

Until the four secrets in step 6 exist, Deploy skips itself with a warning rather than failing.

## One-time setup (about 20 minutes)

### 1. Make two production secrets on your Mac

In the BluSlate folder:

```bash
openssl rand -base64 32                      # → AUTH_SECRET
pnpm admin:password "a NEW strong password"  # → ADMIN_PASSWORD_HASH
```

Use a new admin password, not the development one in the README.

### 2. Create the Vercel project

1. Go to <https://vercel.com/signup> and continue with GitHub.
2. Choose **Add New… → Project**, then import **rohansrt/BluSlate**.
3. Set **Root Directory** to `apps/web` (click Edit). Framework: Next.js.
4. Open **Environment Variables** and add:

   | Name | Value |
   | --- | --- |
   | `AUTH_SECRET` | from step 1 |
   | `ADMIN_PASSWORD_HASH` | from step 1 |
   | `ADMIN_EMAILS` | `founder@yoppi.in` |
   | `NEXT_PUBLIC_SITE_URL` | `https://bluslate.yoppi.in` |

5. Click **Deploy**. This first build is Vercel's own attempt and may fail or not run. That's fine: from now on GitHub Actions does the deploys.

### 3. Add the database (Neon, through Vercel)

1. In the project, open **Storage → Create Database → Neon**.
2. Region: **Mumbai (aws-ap-south-1)**. The free plan is enough for now.
3. Connect it to the project for all environments.

Vercel then adds `DATABASE_URL` (used by the app) and `DATABASE_URL_UNPOOLED` (used for migrations) to the project.

### 4. Point the domain at Vercel

1. In the project, open **Settings → Domains → Add** and enter `bluslate.yoppi.in`. Vercel shows a **CNAME** value for it.
2. Edit the DNS in **Namecheap** (yoppi.in's DNS lives there): **Domain List → yoppi.in → Manage → Advanced DNS**.
3. Change the `CNAME` record for host `bluslate` from `rohansrt.github.io.` to the value Vercel showed. Leave everything else alone, because `yoppi.in` itself stays on GitHub Pages.
4. In **GitHub → BluSlate → Settings → Pages**, remove the custom domain and set Source to **None**, so GitHub stops claiming `bluslate.yoppi.in`.

Vercel issues the HTTPS certificate by itself once DNS has updated, usually within minutes.

### 5. Find the three Vercel values

| Value | Where |
| --- | --- |
| Token | <https://vercel.com/account/tokens> → Create, e.g. name it `github-actions-bluslate` |
| Project ID | Project → **Settings → General** → Project ID (`prj_…`) |
| Team ID | Team/account **Settings → General** → Team ID (`team_…`) |

### 6. Add the GitHub secrets

Go to **GitHub → BluSlate → Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `VERCEL_TOKEN` | the token |
| `VERCEL_ORG_ID` | the Team ID |
| `VERCEL_PROJECT_ID` | the Project ID |
| `DATABASE_URL` | the value of `DATABASE_URL_UNPOOLED` from Vercel **Settings → Environment Variables** (or Neon's "direct connection" string) |

### 7. Deploy

Go to **GitHub → Actions → Deploy → Run workflow** (branch `main`). When it's green, open <https://bluslate.yoppi.in>.

## Later

- **Sign-in emails.** Visitors can use BluSlate as guests now, and admin sign-in uses a password. Email sign-in (magic links) needs Resend:
  1. Verify `yoppi.in` at <https://resend.com> by adding its DNS records in Namecheap.
  2. Add `AUTH_RESEND_KEY` and `EMAIL_FROM` (e.g. `BluSlate <signin@yoppi.in>`) in Vercel.
  3. Run Deploy again.

  Until then, email sign-in shows an error.
- **AI.** Add `ANTHROPIC_API_KEY` in Vercel, then add a model at `/admin/models`.
- **Plan.** Vercel's free Hobby plan is for non-commercial use. Move to Pro (spec B10.2) before the public launch.
- **Changing env vars.** Vercel only applies changed variables to new deployments, so run Deploy again after changing one.
- **Rollback.** In Vercel, open **Deployments**, pick an earlier one and choose **Promote to Production**. Database migrations aren't rolled back, so write migrations that only add things.
