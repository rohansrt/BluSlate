# 0009 — Sign in with a 6-digit email code; guest workspaces end; demo video on Home

- **Date:** 18 November 2026
- **Requested by:** the PM ("We can start with email code, though do remember the email and its past work and save their startups as built. We will end guest login after that, rather a demo video will be uploaded showing the user journey.")
- **Status:** Accepted. Applied in spec v2.6. Supersedes decision 0002 and section 1 of decision 0004. **"Guest workspaces end" is reversed by decision 0010**: guests are back on the Sign in page, with a first name and an email.

## Why

- Magic links break on phones: Gmail and other mail apps open links in their own built-in browser, so the sign-in lands in a different browser from the one the founder was using.
- Guest work lives in one browser's cookie and is lost when cookies are cleared or the founder switches device. Few guests found "Sign up" in the profile menu.
- On the live site, sign-in was not configured, so the Sign in and Sign up buttons led to an error.

## Decision

**Sign-in is a 6-digit code sent by email.**

- Auth.js's email provider (Resend) generates a random 6-digit code instead of a link token. Auth.js stores only `sha256(code + AUTH_SECRET)` in `VerificationToken`.
- The founder types the code on the same page. The form checks it, then opens Auth.js's normal email callback, which creates the session. Sessions, tenant checks and the legacy-guest merge work unchanged.
- A code works for **10 minutes** and **once**. Asking for a new code cancels the old one ("Send a new code" unlocks after 30 seconds).
- **Five wrong codes** within 15 minutes cancel the email's codes, and the founder waits. `GET /api/auth/callback/resend` runs the same check, so calling Auth.js directly can't skip the limit.
- Code requests: at most 5 per hour and 10 per day per email, and 30 per 15 minutes per IP in production.
- Limits are counted in a new `RateLimit` table in Postgres (migration `sign_in_codes`), so they hold across Vercel's serverless instances.
- The email's subject is "123 456 is your BluSlate code", readable from a phone notification. The email has no link.
- In development the code is printed in the terminal and written to `.dev-mail/<email>.json` (field `code`).

**Remember the email and its past work.**

- An account is keyed by its email. Signing in again with the same email, on any device, opens the same startups.
- After sign-in, `/signin/continue` sends a founder with one startup straight into it, with several to My startups, and with none to Home's onboarding.
- Sessions last 30 days from the last visit, so returning founders on the same device stay signed in.
- The browser remembers the last email used (`localStorage` key `bluslate.last-email`) and fills it in next time.

**Guest workspaces end.**

- Home onboarding is four steps again: name, starting point, the one input that path needs, then **Save your startup** (email, then code, then "Open my city"). Founders who are already signed in see three steps.
- `POST /api/startups` needs a session. "Continue as guest" and the `NEXT_PUBLIC_REQUIRE_SIGN_IN` switch are removed. Signed-out visitors to private pages go to `/signin`.
- The header shows one **Sign in** button; sign up is the same flow (`/signin?mode=signup` only changes the heading).
- **Legacy guests** created during the pilot keep their session until it expires (30 days). They see a notice with "Add your email", and signing in with a code in the same browser moves their startups into the verified account (unchanged from decision 0004).

**A demo video on Home** shows the founder journey to visitors who want to look before signing up. It is set by `NEXT_PUBLIC_DEMO_VIDEO_URL`, either a YouTube link (embedded in privacy-enhanced mode) or a file in `apps/web/public/demo/`. The section and its "Watch the demo" link stay hidden until the variable is set.

**Smaller fix found in testing:** if saving the startup fails right after sign-in, the card now reopens at step 3 with the error and "Open my city" as a retry, instead of at step 1 with the error hidden.

## Not done (later)

- Google sign-in, offered as a second option.
- Phone OTP. SMS in India needs DLT registration and costs money per message.
- Deleting legacy guest accounts once their sessions have expired.

## Before deploying

Production needs `AUTH_RESEND_KEY` and `EMAIL_FROM` on a domain verified in Resend (`docs/DEPLOY.md`). Without them nobody can sign in by code. Since decision 0010, "Continue as guest" on the Sign in page still works.

Live end-to-end runs (`E2E_BASE_URL=https://bluslate.yoppi.in`) now send real emails for every onboarding, to `@example.test` addresses that bounce. Limit live runs to the public-page tests, or point them at a real test inbox.
