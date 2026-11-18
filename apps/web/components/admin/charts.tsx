import { cn } from "@bluslate/ui";
import type { FunnelStage, Row } from "@/lib/admin-analytics";

/**
 * Small, single-series charts for the admin dashboard (docs/decisions/0011).
 * One hue (the brand primary) for magnitude; values and labels in text ink;
 * every bar shows its number, and hovering shows the exact value, so the
 * numbers never depend on colour alone.
 */

const num = new Intl.NumberFormat("en-IN");

/** Horizontal bars: one row per label, longest first. */
export function BarList({
  rows,
  empty = "No data yet.",
  limit = 8,
  unit,
}: {
  rows: Row[];
  empty?: string;
  limit?: number;
  /** e.g. "visitors", shown in the hover text. */
  unit?: string;
}) {
  const shown = rows.slice(0, limit);
  const max = Math.max(1, ...shown.map((r) => r.value));
  if (shown.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      {shown.map((r) => (
        <li
          key={r.label}
          className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md px-1 py-1 hover:bg-accent"
          title={`${r.label}: ${num.format(r.value)}${unit ? ` ${unit}` : ""}`}
        >
          <div className="relative min-w-0">
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-r bg-primary/20 group-hover:bg-primary/30"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
            <span className="relative block truncate px-2 py-0.5 text-sm">{r.label}</span>
          </div>
          <span className="text-sm font-semibold tabular-nums">{num.format(r.value)}</span>
        </li>
      ))}
      {rows.length > limit && (
        <li className="px-1 text-xs text-muted-foreground">
          +{rows.length - limit} more,{" "}
          {num.format(rows.slice(limit).reduce((a, r) => a + r.value, 0))} in all
        </li>
      )}
    </ul>
  );
}

/** A funnel: each stage's visitors, its share of the first stage, and the drop from the previous one. */
export function FunnelChart({ stages, testId }: { stages: FunnelStage[]; testId?: string }) {
  const max = Math.max(1, stages[0]?.value ?? 0);
  return (
    <ol className="space-y-2" data-testid={testId}>
      {stages.map((s, i) => (
        <li
          key={s.label}
          className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3"
          title={`${s.label}: ${num.format(s.value)} visitors (${s.ofStart}% of the first step)`}
        >
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium">{s.label}</span>
              {s.dropFromPrev != null && s.dropFromPrev > 0 && (
                <span
                  className={cn(
                    "shrink-0 text-xs tabular-nums",
                    s.dropFromPrev >= 50 ? "font-semibold text-danger" : "text-muted-foreground",
                  )}
                >
                  −{s.dropFromPrev}% dropped
                </span>
              )}
            </div>
            <div className="mt-1 h-2.5 rounded-full bg-muted" aria-hidden>
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(s.value / max) * 100}%` }}
              />
            </div>
          </div>
          <span className="w-20 text-right text-sm tabular-nums">
            <span className="font-semibold">{num.format(s.value)}</span>{" "}
            <span className="text-muted-foreground">{s.ofStart}%</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Visitors per day: vertical bars with the exact count on hover. */
export function DailyBars({ rows }: { rows: Row[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const fmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
  const every = rows.length > 31 ? 14 : rows.length > 7 ? 7 : 1;
  return (
    <div>
      <div className="flex h-36 items-end gap-[2px]" role="img" aria-label="Visitors per day">
        {rows.map((r) => (
          <div
            key={r.label}
            className="group relative flex h-full flex-1 items-end"
            title={`${fmt.format(new Date(r.label))}: ${num.format(r.value)} visitors`}
          >
            <div
              className="w-full rounded-t-[4px] bg-primary/70 group-hover:bg-primary"
              style={{ height: `${Math.max(r.value ? 3 : 0, (r.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[2px] text-[10px] text-muted-foreground">
        {rows.map((r, i) => (
          <span key={r.label} className="flex-1 overflow-visible whitespace-nowrap">
            {i % every === 0 ? fmt.format(new Date(r.label)) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
