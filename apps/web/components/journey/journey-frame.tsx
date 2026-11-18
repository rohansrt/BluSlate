"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookMarked, SkipForward, X } from "lucide-react";
import type { GoalProgress, ProgressState } from "@bluslate/contracts";
import {
  FounderPackIcon,
  PROGRESS_INFO,
  PassportStamp,
  PillarIcon,
  ProgressIcon,
  cn,
} from "@bluslate/ui";
import { PILLARS, type PillarId } from "@/lib/pillars";

/**
 * The frame around every step of a startup (decision 0012): the list of all
 * seven steps plus Pitch docs on the left, a Passport with one stamp per step
 * at the top right, and Back / Skip / Next at the bottom. Progress comes from
 * each step's goals: grey empty circle (none met), amber (some), green tick
 * (all). The step being worked on updates live as goals are met.
 */

export type JourneyStepId = PillarId | "docs";

export interface DocsProgress {
  generated: number;
  total: number;
}

interface JourneyValue {
  startupId: string;
  active: JourneyStepId;
  progress: Record<PillarId, GoalProgress>;
  docs: DocsProgress;
  setLive: (pillar: PillarId, p: GoalProgress) => void;
}

const JourneyContext = createContext<JourneyValue | null>(null);

function useJourney(): JourneyValue {
  const v = useContext(JourneyContext);
  if (!v) throw new Error("Journey components must be inside <JourneyProvider>");
  return v;
}

export function JourneyProvider({
  startupId,
  active,
  progress: initial,
  docs,
  children,
}: {
  startupId: string;
  active: JourneyStepId;
  progress: Record<PillarId, GoalProgress>;
  docs: DocsProgress;
  children: React.ReactNode;
}) {
  const [progress, setProgress] = useState(initial);
  const value = useMemo<JourneyValue>(
    () => ({
      startupId,
      active,
      progress,
      docs,
      setLive: (pillar, p) =>
        setProgress((cur) =>
          cur[pillar].met === p.met && cur[pillar].total === p.total
            ? cur
            : { ...cur, [pillar]: p },
        ),
    }),
    [startupId, active, progress, docs],
  );
  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

/** Lets the workbench report the active step's live goals. */
export function LiveProgress({ pillar, progress }: { pillar: PillarId; progress: GoalProgress }) {
  const { setLive } = useJourney();
  useEffect(() => setLive(pillar, progress), [pillar, progress, setLive]);
  return null;
}

function docsState(d: DocsProgress): ProgressState {
  return d.generated === 0 ? "empty" : d.generated >= d.total ? "complete" : "partial";
}

const stepHref = (startupId: string, id: JourneyStepId) =>
  id === "docs" ? `/startups/${startupId}/pack` : `/startups/${startupId}/${id}`;

// ─── Left: every step, always visible ───────────────────────────────────────

export function StepRail() {
  const { startupId, active, progress, docs } = useJourney();
  return (
    <nav aria-label="Your steps" className="min-w-0" data-testid="step-rail">
      <p className="mb-2 hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">
        Your steps
      </p>
      <ol className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
        {PILLARS.map((p) => {
          const pr = progress[p.id];
          return (
            <RailItem
              key={p.id}
              href={stepHref(startupId, p.id)}
              current={active === p.id}
              state={pr.state}
              icon={<PillarIcon id={p.id} className="size-4 shrink-0" />}
              label={`${p.number} ${p.name}`}
              count={`${pr.met}/${pr.total}`}
              testId={`rail-${p.id}`}
            />
          );
        })}
        <li aria-hidden className="hidden lg:my-1 lg:block lg:border-t lg:border-border" />
        <RailItem
          href={stepHref(startupId, "docs")}
          current={active === "docs"}
          state={docsState(docs)}
          icon={<FounderPackIcon className="size-4 shrink-0" aria-hidden />}
          label="8 Pitch docs"
          count={`${docs.generated}/${docs.total}`}
          testId="rail-docs"
        />
      </ol>
    </nav>
  );
}

function RailItem({
  href,
  current,
  state,
  icon,
  label,
  count,
  testId,
}: {
  href: string;
  current: boolean;
  state: ProgressState;
  icon: React.ReactNode;
  label: string;
  count: string;
  testId: string;
}) {
  return (
    <li className="shrink-0">
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        data-testid={testId}
        data-progress={state}
        className={cn(
          "relative flex items-center gap-2 whitespace-nowrap rounded-lg border px-2.5 py-2 text-sm transition-colors lg:border-transparent",
          current
            ? "border-primary bg-founder-soft font-semibold text-primary lg:border-primary/40"
            : "border-border bg-card hover:bg-accent lg:bg-transparent",
        )}
      >
        <ProgressIcon state={state} />
        {icon}
        <span className="lg:min-w-0 lg:truncate" title={label}>
          {label}
        </span>
        <span
          className={cn(
            "ml-auto shrink-0 pl-1 text-[11px] tabular-nums",
            PROGRESS_INFO[state].text,
          )}
          aria-label={`${count} ${PROGRESS_INFO[state].label}`}
        >
          {count}
        </span>
      </Link>
    </li>
  );
}

// ─── Top right: the Passport ────────────────────────────────────────────────

export function PassportWidget() {
  const { startupId, active, progress } = useJourney();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const stamped = PILLARS.filter((p) => progress[p.id].state === "complete").length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative" data-testid="passport">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:bg-accent"
      >
        <BookMarked className="size-4 text-primary" aria-hidden />
        <span className="font-semibold">Passport</span>
        <span className="hidden items-center gap-0.5 sm:flex" aria-hidden>
          {PILLARS.map((p) => (
            <PassportStamp
              key={p.id}
              number={p.number}
              label={p.name}
              state={progress[p.id].state}
              size="sm"
              className="size-5"
            />
          ))}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground" data-testid="passport-count">
          {stamped}/7
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Startup Passport"
          className="absolute right-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Startup Passport
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {stamped === 7
                  ? "All seven stamps. Your pitch docs are ready to make."
                  : `${stamped} of 7 stamped. A step is stamped when all its goals are complete.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent"
              aria-label="Close the Passport"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <ul className="mt-4 grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-4">
            {PILLARS.map((p) => {
              const pr = progress[p.id];
              return (
                <li key={p.id} className="flex justify-center">
                  <Link
                    href={stepHref(startupId, p.id)}
                    onClick={() => setOpen(false)}
                    aria-current={active === p.id ? "page" : undefined}
                    data-testid={`stamp-${p.id}`}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl p-1 transition-transform hover:scale-105",
                      active === p.id && "ring-2 ring-primary/40",
                    )}
                    title={`${p.name}: ${pr.met} of ${pr.total} goals complete`}
                  >
                    <PassportStamp number={p.number} label={p.name} state={pr.state} />
                    <span className={cn("text-[11px] tabular-nums", PROGRESS_INFO[pr.state].text)}>
                      {pr.met}/{pr.total}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ProgressIcon state="complete" className="size-3" /> all goals
            </span>
            <span className="inline-flex items-center gap-1">
              <ProgressIcon state="partial" className="size-3" /> some goals
            </span>
            <span className="inline-flex items-center gap-1">
              <ProgressIcon state="empty" className="size-3" /> not started
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Moving between steps ───────────────────────────────────────────────────

const ORDER: JourneyStepId[] = [...PILLARS.map((p) => p.id), "docs"];

function neighbours(active: JourneyStepId) {
  const i = ORDER.indexOf(active);
  return { prev: i > 0 ? ORDER[i - 1] : null, next: i < ORDER.length - 1 ? ORDER[i + 1] : null };
}

function stepName(id: JourneyStepId) {
  return id === "docs" ? "Pitch docs" : (PILLARS.find((p) => p.id === id)?.name ?? id);
}

/** "Skip this step" in the header: always there, nothing is lost. */
export function SkipLink() {
  const { startupId, active } = useJourney();
  const { next } = neighbours(active);
  if (!next) return null;
  return (
    <Link
      href={stepHref(startupId, next)}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
      data-testid="skip-step"
      title={`Skip to ${stepName(next)}. Your answers here are kept.`}
    >
      Skip this step <SkipForward className="size-4" aria-hidden />
    </Link>
  );
}

/** Back and Skip / Next at the end of a step. */
export function StepNav() {
  const { startupId, active, progress } = useJourney();
  const { prev, next } = neighbours(active);
  const complete = active !== "docs" && progress[active].state === "complete";
  return (
    <nav
      aria-label="Move between steps"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
    >
      {prev ? (
        <Link
          href={stepHref(startupId, prev)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> {stepName(prev)}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link
          href={stepHref(startupId, next)}
          data-testid="next-step"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            complete
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "border border-border bg-card hover:bg-accent",
          )}
        >
          {complete ? "Next" : "Skip"}: {stepName(next)}{" "}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </nav>
  );
}
