import type { Metadata } from "next";
import Link from "next/link";
import { Card, cn } from "@bluslate/ui";
import { AdminShell, StatTile } from "@/components/admin/admin-shell";
import { BarList, DailyBars, FunnelChart } from "@/components/admin/charts";
import { audit, requireAdmin } from "@/lib/admin";
import { RANGES, analyticsReport, type RangeDays } from "@/lib/admin-analytics";

export const metadata: Metadata = {
  title: "Analytics · Admin",
  robots: { index: false, follow: false },
};

const num = new Intl.NumberFormat("en-IN");

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <h3 className="font-semibold">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

/** Visitor analytics and funnels (docs/decisions/0011). */
export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const admin = await requireAdmin();
  const requested = Number((await searchParams).days);
  const days: RangeDays = (RANGES as readonly number[]).includes(requested)
    ? (requested as RangeDays)
    : 30;
  await audit(admin.email, "analytics.view", { days });
  const r = await analyticsReport(days);
  const h = r.headline;

  return (
    <AdminShell
      active="/admin/analytics"
      adminEmail={admin.email}
      title="Analytics"
      description="Who visits, where they come from, what they do, and where they drop off."
      actions={
        <nav aria-label="Date range" className="flex gap-1 rounded-xl bg-muted p-1">
          {RANGES.map((d) => (
            <Link
              key={d}
              href={`/admin/analytics?days=${d}`}
              aria-current={d === days ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                d === days ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {d} days
            </Link>
          ))}
        </nav>
      }
    >
      <p className="text-sm text-muted-foreground">
        Last {days} days. Visitors are counted by a random ID in their browser. Bots, people under
        18 and browsers that send Do Not Track are never recorded, so totals are slightly low.
        {r.truncated && " Very busy period: only the most recent 200,000 events are counted."}
      </p>

      <section
        aria-label="Headline numbers"
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="analytics-headline"
      >
        <StatTile
          label="Visitors"
          value={num.format(h.visitors)}
          hint={`${num.format(h.returning)} came back on another day`}
        />
        <StatTile
          label="Visits (sessions)"
          value={num.format(h.sessions)}
          hint={`${num.format(h.pageViews)} page views`}
        />
        <StatTile
          label="New accounts"
          value={num.format(h.newAccounts)}
          hint={`plus ${num.format(h.newGuests)} guests`}
        />
        <StatTile
          label="Startups created"
          value={num.format(h.startupsCreated)}
          hint={
            h.activationPct == null
              ? "No new people yet"
              : `${h.activationPct}% of new people published a pillar`
          }
        />
      </section>

      <section aria-label="Visitors per day" className="mt-6">
        <Panel title="Visitors per day">
          <DailyBars rows={r.daily} />
        </Panel>
      </section>

      <section aria-labelledby="funnels" className="mt-10">
        <h2 id="funnels" className="text-xl font-semibold">
          Funnels: where people drop off
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Each step counts visitors who reached it. A drop of 50% or more is marked in red.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <Panel
              title="Home sign-up journey"
              hint="From the Home page to a first published pillar"
            >
              <FunnelChart stages={r.signupFunnel} testId="signup-funnel" />
            </Panel>
          </div>
          <Panel
            title="Sign in with a code"
            hint="Returning founders and sign-ups from the Sign in page"
          >
            <FunnelChart stages={r.signinFunnel} />
          </Panel>
          <Panel title="Guests" hint="From the Sign in page to a guest's first startup">
            <FunnelChart stages={r.guestFunnel} />
          </Panel>
        </div>
      </section>

      <section aria-labelledby="sources" className="mt-10">
        <h2 id="sources" className="text-xl font-semibold">
          Where visitors come from
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Panel title="Sources" hint="Visits by UTM source, else the referring site">
            <BarList rows={r.sources} unit="visits" />
          </Panel>
          <Panel title="Campaigns" hint="utm_campaign on links you share">
            <BarList rows={r.campaigns} unit="visits" empty="No tagged links yet." />
          </Panel>
          <Panel title="Landing pages" hint="The first page of each visit">
            <BarList rows={r.landingPages} unit="visits" />
          </Panel>
        </div>
      </section>

      <section aria-labelledby="who" className="mt-10">
        <h2 id="who" className="text-xl font-semibold">
          Who they are
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Panel title="Countries" hint="From the network, never stored as an IP address">
            <BarList rows={r.countries} unit="visitors" />
          </Panel>
          <Panel title="Devices">
            <BarList rows={r.devices} unit="visitors" />
          </Panel>
          <Panel title="Age of new people" hint="Accounts and guests created in this period">
            <BarList rows={r.ages} unit="people" empty="No new people yet." />
          </Panel>
          <Panel title="Browsers">
            <BarList rows={r.browsers} unit="visitors" />
          </Panel>
          <Panel title="Operating systems">
            <BarList rows={r.systems} unit="visitors" />
          </Panel>
          <Panel title="Starting points chosen" hint="Step 2 of the onboarding card">
            <BarList rows={r.entryPaths} unit="times" />
          </Panel>
        </div>
      </section>

      <section aria-labelledby="use" className="mt-10">
        <h2 id="use" className="text-xl font-semibold">
          What they do
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Panel title="Pillars opened" hint="Visitors who opened each pillar">
            <BarList rows={r.pillarOpens} unit="visitors" limit={7} />
          </Panel>
          <Panel title="Pillars published" hint="Approvals into the Business Twin">
            <BarList rows={r.publishesByPillar} unit="publishes" limit={7} />
          </Panel>
          <Panel title="Top pages">
            <BarList rows={r.topPages} unit="views" />
          </Panel>
          <Panel
            title="Seven-step circle: cards viewed"
            hint={`Start pressed ${num.format(r.circleStarts)} times`}
          >
            <BarList rows={r.circleViews} unit="views" limit={8} />
          </Panel>
          <Panel title="Seven-step circle: Try this pillar">
            <BarList rows={r.circleTries} unit="clicks" limit={8} />
          </Panel>
          <Panel title="Sign-in codes">
            <BarList rows={r.codeHealth} unit="times" />
          </Panel>
          <Panel title="Account pages and demo">
            <BarList rows={r.accountPages} unit="times" />
          </Panel>
        </div>
      </section>
    </AdminShell>
  );
}
