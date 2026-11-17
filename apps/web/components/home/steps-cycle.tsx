"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { Button, FounderPackIcon, Slate, cn } from "@bluslate/ui";
import { PILLARS } from "@/lib/pillars";
import { STEP_BRIEFS } from "@/lib/step-briefs";

/**
 * The seven steps as a loop of blue slates. Choosing a slate shows its short
 * brief. Run & Grow leads back to Discover, because what you learn after
 * launch flows back into the earlier steps.
 */

const COUNT = PILLARS.length;
const RADIUS = 38; // % of the square
const GAP_DEG = 15; // keep arrows clear of the slates

function point(angleDeg: number, r = RADIUS) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
}

const angleFor = (i: number) => -90 + (360 / COUNT) * i;

/** Arc segments between neighbouring slates, clockwise. */
const ARCS = PILLARS.map((_, i) => {
  const from = point(angleFor(i) + GAP_DEG);
  const to = point(angleFor(i + 1) - GAP_DEG);
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 0 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
});

export function StepsCycle() {
  const [index, setIndex] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = PILLARS[index] ?? PILLARS[0]!;

  const select = (i: number, focus = false) => {
    const next = (i + COUNT) % COUNT;
    setIndex(next);
    if (focus) tabs.current[next]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    if (e.key in keys) {
      e.preventDefault();
      select(index + (keys[e.key] ?? 0), true);
    } else if (e.key === "Home") {
      e.preventDefault();
      select(0, true);
    } else if (e.key === "End") {
      e.preventDefault();
      select(COUNT - 1, true);
    }
  };

  return (
    <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:gap-12">
      <div className="relative mx-auto aspect-square w-full max-w-[22rem] sm:max-w-[30rem]">
        {/* Soft glow and the loop of arrows. */}
        <div
          aria-hidden
          className="absolute inset-[14%] rounded-full bg-[radial-gradient(circle,var(--founder-soft)_0%,transparent_70%)]"
        />
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 size-full overflow-visible"
          aria-hidden
        >
          <defs>
            <marker
              id="cycle-arrow"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0 0 L10 5 L0 10 z" className="fill-primary/60" />
            </marker>
          </defs>
          {ARCS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              className={cn("stroke-primary/40", i === COUNT - 1 && "stroke-primary/70")}
              strokeWidth={0.7}
              strokeDasharray={i === COUNT - 1 ? "1.6 1.4" : undefined}
              markerEnd="url(#cycle-arrow)"
            />
          ))}
        </svg>

        {/* Centre: the idea everything revolves around. */}
        <div className="absolute inset-[30%] flex flex-col items-center justify-center rounded-full text-center">
          <Slate name="rocket" size="sm" className="opacity-95" />
          <p className="mt-2 text-sm font-bold leading-tight">Your idea</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <RefreshCw className="size-3" aria-hidden /> learn, change, repeat
          </p>
        </div>

        <div
          role="tablist"
          aria-label="The seven steps"
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
        >
          {PILLARS.map((p, i) => {
            const { x, y } = point(angleFor(i));
            const selected = i === index;
            return (
              <button
                key={p.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`step-tab-${p.id}`}
                aria-selected={selected}
                aria-label={`Step ${p.number}: ${p.name}`}
                aria-controls="step-brief"
                tabIndex={selected ? 0 : -1}
                onClick={() => select(i)}
                className="group absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-2xl p-1 outline-offset-4 sm:w-28"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <Slate
                  name={p.id}
                  number={p.number}
                  size="md"
                  selected={selected}
                  className="max-sm:size-14 group-hover:-translate-y-0.5"
                />
                <span
                  className={cn(
                    "text-xs font-semibold leading-tight transition-[margin] sm:text-sm",
                    // The selected slate grows and gets a ring, so its label moves clear of it.
                    selected ? "mt-2.5 text-primary" : "text-foreground/80",
                  )}
                >
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="step-brief"
        role="tabpanel"
        aria-labelledby={`step-tab-${active.id}`}
        aria-live="polite"
        className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7"
        data-testid="step-brief"
      >
        <div key={active.id} className="animate-[brief-in_300ms_ease-out]">
          <div className="flex items-center gap-4">
            <Slate name={active.id} size="lg" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Step {active.number} of {COUNT}
              </p>
              <h3 className="text-2xl font-bold tracking-tight">{active.name}</h3>
            </div>
          </div>
          <p className="mt-5 text-lg font-semibold leading-snug">{active.question}</p>
          <p className="mt-2 text-muted-foreground">{STEP_BRIEFS[active.id]}</p>
          <p className="mt-4 inline-flex rounded-full bg-founder-soft px-3 py-1 text-sm font-medium text-primary">
            You get: {active.deliverable}
          </p>
        </div>
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FounderPackIcon className="size-3.5" aria-hidden /> All seven feed your Founder Pack
          </p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => select(index - 1)}
              aria-label="Previous step"
            >
              <ArrowLeft aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => select(index + 1)}
              aria-label="Next step"
            >
              <ArrowRight aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
