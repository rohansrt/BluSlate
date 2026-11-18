import "server-only";
import { prisma } from "@/lib/db";
import { PILLARS } from "@/lib/pillars";
import { funnel, type FunnelStage, type Row } from "@/lib/analytics/funnel";

export type { FunnelStage, Row };

/**
 * Visitor analytics for /admin/analytics (docs/decisions/0011), computed from
 * the first-party AnalyticsEvent table plus account and startup counts.
 * Visitors are counted by their random browser ID; people under 18, people
 * whose browser sends Do Not Track, and bots are never recorded.
 */

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

/** Events older than this are deleted (stated in the Privacy Policy). */
export const RETENTION_DAYS = 395; // 13 months

const MAX_EVENTS = 200_000;

function countBy<T>(items: T[], key: (item: T) => string | null | undefined): Row[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/** Count distinct visitors per value (each visitor once per value). */
function visitorsBy(
  events: { visitorId: string }[],
  key: (e: never) => string | null | undefined,
): Row[] {
  const seen = new Set<string>();
  const rows: { label: string }[] = [];
  for (const e of events) {
    const k = key(e as never);
    if (!k) continue;
    const id = `${e.visitorId}|${k}`;
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push({ label: k });
  }
  return countBy(rows, (r) => r.label);
}

const pillarName = (id: string) => PILLARS.find((p) => p.id === id)?.name ?? id;

function ageBand(age: number): string {
  if (age < 18) return "Under 18";
  if (age < 25) return "18–24";
  if (age < 35) return "25–34";
  if (age < 45) return "35–44";
  return "45+";
}

const PATH_LABELS: Record<string, string> = {
  "new-idea": "New idea",
  existing: "Existing business",
  "one-tool": "One tool",
};

export async function analyticsReport(days: RangeDays, now = new Date()) {
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Keep the table within the retention period stated in the Privacy Policy.
  await prisma.analyticsEvent.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000) } },
  });

  const [events, newUsers, startupsCreated] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      take: MAX_EVENTS,
      select: {
        name: true,
        visitorId: true,
        sessionId: true,
        userId: true,
        path: true,
        referrer: true,
        utmSource: true,
        utmCampaign: true,
        device: true,
        browser: true,
        os: true,
        country: true,
        props: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, isGuest: true, email: true, age: true },
    }),
    prisma.startup.count({ where: { createdAt: { gte: since } } }),
  ]);

  const truncated = events.length >= MAX_EVENTS;
  const browserEvents = events.filter((e) => e.visitorId !== "server");
  const serverEvents = events.filter((e) => e.visitorId === "server");
  const prop = (e: (typeof events)[number], k: string) =>
    e.props && typeof e.props === "object" && !Array.isArray(e.props)
      ? (e.props as Record<string, unknown>)[k]
      : undefined;
  const visitorsWhere = (test: (e: (typeof events)[number]) => boolean) =>
    new Set(browserEvents.filter(test).map((e) => e.visitorId));

  // ── Headline numbers ──
  const visitors = new Set(browserEvents.map((e) => e.visitorId));
  const sessions = new Set(browserEvents.map((e) => e.sessionId));
  const pageViews = browserEvents.filter((e) => e.name === "page_view");
  const daysByVisitor = new Map<string, Set<string>>();
  for (const e of browserEvents) {
    const day = e.createdAt.toISOString().slice(0, 10);
    const set = daysByVisitor.get(e.visitorId) ?? new Set<string>();
    set.add(day);
    daysByVisitor.set(e.visitorId, set);
  }
  const returning = [...daysByVisitor.values()].filter((d) => d.size > 1).length;

  // Accounts: new verified accounts and guests, and how many of them published.
  const verified = newUsers.filter((u) => !u.isGuest && u.email);
  const guests = newUsers.filter((u) => u.isGuest);
  const publishers = new Set(
    serverEvents.filter((e) => e.name === "pillar_published").map((e) => e.userId),
  );
  const activated = newUsers.filter((u) => publishers.has(u.id)).length;

  // ── Daily visitors ──
  const daily: Row[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    daily.push({ label: d, value: 0 });
  }
  const dayIndex = new Map(daily.map((r, i) => [r.label, i]));
  for (const [, set] of daysByVisitor)
    for (const d of set) {
      const i = dayIndex.get(d);
      if (i != null) daily[i]!.value += 1;
    }

  // ── Funnels ──
  const visitorsByUser = new Map<string, Set<string>>();
  for (const e of browserEvents) {
    if (!e.userId) continue;
    const set = visitorsByUser.get(e.userId) ?? new Set<string>();
    set.add(e.visitorId);
    visitorsByUser.set(e.userId, set);
  }
  const publishedVisitors = new Set<string>();
  for (const userId of publishers) {
    if (!userId) continue;
    for (const v of visitorsByUser.get(userId) ?? []) publishedVisitors.add(v);
  }
  const isPillarPage = (path: string | null) =>
    Boolean(path && /^\/startups\/\[id\]\/(?!pack$)[a-z-]+$/.test(path));
  const step = (n: number) => (e: (typeof events)[number]) =>
    e.name === "onboarding_step" && prop(e, "step") === n && prop(e, "signedIn") === false;

  const signupFunnel = funnel([
    {
      label: "Visited Home",
      visitors: visitorsWhere((e) => e.name === "page_view" && e.path === "/"),
    },
    { label: "Gave name and age", visitors: visitorsWhere(step(2)) },
    { label: "Chose a starting point", visitors: visitorsWhere(step(3)) },
    { label: "Described the idea", visitors: visitorsWhere(step(4)) },
    {
      label: "Asked for a code",
      visitors: visitorsWhere(
        (e) => e.name === "code_requested" && prop(e, "where") === "onboarding",
      ),
    },
    {
      label: "Entered the code",
      visitors: visitorsWhere(
        (e) => e.name === "code_verified" && prop(e, "where") === "onboarding",
      ),
    },
    { label: "Startup created", visitors: visitorsWhere((e) => e.name === "startup_created") },
    {
      label: "Opened a pillar",
      visitors: visitorsWhere((e) => e.name === "page_view" && isPillarPage(e.path)),
    },
    { label: "Published a pillar", visitors: publishedVisitors },
  ]);

  const signinFunnel = funnel([
    {
      label: "Opened Sign in",
      visitors: visitorsWhere((e) => e.name === "page_view" && e.path === "/signin"),
    },
    {
      label: "Asked for a code",
      visitors: visitorsWhere((e) => e.name === "code_requested" && prop(e, "where") === "signin"),
    },
    {
      label: "Entered the code",
      visitors: visitorsWhere((e) => e.name === "code_verified" && prop(e, "where") === "signin"),
    },
  ]);

  const guestFunnel = funnel([
    {
      label: "Opened Sign in",
      visitors: visitorsWhere((e) => e.name === "page_view" && e.path === "/signin"),
    },
    { label: "Continued as guest", visitors: visitorsWhere((e) => e.name === "guest_started") },
    {
      label: "Startup created",
      visitors: (() => {
        const guestsSet = visitorsWhere((e) => e.name === "guest_started");
        return new Set(
          browserEvents
            .filter((e) => e.name === "startup_created" && guestsSet.has(e.visitorId))
            .map((e) => e.visitorId),
        );
      })(),
    },
  ]);

  // ── Where visitors come from (per session: the first event's source) ──
  const firstOfSession = new Map<string, (typeof events)[number]>();
  for (const e of browserEvents)
    if (!firstOfSession.has(e.sessionId)) firstOfSession.set(e.sessionId, e);
  const sessionStarts = [...firstOfSession.values()];
  const sources = countBy(sessionStarts, (e) => e.utmSource ?? e.referrer ?? "Direct or unknown");
  const campaigns = countBy(sessionStarts, (e) => e.utmCampaign);
  const landingPages = countBy(sessionStarts, (e) => (e.name === "page_view" ? e.path : null));

  // ── Who (each visitor once per value) ──
  const countries = visitorsBy(
    browserEvents,
    (e: (typeof events)[number]) => e.country ?? "Unknown",
  );
  const devices = visitorsBy(browserEvents, (e: (typeof events)[number]) => e.device);
  const browsers = visitorsBy(browserEvents, (e: (typeof events)[number]) => e.browser);
  const systems = visitorsBy(browserEvents, (e: (typeof events)[number]) => e.os);
  const ages = countBy(
    newUsers.filter((u) => u.age != null),
    (u) => ageBand(u.age!),
  );

  // ── What they do ──
  const topPages = countBy(pageViews, (e) => e.path);
  const entryPaths = countBy(
    browserEvents.filter((e) => e.name === "onboarding_path"),
    (e) => PATH_LABELS[String(prop(e, "path"))] ?? String(prop(e, "path")),
  );
  const stopLabel = (e: (typeof events)[number]) => {
    const s = String(prop(e, "stop") ?? "");
    return s === "pitch" ? "Pitch" : pillarName(s);
  };
  const circleViews = countBy(
    browserEvents.filter((e) => e.name === "circle_view"),
    stopLabel,
  );
  const circleTries = countBy(
    browserEvents.filter((e) => e.name === "circle_try"),
    stopLabel,
  );
  const circleStarts = browserEvents.filter((e) => e.name === "circle_start").length;
  const pillarOpens = visitorsBy(
    browserEvents.filter((e) => e.name === "page_view" && isPillarPage(e.path)),
    (e: (typeof events)[number]) => pillarName(e.path!.split("/").pop() ?? ""),
  );
  const publishesByPillar = countBy(
    serverEvents.filter((e) => e.name === "pillar_published"),
    (e) => pillarName(String(prop(e, "pillar") ?? "")),
  );
  const count = (name: string) => browserEvents.filter((e) => e.name === name).length;
  const codeHealth: Row[] = [
    { label: "Codes asked for", value: count("code_requested") },
    { label: "Codes entered correctly", value: count("code_verified") },
    {
      label: "Wrong or expired codes",
      value: browserEvents.filter((e) => e.name === "code_failed" && prop(e, "stage") === "verify")
        .length,
    },
    {
      label: "Codes that failed to send",
      value: browserEvents.filter((e) => e.name === "code_failed" && prop(e, "stage") === "send")
        .length,
    },
  ];
  const accountPages: Row[] = [
    { label: "Ideas saved", value: count("idea_saved") },
    { label: "Friend requests sent", value: count("friend_request_sent") },
    { label: "Consult requests", value: count("consult_requested") },
    { label: "Feedback sent", value: count("feedback_sent") },
    { label: "Demo video plays", value: count("demo_play") },
  ];

  return {
    days,
    truncated,
    headline: {
      visitors: visitors.size,
      sessions: sessions.size,
      pageViews: pageViews.length,
      returning,
      newAccounts: verified.length,
      newGuests: guests.length,
      startupsCreated,
      activationPct: newUsers.length ? Math.round((activated / newUsers.length) * 100) : null,
    },
    daily,
    signupFunnel,
    signinFunnel,
    guestFunnel,
    sources,
    campaigns,
    landingPages,
    countries,
    devices,
    browsers,
    systems,
    ages,
    topPages,
    entryPaths,
    circleViews,
    circleTries,
    circleStarts,
    pillarOpens,
    publishesByPillar,
    codeHealth,
    accountPages,
  };
}

export type AnalyticsReport = Awaited<ReturnType<typeof analyticsReport>>;
