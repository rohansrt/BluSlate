import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Badge, FounderPackIcon, PillarTile, cn } from "@bluslate/ui";
import type { PillarStatus } from "@bluslate/twin";
import { PILLAR_STATUS_INFO } from "@/lib/pillar-status";
import { PILLARS, type PillarId, type PillarInfo } from "@/lib/pillars";

/**
 * The seven steps as a road with icon hubs (the PM review's cover visual).
 *
 * - "home": the journey explained, with what each step gives you.
 * - "city": the founder's own city (spec §6.2). Hubs show status and open
 *   their pillar. Navigation only; it must load fast and never block work.
 *
 * Wide screens get the road map; narrow screens the same hubs as a vertical route.
 */

export type JourneyMode = "home" | "city";

interface JourneyMapProps {
  mode: JourneyMode;
  /** City mode: the startup whose pillars the hubs open. */
  startupId?: string;
  /** City mode: the hub to suggest first. */
  highlight?: PillarId | null;
  /** City mode: each hub's status from the Twin. */
  statuses?: Partial<Record<PillarId, PillarStatus>>;
}

// Hub positions along the road, as percentages of the map (x, y).
const STOPS: [number, number][] = [
  [8, 78],
  [22, 68],
  [36, 58],
  [50, 50],
  [63, 40],
  [76, 30],
  [88, 20],
];

// The road through the hubs, in the SVG's 1000 × 420 space (x% × 10, y% × 4.2).
const ROAD =
  "M 0 372 Q 40 342 80 328 T 220 286 T 360 244 T 500 210 T 630 168 T 760 126 T 880 84 T 1000 30";

// Background "buildings" for the city feel: x, y, width, height.
const BLOCKS: [number, number, number, number][] = [
  [90, 200, 48, 120],
  [150, 170, 44, 150],
  [330, 140, 52, 130],
  [520, 80, 46, 160],
  [580, 110, 40, 100],
  [700, 60, 36, 90],
  [820, 190, 54, 140],
];

function hubHref(mode: JourneyMode, startupId: string | undefined, id: PillarId) {
  return mode === "city" && startupId ? `/startups/${startupId}/${id}` : undefined;
}

export function JourneyMap({ mode, startupId, highlight = null, statuses = {} }: JourneyMapProps) {
  const statusOf = (id: PillarId): PillarStatus => statuses[id] ?? "not_started";
  // "Start here" only while the suggested hub hasn't been started.
  const suggest = (id: PillarId) => highlight === id && statusOf(id) === "not_started";
  return (
    <div>
      <div className="relative hidden aspect-[1000/420] overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-founder-soft/70 via-card to-card lg:block">
        <svg viewBox="0 0 1000 420" className="absolute inset-0 size-full" aria-hidden>
          {BLOCKS.map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx={8} className="fill-primary/[0.07]" />
          ))}
          <path
            d={ROAD}
            fill="none"
            className="stroke-primary/15"
            strokeWidth={40}
            strokeLinecap="round"
          />
          <path
            d={ROAD}
            fill="none"
            className="stroke-primary/85"
            strokeWidth={22}
            strokeLinecap="round"
          />
          <path
            d={ROAD}
            fill="none"
            stroke="white"
            strokeOpacity={0.85}
            strokeWidth={2}
            strokeDasharray="10 12"
          />
        </svg>
        <ol aria-label={mode === "city" ? "City hubs" : "The seven steps"}>
          {PILLARS.map((p, i) => {
            const [x, y] = STOPS[i] ?? [0, 0];
            return (
              <li
                key={p.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <MapHub
                  pillar={p}
                  mode={mode}
                  href={hubHref(mode, startupId, p.id)}
                  suggested={suggest(p.id)}
                  status={statusOf(p.id)}
                />
              </li>
            );
          })}
        </ol>
        <div className="absolute bottom-5 right-5">
          <PackTile mode={mode} startupId={startupId} />
        </div>
      </div>

      <ol
        aria-label={mode === "city" ? "City hubs" : "The seven steps"}
        className="relative space-y-3 lg:hidden"
      >
        <span
          aria-hidden
          className="absolute bottom-6 left-[23px] top-6 w-1 rounded-full bg-gradient-to-b from-primary/40 to-primary/10"
        />
        {PILLARS.map((p) => (
          <li key={p.id} className="relative">
            <RouteHub
              pillar={p}
              mode={mode}
              href={hubHref(mode, startupId, p.id)}
              suggested={suggest(p.id)}
              status={statusOf(p.id)}
            />
          </li>
        ))}
        <li className="relative flex items-center gap-3">
          <span className="z-10 grid size-12 shrink-0 place-items-center rounded-xl bg-foreground text-background shadow-md">
            <FounderPackIcon className="size-5" aria-hidden />
          </span>
          <PackTile mode={mode} startupId={startupId} className="flex-1" />
        </li>
      </ol>
    </div>
  );
}

function MapHub({
  pillar,
  mode,
  href,
  suggested,
  status,
}: {
  pillar: PillarInfo;
  mode: JourneyMode;
  href?: string;
  suggested: boolean;
  status: PillarStatus;
}) {
  const body = (
    <>
      <span className="whitespace-nowrap rounded-md bg-card/95 px-1.5 text-xs font-semibold text-foreground shadow-sm">
        {pillar.name}
      </span>
      <PillarTile
        id={pillar.id}
        number={pillar.number}
        className={cn(
          "transition-transform group-hover:scale-105",
          suggested && "ring-4 ring-primary/25",
        )}
      />
      {mode === "city" && <StatusBadge suggested={suggested} status={status} />}
    </>
  );
  const cls = "group flex flex-col items-center gap-1.5";
  return href ? (
    <Link
      href={href}
      className={cls}
      data-testid="city-hub"
      aria-label={`${pillar.number}. ${pillar.name}`}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function RouteHub({
  pillar,
  mode,
  href,
  suggested,
  status,
}: {
  pillar: PillarInfo;
  mode: JourneyMode;
  href?: string;
  suggested: boolean;
  status: PillarStatus;
}) {
  const body = (
    <>
      <PillarTile id={pillar.id} number={pillar.number} className="z-10" />
      <div
        className={cn(
          "flex flex-1 items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3 transition-colors",
          suggested ? "border-primary" : "border-border",
          href && "group-hover:border-primary/60",
        )}
      >
        <div>
          <p className="font-semibold">{pillar.name}</p>
          <p className="text-sm text-muted-foreground">{pillar.question}</p>
          {mode === "home" && (
            <p className="mt-1 text-xs font-medium text-primary">You get: {pillar.deliverable}</p>
          )}
        </div>
        {mode === "city" && <StatusBadge suggested={suggested} status={status} />}
      </div>
    </>
  );
  const cls = "group flex items-center gap-3";
  return href ? (
    <Link
      href={href}
      className={cls}
      data-testid="city-hub"
      aria-label={`${pillar.number}. ${pillar.name}`}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function StatusBadge({ suggested, status }: { suggested: boolean; status: PillarStatus }) {
  if (suggested) {
    return (
      <Badge variant="founder" className="gap-1 whitespace-nowrap">
        <Sparkles className="size-3" aria-hidden /> Start here
      </Badge>
    );
  }
  const info = PILLAR_STATUS_INFO[status];
  return (
    <Badge variant={info.badge} className="whitespace-nowrap" data-status={status}>
      {info.label}
    </Badge>
  );
}

function PackTile({
  mode,
  className,
  startupId,
}: {
  mode: JourneyMode;
  className?: string;
  startupId?: string;
}) {
  const body = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-foreground px-4 py-3 text-background shadow-lg",
        className,
      )}
    >
      <FounderPackIcon className="hidden size-5 lg:block" aria-hidden />
      <div>
        <p className="font-semibold">Founder Pack</p>
        <p className="text-xs opacity-80">
          {mode === "city"
            ? "Open the report: it grows as you work"
            : "Pitch, financial model, report, canvas, funding list"}
        </p>
      </div>
      {mode === "home" && <ArrowRight className="hidden size-4 opacity-70 lg:block" aria-hidden />}
    </div>
  );
  return mode === "city" && startupId ? (
    <Link href={`/startups/${startupId}/pack`} className={cn("block", className)}>
      {body}
    </Link>
  ) : (
    body
  );
}
