import Link from "next/link";
import { ArrowLeft, Compass, Lightbulb, ShieldAlert, Sparkles } from "lucide-react";
import { Badge, Card, FounderPackIcon, PillarIcon, cn } from "@bluslate/ui";
import { PILLARS, type PillarInfo } from "@/lib/pillars";

/**
 * The standard pillar layout (spec §6.1, §6.3): city hubs on the left, the
 * pillar's workspace in the centre with Work · Evidence · Publish tabs, and the
 * AI rail on the right. Every pillar looks the same, so founders learn it once.
 */
export function PillarShell({
  startup,
  active,
  children,
}: {
  startup: { id: string; name: string };
  active: PillarInfo;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/startups/${startup.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden /> {startup.name}
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
            <PillarIcon id={active.id} className="size-6 text-primary" />
            {active.number} · {active.name}
          </h1>
        </div>
        <span
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground"
          title="Your Founder Pack grows as you work through the steps"
        >
          <FounderPackIcon className="size-4" aria-hidden /> Founder Pack
          <Badge variant="neutral">Soon</Badge>
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
        <HubRail startupId={startup.id} activeId={active.id} />

        <Card className="min-w-0 p-0">
          <div
            role="tablist"
            aria-label={`${active.name} sections`}
            className="flex gap-1 border-b border-border px-4"
          >
            <Tab selected>Work</Tab>
            <Tab>Evidence</Tab>
            <Tab>Publish</Tab>
          </div>
          <div role="tabpanel" aria-label="Work" className="p-5 sm:p-6">
            {children}
          </div>
        </Card>

        <AiRail />
      </div>
    </div>
  );
}

function Tab({ selected = false, children }: { selected?: boolean; children: React.ReactNode }) {
  return (
    <span
      role="tab"
      aria-selected={selected}
      aria-disabled={!selected}
      title={selected ? undefined : "Coming soon"}
      className={cn(
        "-mb-px border-b-2 px-3 py-3 text-sm font-semibold",
        selected
          ? "border-primary text-primary"
          : "cursor-not-allowed border-transparent text-muted-foreground/70",
      )}
    >
      {children}
    </span>
  );
}

function HubRail({ startupId, activeId }: { startupId: string; activeId: string }) {
  return (
    <nav aria-label="City hubs" className="min-w-0">
      <p className="mb-2 hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">
        City hubs
      </p>
      <ol className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
        {PILLARS.map((p) => {
          const current = p.id === activeId;
          return (
            <li key={p.id} className="shrink-0">
              <Link
                href={`/startups/${startupId}/${p.id}`}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm transition-colors lg:border-transparent",
                  current
                    ? "border-primary bg-founder-soft font-semibold text-primary"
                    : "border-border bg-card hover:bg-accent lg:bg-transparent",
                )}
              >
                <PillarIcon id={p.id} className="size-4" />
                <span>
                  {p.number} {p.name}
                </span>
                {/* Status dot: every hub is "Not started" until the Twin exists (S3). */}
                <span
                  className="ml-auto hidden size-2 rounded-full border border-muted-foreground/50 lg:block"
                  title="Not started"
                  aria-label="Not started"
                />
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function AiRail() {
  const items = [
    {
      icon: Compass,
      title: "Guide me",
      body: "Explains the idea in a few lines, asks 2–4 questions, offers options.",
    },
    { icon: ShieldAlert, title: "Reality check", body: "Flags problems, like a price below cost." },
    {
      icon: Lightbulb,
      title: "Next best action",
      body: "Points to the most useful thing to do next.",
    },
  ];
  return (
    <aside aria-label="AI helper" className="space-y-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Sparkles className="size-3.5" aria-hidden /> AI helper
        <Badge variant="neutral">Soon</Badge>
      </p>
      {items.map(({ icon: Icon, title, body }) => (
        <Card key={title} className="border-dashed border-ai/60 bg-ai-soft/40 p-4 shadow-none">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="size-4 text-ai" aria-hidden /> {title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{body}</p>
        </Card>
      ))}
      <p className="text-xs text-muted-foreground">
        AI suggestions always arrive as drafts. Nothing enters your plan until you approve it.
      </p>
    </aside>
  );
}
