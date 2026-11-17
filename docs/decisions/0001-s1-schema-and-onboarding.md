# 0001 — S1: schema additions and onboarding details

- **Date:** 17 November 2026
- **Step:** S1 Website and accounts
- **Status:** Accepted (approved by the PM before S1 was built)

## Context

The S1 prompt (§10.5) asks for the §8.1 models Startup, Member, Entity, Dependency and DecisionEvent, Auth.js email sign-in, and the four-step Home onboarding (§6.0). Several details were not covered by the spec.

## Decisions

1. **Auth.js tables.** `User`, `Account`, `Session` and `VerificationToken` are added, as the Auth.js Prisma adapter requires. `Member.userId` and `Startup.ownerId` gain foreign keys to `User`.
2. **Onboarding answers on Startup.** `Startup` gains `entryPath` (`NEW_IDEA` · `EXISTING` · `ONE_TOOL`) and `onboarding` (JSON). They store the founder's answers exactly as typed (plus the pillar the city should highlight first).
   - They are **founder statements, not Twin entities**. Nothing is published to the Business Twin at onboarding. Discover turns the idea into a Problem in its own approved step.
3. **Startup name.** Onboarding doesn't ask for one on the new-idea and one-tool paths, so the defaults are "*Name*'s idea" and "*Name*'s *Pillar* workspace". The name can be changed on My startups.
4. **Geography and currency.** All three paths ask for a country: `Startup.geography` and `Startup.currency` are required, and every pillar needs a region and currency. The city is optional only on the one-tool path. The currency comes from a short country list (India first) and is a default, not a claim.
5. **Stage values.** New idea → `idea`. Existing → `pre-launch` · `launched` · `growing`. One tool → `unspecified`.
6. **"Help me discover"** asks for an interest area instead of an idea (§4.1: "an interest area plus geography").
7. **Label wording.** Badges and code use **SYNTHETIC** (§5.4, Part C wins). Plain-language prose on public pages may say "simulated".
8. **Magic links in development.** With no `AUTH_RESEND_KEY` and `EMAIL_FROM`, the link is printed in the terminal and written to `.dev-mail/` (gitignored). Production without a key fails loudly.
9. **Legal pages.** `/privacy`, `/terms` and `/cookies` are written to standard practice for an India-based service (DPDP Act 2023, with GDPR notes), with `founder@yoppi.in` as contact and grievance officer. **They need a lawyer's review before public launch.** Points to check: the legal entity name, the jurisdiction clause, the liability cap, the retention periods and the list of service providers.

## Consequences

- S3 adds the remaining §8.1 models (Proposal, Source, SourceLink, Assumption, Persona, Thread, Message, Scenario, …) and the relations from `Entity` to `SourceLink` and from `Startup` to `Scenario`.
- When packages/contracts lands, `apps/web/lib/pillars.ts` should be replaced by the contract's pillar metadata.
