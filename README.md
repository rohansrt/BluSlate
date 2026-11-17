# BluSlate

BluSlate is an AI-powered startup intelligence and simulation platform that helps founders discover, validate, build, launch, and grow businesses through real-world research, interactive tools, and dynamic market simulations.

It takes an idea through seven pillars (Discover, Customers, Market, Build, Set Up, Go to Market, Run & Grow), runs it in a simulated market over time, and exports a Founder Pack.

- Spec: [docs/BLUSLATE_SPEC.md](docs/BLUSLATE_SPEC.md) (Part C is authoritative)
- Rules for Claude Code: [CLAUDE.md](CLAUDE.md)
- Progress log: [docs/PROGRESS.md](docs/PROGRESS.md)

## Run it locally

You need Node.js 22, pnpm (`corepack enable pnpm`) and Docker Desktop.

```bash
pnpm install
cp .env.example apps/web/.env.local    # then set AUTH_SECRET: openssl rand -base64 32
docker compose up -d                   # Postgres 16
pnpm db:migrate
pnpm dev                               # http://localhost:3000
```

In development no email is sent. The sign-in link is printed in the terminal running `pnpm dev` and saved in `.dev-mail/`.

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test   # unit tests (Vitest)
pnpm test:e2e                              # end-to-end (Playwright; needs the database running)
```

## Layout

```
apps/web/      the website (Next.js App Router)
pillars/       one self-contained folder per pillar (from S2)
packages/      shared parts: contracts, twin, ai, sim-kernel, reports, ui
worker/        background jobs (from S3)
prisma/        database schema and migrations
docs/          spec, PM review, progress log, decisions
```
