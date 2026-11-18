# 0010 — Guest login, with a first name and an email

- **Date:** 18 November 2026
- **Requested by:** the PM ("For now, add guest login as well when someone clicks sign/signup below the normal login by code workflow. Just ask for filling name and mail id so we can have the data from who the guests were.")
- **Status:** Accepted. Applied in spec v2.7. Reverses "Guest workspaces end" in decision 0009; the rest of 0009 stands.

## Decision

- **Where:** on `/signin`, below the email-code form, under "or continue as a guest". Home's onboarding is unchanged: four steps, and the last one signs in by code.
- **What it asks:** a first name and an email, and nothing else. There's no code.
- **What it creates:**
  - a `User` with `isGuest = true`, the first name in `name`, and the email in a new column, `guestEmail` (migration `guest_contact`);
  - an Auth.js database session cookie for this browser, as in decision 0002.
- **The email isn't verified,** so it never goes in `User.email`. It can't sign anyone in and can't claim someone else's account. It tells us who the guests were. The admin dashboard counts guests; the names and emails are in the database.
- **Where guests land:** Home's onboarding, at step 2 of 3 because the name is known, or the page they came from (`callbackUrl`).
- **Keeping the work:**
  - Guests see a notice in My startups and the city, and their profile shows "Email you gave … (not verified yet)".
  - On `/signin` the guest email is pre-filled. Signing in with a code in the same browser moves their startups into the verified account and removes the guest (the merge from decision 0004).
  - A guest who verifies a different email keeps the work too. The guest row is then deleted, along with its `guestEmail`.
- **Abuse limit:** in production, one IP may start 10 guest workspaces per hour (the `RateLimit` table).
- **Privacy and Cookies:** both pages now describe the guest name and email, and that guest work lives in one browser.

## Follow-ups

- If the team wants to see guests without opening the database, add a guest list (name, email, date) to `/admin`.
- A retention rule for inactive guests, stated in the Privacy Policy, before public launch.
- Whether Home's step 4 should also offer the guest option.
