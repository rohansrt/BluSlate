import { Package, Sparkles } from "lucide-react";
import { Badge, cn } from "@bluslate/ui";
import { PILLARS, type PillarId } from "@/lib/pillars";

/**
 * The city (spec §6.2): a 2D map with seven hubs, each showing its status, plus
 * a Founder Pack tile. Navigation only; it must load fast and never block work.
 * In S1 every hub is "Not started"; S2 makes them open their pillar.
 */

// Hub positions along the road, as percentages of the map (x, y).
const STOPS: [number, number][] = [
  [8, 80],
  [22, 70],
  [36, 60],
  [50, 52],
  [63, 42],
  [76, 32],
  [88, 22],
];

// The road through the hubs, in the SVG's 1000 × 420 space (x% × 10, y% × 4.2).
const ROAD =
  "M 0 380 Q 40 350 80 336 T 220 294 T 360 252 T 500 218 T 630 176 T 760 134 T 880 92 T 1000 40";

export function CityMap({ highlight }: { highlight: PillarId | null }) {
  return (
    <div>
      {/* Wide screens: the road map. */}
      <div className="relative hidden aspect-[1000/420] overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-founder-soft/60 to-card lg:block">
        <svg viewBox="0 0 1000 420" className="absolute inset-0 size-full" aria-hidden>
          {[
            [90, 210, 48, 110],
            [150, 180, 44, 140],
            [330, 150, 52, 120],
            [520, 90, 46, 150],
            [580, 120, 40, 90],
            [820, 200, 54, 130],
          ].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx={8} className="fill-primary/[0.07]" />
          ))}
          <path
            d={ROAD}
            fill="none"
            className="stroke-primary/80"
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
        <ol aria-label="City hubs">
          {PILLARS.map((p, i) => {
            const [x, y] = STOPS[i] ?? [0, 0];
            return (
              <li
                key={p.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <Hub number={p.number} name={p.name} suggested={highlight === p.id} />
              </li>
            );
          })}
        </ol>
        <div className="absolute bottom-5 right-5">
          <PackTile />
        </div>
      </div>

      {/* Narrow screens: the same hubs as a vertical route. */}
      <ol aria-label="City hubs" className="relative space-y-3 lg:hidden">
        <span
          aria-hidden
          className="absolute bottom-4 left-[19px] top-4 w-1 rounded-full bg-primary/25"
        />
        {PILLARS.map((p) => (
          <li key={p.id} className="relative flex items-center gap-3">
            <span className="z-10 grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-sm font-bold text-primary shadow-sm">
              {p.number}
            </span>
            <div
              className={cn(
                "flex flex-1 items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3",
                highlight === p.id ? "border-primary" : "border-border",
              )}
            >
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.question}</p>
              </div>
              <StatusBadge suggested={highlight === p.id} />
            </div>
          </li>
        ))}
        <li className="relative flex items-center gap-3">
          <span className="z-10 grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Package className="size-5" aria-hidden />
          </span>
          <PackTile className="flex-1" />
        </li>
      </ol>
    </div>
  );
}

function Hub({ number, name, suggested }: { number: number; name: string; suggested: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5" data-testid="city-hub">
      <span className="whitespace-nowrap rounded-md bg-card/90 px-1.5 text-xs font-semibold text-foreground">
        {name}
      </span>
      <span
        className={cn(
          "grid size-12 place-items-center rounded-xl border bg-card text-lg font-bold text-primary shadow-md",
          suggested ? "border-primary ring-4 ring-primary/20" : "border-border",
        )}
      >
        {number}
      </span>
      <StatusBadge suggested={suggested} />
    </div>
  );
}

function StatusBadge({ suggested }: { suggested: boolean }) {
  return suggested ? (
    <Badge variant="founder" className="gap-1 whitespace-nowrap">
      <Sparkles className="size-3" aria-hidden /> Start here
    </Badge>
  ) : (
    <Badge variant="neutral" className="whitespace-nowrap">
      Not started
    </Badge>
  );
}

function PackTile({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-md", className)}
    >
      <p className="font-semibold">Founder Pack</p>
      <p className="text-xs opacity-85">Grows as you work through the steps</p>
    </div>
  );
}
