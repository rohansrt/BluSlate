import * as React from "react";
import { Check } from "lucide-react";
import type { ProgressState } from "@bluslate/contracts";
import { cn } from "../cn";

/**
 * How far a step is (decision 0012): a grey empty circle when no goals are
 * met, an amber half-filled circle when some are, and a green tick when all
 * are. Used by the step list, the Passport and the Pitch docs.
 */
export const PROGRESS_INFO: Record<ProgressState, { label: string; text: string }> = {
  empty: { label: "Not started", text: "text-muted-foreground" },
  partial: { label: "In progress", text: "text-review" },
  complete: { label: "Complete", text: "text-actual" },
};

export function ProgressIcon({
  state,
  className,
  title,
}: {
  state: ProgressState;
  className?: string;
  title?: string;
}) {
  const label = title ?? PROGRESS_INFO[state].label;
  if (state === "complete") {
    return (
      <span
        className={cn(
          "inline-grid size-4 shrink-0 place-items-center rounded-full bg-actual text-white",
          className,
        )}
        title={label}
        data-progress={state}
      >
        <Check className="size-3" strokeWidth={3} aria-hidden />
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  if (state === "partial") {
    return (
      <span
        className={cn(
          "inline-block size-4 shrink-0 rounded-full border-2 border-review",
          "bg-[linear-gradient(90deg,var(--review)_50%,transparent_50%)]",
          className,
        )}
        title={label}
        data-progress={state}
      >
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-block size-4 shrink-0 rounded-full border-2 border-muted-foreground/40",
        className,
      )}
      title={label}
      data-progress={state}
    >
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * A Passport stamp for one step: a rotated dashed ring, inked green once the
 * step is complete, amber while it's in progress, and a faint grey outline
 * before it's started.
 */
export function PassportStamp({
  number,
  label,
  state,
  size = "md",
  className,
}: {
  number: number;
  label: string;
  state: ProgressState;
  size?: "sm" | "md";
  className?: string;
}) {
  const small = size === "sm";
  const ink =
    state === "complete"
      ? "border-actual text-actual bg-actual-soft"
      : state === "partial"
        ? "border-review text-review bg-review-soft/60"
        : "border-muted-foreground/30 text-muted-foreground/70";
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full border-dashed text-center",
        small ? "size-6 border-[1.5px]" : "size-20 border-[2.5px] p-1.5",
        state === "complete" && "-rotate-[8deg]",
        ink,
        className,
      )}
      data-stamp={state}
    >
      {small ? (
        state === "complete" ? (
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        ) : (
          <span className="text-[10px] font-bold leading-none">{number}</span>
        )
      ) : (
        <span className="block leading-tight">
          <span className="block text-[9px] font-bold uppercase tracking-[0.14em] opacity-80">
            {state === "complete"
              ? "Stamped"
              : state === "partial"
                ? "In progress"
                : `Step ${number}`}
          </span>
          <span className="mt-0.5 block text-[10px] font-extrabold uppercase leading-[1.1]">
            {label}
          </span>
          {state === "complete" && (
            <Check className="mx-auto mt-0.5 size-3.5" strokeWidth={3} aria-hidden />
          )}
        </span>
      )}
    </span>
  );
}
