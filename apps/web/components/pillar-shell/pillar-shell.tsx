import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { GoalProgress } from "@bluslate/contracts";
import { FounderPackIcon, PillarIcon } from "@bluslate/ui";
import {
  JourneyProvider,
  PassportWidget,
  SkipLink,
  StepRail,
  type DocsProgress,
  type JourneyStepId,
} from "@/components/journey/journey-frame";
import { GuestNotice } from "@/components/guest-notice";
import { pillarInfo, type PillarId } from "@/lib/pillars";

/**
 * The standard layout for a startup (spec §6.1, decision 0012): every step on
 * the left (seven pillars, then Pitch docs), the Passport at the top right,
 * and the step's own screen in the middle. The frame is the same everywhere
 * so founders learn it once; each pillar's screen is its own.
 */
export function PillarShell({
  startup,
  active,
  progress,
  docs,
  isGuest = false,
  children,
}: {
  startup: { id: string; name: string };
  active: JourneyStepId;
  progress: Record<PillarId, GoalProgress>;
  docs: DocsProgress;
  isGuest?: boolean;
  children: React.ReactNode;
}) {
  const info = active === "docs" ? null : pillarInfo(active);
  return (
    <JourneyProvider startupId={startup.id} active={active} progress={progress} docs={docs}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 print:max-w-none print:p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
          <div className="min-w-0">
            <Link
              href="/startups"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden /> {startup.name}
            </Link>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
              {info ? (
                <>
                  <PillarIcon id={info.id} className="size-6 text-primary" />
                  {info.number} · {info.name}
                </>
              ) : (
                <>
                  <FounderPackIcon className="size-6 text-primary" aria-hidden />8 · Pitch docs
                </>
              )}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {info ? info.question : "Your documents, made from whatever you've completed so far."}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <SkipLink />
            <PassportWidget />
          </div>
        </div>

        {isGuest && (
          <div className="mt-4 print:hidden">
            <GuestNotice />
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[256px_minmax(0,1fr)_260px] print:block">
          <div className="print:hidden">
            <StepRail />
          </div>
          {children}
        </div>
      </div>
    </JourneyProvider>
  );
}
