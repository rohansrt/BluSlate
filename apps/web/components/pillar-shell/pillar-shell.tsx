import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { PillarStatus } from "@bluslate/twin";
import { FounderPackIcon, PillarIcon, cn } from "@bluslate/ui";
import { PILLARS, type PillarId, type PillarInfo } from "@/lib/pillars";
import { PILLAR_STATUS_INFO } from "@/lib/pillar-status";

/**
 * The standard pillar layout (spec §6.1, §6.3): city hubs on the left, the
 * pillar's workspace in the centre with Work · Evidence · Publish tabs, and the
 * Goals column on the right (both in PillarWorkbench). The frame is the same
 * everywhere so founders learn it once; each pillar's screen is its own.
 */
export function PillarShell({
  startup,
  active,
  statuses,
  children,
}: {
  startup: { id: string; name: string };
  active: PillarInfo;
  statuses: Record<PillarId, PillarStatus>;
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
          <p className="mt-0.5 text-sm text-muted-foreground">{active.question}</p>
        </div>
        <Link
          href={`/startups/${startup.id}/pack`}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent"
          title="Your Founder Pack grows as you work through the steps"
        >
          <FounderPackIcon className="size-4" aria-hidden /> Founder Pack report
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
        <HubRail startupId={startup.id} activeId={active.id} statuses={statuses} />
        {children}
      </div>
    </div>
  );
}

function HubRail({
  startupId,
  activeId,
  statuses,
}: {
  startupId: string;
  activeId: string;
  statuses: Record<PillarId, PillarStatus>;
}) {
  return (
    <nav aria-label="City hubs" className="min-w-0">
      <p className="mb-2 hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">
        City hubs
      </p>
      <ol className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
        {PILLARS.map((p) => {
          const current = p.id === activeId;
          const status = PILLAR_STATUS_INFO[statuses[p.id]];
          return (
            <li key={p.id} className="shrink-0">
              <Link
                href={`/startups/${startupId}/${p.id}`}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm transition-colors lg:border-transparent",
                  current
                    ? "border-primary bg-founder-soft font-semibold text-primary"
                    : "border-border bg-card hover:bg-accent lg:bg-transparent",
                )}
              >
                <PillarIcon id={p.id} className="size-4" />
                <span>
                  {p.number} {p.name}
                </span>
                <span
                  className={cn("ml-auto size-2 rounded-full", status.dot)}
                  title={status.label}
                  data-status={statuses[p.id]}
                >
                  <span className="sr-only">{status.label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
