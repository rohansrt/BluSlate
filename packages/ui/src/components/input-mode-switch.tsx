"use client";

import * as React from "react";
import { Compass, PenLine, Search } from "lucide-react";
import { cn } from "../cn";

/** The three ways to answer any question (spec §5.3). */
export type InputMode = "decide" | "guide" | "research";

export const INPUT_MODES: { id: InputMode; label: string; hint: string; icon: typeof PenLine }[] = [
  { id: "decide", label: "I'll decide", hint: "Type it yourself", icon: PenLine },
  { id: "guide", label: "Guide me", hint: "Explain it, ask me questions", icon: Compass },
  { id: "research", label: "Research & suggest", hint: "Options with sources", icon: Search },
];

export function InputModeSwitch({
  value,
  onChange,
  unavailable = {},
  className,
}: {
  value: InputMode;
  onChange: (mode: InputMode) => void;
  /** Modes that can't be used right now, with the reason shown beside them. */
  unavailable?: Partial<Record<InputMode, string>>;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="How do you want to answer?"
      className={cn("grid gap-2 sm:grid-cols-3", className)}
    >
      {INPUT_MODES.map(({ id, label, hint, icon: Icon }) => {
        const selected = value === id;
        const reason = unavailable[id];
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={reason ? true : undefined}
            title={reason}
            onClick={() => !reason && onChange(id)}
            className={cn(
              "flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors",
              selected ? "border-primary bg-founder-soft" : "border-border bg-card hover:bg-accent",
              reason && "cursor-not-allowed opacity-60 hover:bg-card",
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 size-4 shrink-0",
                selected ? "text-primary" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <span>
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block text-xs text-muted-foreground">{reason ?? hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
