import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// One client per server process; reused across hot reloads in development.
// After `prisma generate` (e.g. a new migration) the client class changes, so
// a fresh client is made rather than reusing one built from the old schema.
// Keyed by class: route handlers and pages can each load their own copy.
const globalForPrisma = globalThis as unknown as {
  prismaClients?: Map<typeof PrismaClient, PrismaClient>;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to apps/web/.env.local.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

function devClient(): PrismaClient {
  const clients = (globalForPrisma.prismaClients ??= new Map());
  let client = clients.get(PrismaClient);
  if (!client) {
    client = createClient();
    clients.set(PrismaClient, client);
  }
  return client;
}

export const prisma: PrismaClient =
  process.env.NODE_ENV === "production" ? createClient() : devClient();
