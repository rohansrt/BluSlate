import "server-only";
import { listStartupsForUser } from "@/lib/startups";

/**
 * Where a founder lands after signing in (docs/decisions/0009): their only
 * startup, My startups when there are several, Home's onboarding when none.
 */
export async function landingPathFor(userId: string): Promise<string> {
  const startups = await listStartupsForUser(userId);
  if (startups.length === 0) return "/";
  if (startups.length === 1) return `/startups/${startups[0]!.id}`;
  return "/startups";
}
