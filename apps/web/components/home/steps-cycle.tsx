"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Play, RefreshCw } from "lucide-react";
import { Button, FounderPackIcon, Slate, cn } from "@bluslate/ui";
import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { PILLARS, type PillarId } from "@/lib/pillars";
import { STEP_BRIEFS } from "@/lib/step-briefs";
import { presetOnboarding } from "@/lib/onboarding-store";
import { track } from "@/lib/analytics/client";

/**
 * The seven steps as a loop of blue slates, with a way out after step 7:
 * Pitch, where the reports become the Founder Pack and (soon) investors are
 * suggested (docs/decisions/0011). The centre Start button and each card's
 * "Try this pillar" open the onboarding card beside the circle on Home; on
 * About ("Product Overview") they link to Home.
 */

const COUNT = PILLARS.length;
const STOPS = COUNT + 1; // the seven pillars, then Pitch
const PITCH = COUNT;
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

export interface StepsCycleProps {
  /** "home" opens the onboarding card beside the circle; "overview" (About) links to Home. */
  mode?: "home" | "overview";
  signedIn?: boolean;
  knownName?: string | null;
  /** The founder's most recent startup: "Try this pillar" opens that pillar in it. */
  latestStartupId?: string | null;
  /** From Home's URL (?start=1 or ?try=<pillar>), e.g. when coming from About. */
  initialAction?: { start: true } | { tryPillar: PillarId } | null;
}

export function StepsCycle({
  mode = "home",
  signedIn = false,
  knownName = null,
  latestStartupId = null,
  initialAction = null,
}: StepsCycleProps) {
  const [index, setIndex] = useState(() =>
    initialAction && "tryPillar" in initialAction
      ? Math.max(
          0,
          PILLARS.findIndex((p) => p.id === initialAction.tryPillar),
        )
      : 0,
  );
  const [panel, setPanel] = useState<"brief" | "start">("brief");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const isPitch = index === PITCH;
  const active = PILLARS[Math.min(index, COUNT - 1)] ?? PILLARS[0]!;
  const home = mode === "home";

  const select = (i: number, focus = false) => {
    const next = (i + STOPS) % STOPS;
    setIndex(next);
    setPanel("brief");
    track("circle_view", { stop: next === PITCH ? "pitch" : (PILLARS[next]?.id ?? "") });
    if (focus) tabs.current[next]?.focus();
  };

  /** Open the onboarding card beside the circle (Home only). */
  const startJourney = (tool?: PillarId) => {
    presetOnboarding({ signedIn, knownName, tool });
    setPanel("start");
  };

  // On phones the card opens below the circle: bring it into view.
  useEffect(() => {
    if (panel !== "start") return;
    const el = document.getElementById("journey-start");
    if (!el) return;
    const { top, bottom } = el.getBoundingClientRect();
    if (top < 0 || bottom > window.innerHeight)
      el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [panel]);

  // Arriving from About with ?start=1 or ?try=<pillar>.
  const acted = useRef(false);
  useEffect(() => {
    if (!home || !initialAction || acted.current) return;
    acted.current = true;
    presetOnboarding({
      signedIn,
      knownName,
      tool: "tryPillar" in initialAction ? initialAction.tryPillar : undefined,
    });
    setPanel("start");
  }, [home, initialAction, signedIn, knownName]);

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
      select(STOPS - 1, true);
    }
  };

  const pitchSelected = index === PITCH;

  return (
    <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:gap-12">
      <div className="mx-auto w-full max-w-[22rem] sm:max-w-[30rem]">
        <div className="relative aspect-square w-full">
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

          {/* Centre: start the journey. */}
          <div className="absolute inset-[30%] flex flex-col items-center justify-center rounded-full text-center">
            {home ? (
              <button
                type="button"
                onClick={() => {
                  track("circle_start", { mode });
                  startJourney();
                }}
                className="group flex flex-col items-center rounded-full p-2 outline-offset-4"
                data-testid="circle-start"
              >
                <Slate name="rocket" size="sm" className="group-hover:-translate-y-0.5" />
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground shadow-sm group-hover:bg-primary/90">
                  <Play className="size-3.5" aria-hidden /> Start
                </span>
              </button>
            ) : (
              <Link
                href="/?start=1#journey"
                onClick={() => track("circle_start", { mode })}
                className="group flex flex-col items-center rounded-full p-2 outline-offset-4"
                data-testid="circle-start"
              >
                <Slate name="rocket" size="sm" />
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground shadow-sm">
                  <Play className="size-3.5" aria-hidden /> Start
                </span>
              </Link>
            )}
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <RefreshCw className="size-3" aria-hidden /> learn, change, repeat
            </p>
          </div>

          <div
            role="tablist"
            aria-label="The seven steps, then Pitch"
            aria-orientation="horizontal"
            // The Pitch tab sits below the circle but belongs to this list.
            aria-owns="step-tab-pitch"
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

        {/* The way out of the loop after step 7. */}
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">After step 7</span>
          <span aria-hidden className="h-px w-8 border-t border-dashed border-primary/60" />
          <button
            ref={(el) => {
              tabs.current[PITCH] = el;
            }}
            type="button"
            role="tab"
            id="step-tab-pitch"
            aria-selected={pitchSelected}
            aria-label="Then: Pitch"
            aria-controls="step-brief"
            tabIndex={pitchSelected ? 0 : -1}
            onClick={() => select(PITCH)}
            onKeyDown={onKeyDown}
            className={cn(
              "group flex items-center rounded-2xl p-1 pr-3 outline-offset-4",
              // The selected slate grows and gets a ring, so its label moves clear of it.
              pitchSelected ? "gap-4" : "gap-2",
            )}
          >
            <Slate name="pack" size="sm" selected={pitchSelected} />
            <span
              className={cn(
                "text-sm font-semibold",
                pitchSelected ? "text-primary" : "text-foreground/80",
              )}
            >
              Pitch
            </span>
          </button>
        </div>
      </div>

      {panel === "start" && home ? (
        <div id="journey-start" className="scroll-mt-24">
          <OnboardingCard
            signedIn={signedIn}
            knownName={knownName}
            placement="circle"
            className="rounded-3xl"
          />
          <button
            type="button"
            onClick={() => setPanel("brief")}
            className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back to the steps
          </button>
        </div>
      ) : (
        <div
          id="step-brief"
          role="tabpanel"
          aria-labelledby={isPitch ? "step-tab-pitch" : `step-tab-${active.id}`}
          aria-live="polite"
          className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7"
          data-testid="step-brief"
        >
          {isPitch ? (
            <PitchBrief />
          ) : (
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
          )}

          <div className="mt-5">
            <TryButton
              home={home}
              isPitch={isPitch}
              pillar={active.id}
              latestStartupId={latestStartupId}
              onStart={startJourney}
            />
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
      )}
    </div>
  );
}

/** "Try this pillar" (or, on Pitch, the Founder Pack / Start). */
function TryButton({
  home,
  isPitch,
  pillar,
  latestStartupId,
  onStart,
}: {
  home: boolean;
  isPitch: boolean;
  pillar: PillarId;
  latestStartupId: string | null;
  onStart: (tool?: PillarId) => void;
}) {
  if (isPitch) {
    if (latestStartupId)
      return (
        <Button asChild className="w-full">
          <Link
            href={`/startups/${latestStartupId}/pack`}
            onClick={() => track("circle_try", { stop: "pitch" })}
          >
            Open your Founder Pack <ArrowRight aria-hidden />
          </Link>
        </Button>
      );
    return home ? (
      <Button
        className="w-full"
        onClick={() => {
          track("circle_try", { stop: "pitch" });
          onStart();
        }}
      >
        Start your journey <ArrowRight aria-hidden />
      </Button>
    ) : (
      <Button asChild className="w-full">
        <Link href="/?start=1#journey" onClick={() => track("circle_try", { stop: "pitch" })}>
          Start your journey <ArrowRight aria-hidden />
        </Link>
      </Button>
    );
  }
  // Founders with a startup open this pillar in it; everyone else starts with it as the one tool.
  if (latestStartupId)
    return (
      <Button asChild className="w-full">
        <Link
          href={`/startups/${latestStartupId}/${pillar}`}
          onClick={() => track("circle_try", { stop: pillar })}
        >
          Try this pillar <ArrowRight aria-hidden />
        </Link>
      </Button>
    );
  return home ? (
    <Button
      className="w-full"
      onClick={() => {
        track("circle_try", { stop: pillar });
        onStart(pillar);
      }}
    >
      Try this pillar <ArrowRight aria-hidden />
    </Button>
  ) : (
    <Button asChild className="w-full">
      <Link href={`/?try=${pillar}#journey`} onClick={() => track("circle_try", { stop: pillar })}>
        Try this pillar <ArrowRight aria-hidden />
      </Link>
    </Button>
  );
}

/** The way out of the loop: reports, the Founder Pack, and (soon) investors. */
function PitchBrief() {
  return (
    <div className="animate-[brief-in_300ms_ease-out]">
      <div className="flex items-center gap-4">
        <Slate name="pack" size="lg" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            After step 7
          </p>
          <h3 className="text-2xl font-bold tracking-tight">Pitch</h3>
        </div>
      </div>
      <p className="mt-5 text-lg font-semibold leading-snug">Ready to show the world?</p>
      <p className="mt-2 text-muted-foreground">
        Step out of the loop with your Founder Pack: every step&apos;s report in one place, ready to
        print or share.
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        <li className="rounded-xl bg-founder-soft px-3 py-2 font-medium text-primary">
          You get: the Founder Pack report
        </li>
        <li className="flex items-start gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-muted-foreground">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold text-foreground">Coming soon:</span> investors and
            incubators to reach out to, matched to your startup: 10 in your country and up to 5
            global, with their public website, LinkedIn and contact details.
          </span>
        </li>
      </ul>
    </div>
  );
}
