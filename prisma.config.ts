import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Secrets live in apps/web/.env.local (never committed). CI sets DATABASE_URL directly.
config({ path: "apps/web/.env.local", quiet: true });

// Falls back to the local docker-compose database so `prisma generate` works on a fresh clone.
const LOCAL_DATABASE_URL = "postgresql://bluslate:bluslate@localhost:5432/bluslate";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Migrations use the direct connection when there is one (Neon on Vercel sets DATABASE_URL_UNPOOLED).
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? LOCAL_DATABASE_URL,
  },
});
