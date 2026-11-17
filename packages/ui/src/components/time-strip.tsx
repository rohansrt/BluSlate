import * as React from "react";
import { AlertTriangle, FastForward, Pause, Play } from "lucide-react";
import type { EvidenceLabel } from "@bluslate/contracts";
import { cn } from "../cn";
import { EvidenceBadge } from "./evidence-badge";

export interface TimeStripFigure {
  name: string;
  /** Already formatted by the caller from engine output; the strip never computes numbers. */
  value: string;
  label: EvidenceLabel;
  danger?: boolean;
}

/**
 * The bottom time strip (spec §5.6, §6.1): simulated date, play controls and
 * the key figures. Shown whenever a scenario exists.
 */
export function TimeStrip({
  day,
  month,
  date,
  playing,
  figures,
  alerts = 0,
  onPause,
  onPlay,
  onFastForward,
  className,
}: {
  day: number;
  month: number;
  date: string;
  playing: boolean;
  figures: TimeStripFigure[];
  alerts?: number;
  onPause?: () => void;
  onPlay?: () => void;
  onFastForward?: () => void;
  className?: string;
}) {
  const ctrl = "grid size-8 place-items-center rounded-lg hover:bg-accent disabled:opacity-40";
  return (
    <div
      role="region"
      aria-label="Simulation clock"
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border bg-card/95 px-4 py-2.5 text-sm backdrop-blur",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={ctrl}
          aria-label="Pause"
          aria-pressed={!playing}
          onClick={onPause}
          disabled={!onPause}
        >
          <Pause className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className={ctrl}
          aria-label="Play"
          aria-pressed={playing}
          onClick={onPlay}
          disabled={!onPlay}
        >
          <Play className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className={ctrl}
          aria-label="Skip to next month"
          onClick={onFastForward}
          disabled={!onFastForward}
        >
          <FastForward className="size-4" aria-hidden />
        </button>
      </div>
      <p className="font-semibold tabular-nums">
        Day {day} · Month {month} ·{" "}
        <span className="font-normal text-muted-foreground">{date}</span>
      </p>
      <dl className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {figures.map((f) => (
          <div key={f.name} className="flex items-center gap-1.5">
            <dt className="text-muted-foreground">{f.name}</dt>
            <dd className={cn("font-semibold tabular-nums", f.danger && "text-danger")}>
              {f.value}
            </dd>
            <EvidenceBadge label={f.label} className="scale-90" />
          </div>
        ))}
      </dl>
      {alerts > 0 && (
        <p className="ml-auto flex items-center gap-1.5 font-medium text-review">
          <AlertTriangle className="size-4" aria-hidden /> {alerts}{" "}
          {alerts === 1 ? "alert" : "alerts"}
        </p>
      )}
    </div>
  );
}
