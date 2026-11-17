# 0005 — Admin sign-in with email and password

- **Date:** 17 November 2026
- **Requested by:** the PM ("just id and password for now for admin")
- **Status:** Accepted, applied in spec v2.4 (§5.8, §6.0, Part A env list)

## Decision

- **How admins sign in:** `/admin/login` asks for **email and password** instead of sending an email link.
- **What's checked:** the email must be listed in `ADMIN_EMAILS`. The password is checked against `ADMIN_PASSWORD_HASH`, a salted scrypt hash in the format `scrypt:<salt>:<hash>`.
  - Create the hash with `pnpm admin:password "<password>"` and put only the hash in the environment.
  - The password itself is never stored, logged or committed.
  - The `:` separator is deliberate: Next.js expands `$NAME` inside `.env` values, which silently broke a `$`-separated hash.
- **On success:** the admin's user is found or created (verified, not a guest) and an Auth.js database session starts. Every admin page then works as before, and the login is written to the audit log.
- **On failure:** a wrong email and a wrong password give the same message ("Wrong email or password.") and don't reveal who is an admin. Five failures per IP in 15 minutes block further attempts. The counter is per server process; use a shared store when there's more than one instance.
- **Founders' sign-in is unchanged:** email link, sign-up, or guest.

## Setup

- **The PM's account:** `founder@yoppi.in`. Its hash is set in `apps/web/.env.local`, which is gitignored. Set a different, strong password for production with `pnpm admin:password`.
- **CI:** CI uses a separate test-only pair (`admin@example.test`). Locally, the admin end-to-end tests run only when `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` are given on the command line.
