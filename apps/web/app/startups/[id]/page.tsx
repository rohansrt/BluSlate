import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Quote } from "lucide-react";
import { Badge, Card } from "@bluslate/ui";
import { DeleteStartupButton } from "@/components/delete-startup-button";
import { GuestNotice } from "@/components/guest-notice";
import { JourneyMap } from "@/components/journey/journey-map";
import { onboardingSchema } from "@/lib/onboarding";
import { PILLAR_IDS, type PillarId } from "@/lib/pillars";
import { requireUser } from "@/lib/require-user";
import { ENTRY_PATH_LABEL, getStartupForUser } from "@/lib/startups";
import { twin } from "@/lib/twin";

export const metadata: Metadata = {
  title: "Your city",
  robots: { index: false, follow: false },
};

/** What the founder told us at onboarding, in their own words. */
function founderStatement(raw: unknown): string | null {
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) return null;
  const o = parsed.data;
  if (o.path === "new-idea") {
    return o.details.mode === "idea"
      ? o.details.idea
      : `Help me find a problem in: ${o.details.interest}`;
  }
  if (o.path === "existing") return `${o.details.industry}, ${o.details.stage.replace("-", " ")}`;
  return null;
}

function highlightFrom(raw: unknown): PillarId | null {
  if (!raw || typeof raw !== "object" || !("highlightPillar" in raw)) return null;
  const value = (raw as { highlightPillar?: unknown }).highlightPillar;
  return PILLAR_IDS.includes(value as PillarId) ? (value as PillarId) : null;
}

export default async function CityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/startups/${id}`);
  const startup = await getStartupForUser(id, user.id);
  if (!startup) notFound();

  const statement = founderStatement(startup.onboarding);
  const { pillars } = await twin.statuses(startup.id);
  const statuses = Object.fromEntries(PILLAR_IDS.map((p) => [p, pillars[p].status]));
  const highlight = highlightFrom(startup.onboarding);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/startups"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> My startups
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="city-title">
            {startup.name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden /> {startup.geography}
            </span>
            <span>Currency {startup.currency}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{ENTRY_PATH_LABEL[startup.entryPath]}</Badge>
          {startup.members[0]?.role === "owner" && (
            <DeleteStartupButton id={startup.id} name={startup.name} />
          )}
        </div>
      </div>

      {user.isGuest && (
        <div className="mt-6">
          <GuestNotice />
        </div>
      )}

      {statement && (
        <Card className="mt-6 border-founder/50 p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-founder">
            <Quote className="size-3.5" aria-hidden /> In your words
          </p>
          <p className="mt-2 text-lg">{statement}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Saved exactly as you wrote it. Discover will help you turn it into a clear problem.
          </p>
        </Card>
      )}

      <section aria-labelledby="city-heading" className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="city-heading" className="text-xl font-semibold">
            Your city
          </h2>
          <p className="text-sm text-muted-foreground">
            Seven hubs, one for each step. Open any of them, in any order.
          </p>
        </div>
        <JourneyMap mode="city" startupId={startup.id} highlight={highlight} statuses={statuses} />
      </section>
    </div>
  );
}
