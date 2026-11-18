#!/usr/bin/env bash
# Vercel's build step (apps/web/vercel.json, decision 0007). Runs from apps/web.
# Production builds apply database migrations first, so new code never meets an old schema.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${VERCEL_ENV:-}" = "production" ]; then
  if [ -z "${DATABASE_URL_UNPOOLED:-}${DATABASE_URL:-}" ]; then
    echo "No database: connect the Neon database in Vercel (Storage tab), then redeploy." >&2
    exit 1
  fi
  echo "Applying database migrations…"
  npx --no-install prisma migrate deploy
fi

cd apps/web
npx --no-install next build
