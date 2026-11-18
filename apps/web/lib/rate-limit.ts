import "server-only";
import { prisma } from "@/lib/db";

/**
 * Fixed-window counters kept in Postgres (docs/decisions/0009), so a limit
 * holds across serverless instances. Used for sign-in codes: how many codes an
 * email or IP may request, and how many wrong codes an email may enter.
 */

/** Count one hit on `key` and return how many hits the current window now holds. */
export async function hit(key: string, windowMs: number): Promise<number> {
  const seconds = windowMs / 1000;
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${key}, 1, now() AT TIME ZONE 'UTC')
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" < (now() AT TIME ZONE 'UTC') - make_interval(secs => ${seconds}::double precision)
        THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE
        WHEN "RateLimit"."windowStart" < (now() AT TIME ZONE 'UTC') - make_interval(secs => ${seconds}::double precision)
        THEN now() AT TIME ZONE 'UTC' ELSE "RateLimit"."windowStart" END
    RETURNING "count"`;
  return Number(rows[0]?.count ?? 0);
}

/** Whether `key` has already used up `limit` hits in the current window (doesn't count a hit). */
export async function isLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  const seconds = windowMs / 1000;
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    SELECT "count" FROM "RateLimit"
    WHERE "key" = ${key}
      AND "windowStart" >= (now() AT TIME ZONE 'UTC') - make_interval(secs => ${seconds}::double precision)`;
  return Number(rows[0]?.count ?? 0) >= limit;
}

export async function clearLimit(key: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "key" = ${key}`;
}
