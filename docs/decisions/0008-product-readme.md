# 0008 — A product README; developer detail in docs/HANDOVER.md

- **Date:** 18 November 2026
- **Requested by:** the PM ("cut down read me, just too much. Make it very product based. Not so technical.")
- **Status:** Accepted. It changes the Part A rule that embedded the spec in `README.md`.

## Decision

- `README.md` is a short product overview: what BluSlate does, the seven steps, what's ready, what's coming, contact. No setup or code detail.
- `docs/HANDOVER.md` holds everything for developers and new Claude sessions: what's next, accounts and where credentials live (the repo is public, so never secret values), running locally, working rules, commands, env vars, the code map, decisions, limitations, gotchas, and the full spec at the end.
- `pnpm docs:readme` became `pnpm docs:handover` (`scripts/sync-handover.mjs`), and the drift test (`tests/architecture/handover-spec.test.ts`) now checks `docs/HANDOVER.md`.

## Consequences

- To hand the project to a Claude chat outside Claude Code, attach `docs/HANDOVER.md` (not the README).
- `CLAUDE.md` and Part A of `docs/BLUSLATE_SPEC.md` point at the new command and file.
