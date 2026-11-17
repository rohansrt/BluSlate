# 0002 — No sign-in for now: guest workspaces

- **Date:** 17 November 2026
- **Requested by:** the PM ("Don't ask for sign in for now")
- **Status:** Accepted. This overrides §6.0 step 4 while `NEXT_PUBLIC_REQUIRE_SIGN_IN` is not `true`.

## Decision

- **Onboarding is three steps.** Step 3's button, "Open my city", creates the startup straight away. There is no email step.
- **Guest workspace.** The first startup creates a guest `User` (`isGuest = true`, no email) and an Auth.js **database session** in this browser, using the standard Auth.js session cookie. `auth()` then treats the visitor like any signed-in user, so tenant isolation (G8, G11) and every page work unchanged.
- **Header.** There is no "Sign in" link. Guests don't see "Sign out", because they have no email to get back in with.
- **Private pages.** A visitor with no workspace is sent back to Home instead of `/signin`.
- **Guest notice.** My startups and the city tell guests that their startups live in this browser only.
- **Kept for later.** Email magic-link sign-in still works at `/signin`, and the end-to-end tests cover it. Setting `NEXT_PUBLIC_REQUIRE_SIGN_IN=true` brings back the four-step onboarding.
- **Schema.** `User.email` is now optional, and `User.isGuest` was added (migration `guest_users`).
- **Legal pages.** Privacy and Cookies were updated to describe use without an account.

## Proposed spec edit (not yet applied)

§6.0 "Home onboarding": add "While sign-in is switched off, step 3 opens the city directly and the startup is kept in a guest workspace in the browser." Part B §B3.2 should match.

## Follow-ups

- **Upgrading a guest.** When sign-in returns, a guest should be able to add an email and keep their startups. That needs account linking: move the startups to the email account on first sign-in from the same browser.
- **Abuse protection.** `POST /api/startups` without a session creates a guest. Add rate limiting before public launch.
- **Clean-up.** Guest workspaces that stay inactive need a retention rule, and the Privacy Policy needs to state it.
