"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lightbulb, Building2, Wrench, Loader2 } from "lucide-react";
import { Button, Card, Input, Label, PillarIcon, Select, Textarea, cn } from "@bluslate/ui";
import {
  EXISTING_STAGES,
  LIMITS,
  canContinue,
  parseDraft,
  type EntryPathId,
  type OnboardingDraft,
} from "@/lib/onboarding";
import {
  getOnboarding,
  initOnboarding,
  resetOnboarding,
  setOnboarding,
  subscribeOnboarding,
  type OnboardingState,
  type Step,
} from "@/lib/onboarding-store";
import { track } from "@/lib/analytics/client";
import { PILLARS } from "@/lib/pillars";
import { EmailCodeForm } from "@/components/auth/email-code-form";
import { GuestForm } from "@/components/auth/guest-form";

const PATHS: { id: EntryPathId; title: string; hint: string; icon: typeof Lightbulb }[] = [
  {
    id: "new-idea",
    title: "I have a new idea",
    hint: "Or just a problem that bothers you",
    icon: Lightbulb,
  },
  {
    id: "existing",
    title: "I already run a business",
    hint: "Test a change before you make it",
    icon: Building2,
  },
  {
    id: "one-tool",
    title: "I just want one tool",
    hint: "Jump straight to one of the seven steps",
    icon: Wrench,
  },
];

function stepTitle(step: Step, path: EntryPathId | undefined): string {
  if (step === 1) return "What should we call you?";
  if (step === 2) return "Where are you starting?";
  if (step === 4) return "Save your startup";
  if (path === "existing") return "Tell us about your business";
  if (path === "one-tool") return "Which tool do you need?";
  return "What's the idea?";
}

export interface OnboardingCardProps {
  signedIn: boolean;
  /** The signed-in founder's name, if we already know it. */
  knownName?: string | null;
  /** Save a complete draft straight away (used after the email-code sign-in). */
  autoSubmit?: boolean;
  /** Where the card sits, for analytics: the Home hero, beside the circle, or /startups/new. */
  placement?: "hero" | "circle" | "new";
  className?: string;
}

const noopSubscribe = () => () => {};

/** True only in the browser, after hydration (the draft lives in localStorage). */
function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Visitors see four steps (name, starting point, details, save by email code
 * or as a guest); signed-in founders see two (starting point, details).
 */
function shownStep(step: Step, signedIn: boolean): { n: number; total: number } {
  return signedIn ? { n: Math.max(1, step - 1), total: 2 } : { n: step, total: 4 };
}

type SaveResult = { ok: true; id: string } | { ok: false; error: string };

async function postStartup(current: OnboardingDraft): Promise<SaveResult> {
  const parsed = parseDraft(current);
  if (!parsed.success)
    return { ok: false, error: "Some answers are missing. Go back and check them." };
  try {
    const res = await fetch("/api/startups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok || !body.id)
      return { ok: false, error: body.error ?? "We couldn't save your startup." };
    return { ok: true, id: body.id };
  } catch {
    return { ok: false, error: "We couldn't reach BluSlate. Check your connection and try again." };
  }
}

export function OnboardingCard(props: OnboardingCardProps) {
  const isClient = useIsClient();
  // Server render and first paint: the first step, inert until the draft loads.
  if (!isClient) return <PlaceholderCard signedIn={props.signedIn} className={props.className} />;
  return <OnboardingCardInner {...props} />;
}

function PlaceholderCard({ signedIn, className }: { signedIn: boolean; className?: string }) {
  const { n, total } = shownStep(signedIn ? 2 : 1, signedIn);
  return (
    <Card className={cn("p-6 sm:p-8", className)} aria-busy="true">
      <ProgressDots n={n} total={total} />
      <h2 className="mt-5 text-2xl font-bold tracking-tight">
        {stepTitle(signedIn ? 2 : 1, undefined)}
      </h2>
      <div className="mt-5 h-24 rounded-xl bg-muted/60" />
      <div className="mt-5 flex justify-end">
        <Button disabled>
          Continue <ArrowRight aria-hidden />
        </Button>
      </div>
    </Card>
  );
}

function useOnboardingState(signedIn: boolean, knownName?: string | null): OnboardingState {
  initOnboarding(signedIn, knownName);
  const current = useSyncExternalStore(subscribeOnboarding, getOnboarding, getOnboarding);
  // initOnboarding always sets the state, so this only guards the type.
  return current ?? { draft: {}, step: 1 };
}

function OnboardingCardInner({
  signedIn,
  knownName,
  autoSubmit = false,
  placement = "hero",
  className,
}: OnboardingCardProps) {
  const router = useRouter();
  const { draft, step } = useOnboardingState(signedIn, knownName);
  const [initialDraft] = useState(draft);
  const shouldAutoSubmit = autoSubmit && signedIn && parseDraft(initialDraft).success;
  const [saving, setSaving] = useState(shouldAutoSubmit);
  const [saveError, setSaveError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Only the card the founder is using moves focus (Home can show two cards).
  const movedRef = useRef(false);
  const autoSubmittedRef = useRef(false);
  const { n, total } = shownStep(step, signedIn);
  const lastStep: Step = signedIn ? 3 : 4;

  // Move focus to the new step's heading so screen readers announce it.
  useEffect(() => {
    if (!movedRef.current) return;
    movedRef.current = false;
    headingRef.current?.focus();
  }, [step]);

  function handleResult(result: SaveResult, entryPath: string | undefined) {
    if (result.ok) {
      track("startup_created", { entryPath: entryPath ?? "unknown", where: placement });
      resetOnboarding();
      router.push(`/startups/${result.id}`);
      router.refresh();
      return;
    }
    setSaving(false);
    setSaveError(result.error);
  }

  function saveStartup() {
    setSaving(true);
    setSaveError(null);
    void postStartup(draft).then((r) => handleResult(r, draft.path));
  }

  // After the email code: a complete draft is saved without another click.
  useEffect(() => {
    if (!shouldAutoSubmit || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    void postStartup(initialDraft).then((r) => handleResult(r, initialDraft.path));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const update = (patch: Partial<OnboardingDraft>) =>
    setOnboarding((s) => ({ ...s, draft: { ...s.draft, ...patch } }));
  const go = (next: Step) => {
    movedRef.current = true;
    setSaveError(null);
    setOnboarding((s) => ({ ...s, step: next }));
    track("onboarding_step", { step: next, signedIn, where: placement });
  };

  const next = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (step === 4 || !canContinue(step, draft)) return;
    if (step === 2 && draft.path) track("onboarding_path", { path: draft.path, where: placement });
    if (step === lastStep) saveStartup();
    else go((step + 1) as Step);
  };

  if (autoSubmit && saving && !saveError && shouldAutoSubmit) {
    return (
      <Card className={cn("p-6 sm:p-8", className)} aria-busy="true">
        <div className="flex items-center gap-3 text-muted-foreground" role="status">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          <span>Saving your startup…</span>
        </div>
      </Card>
    );
  }

  const id = (name: string) => `ob-${placement}-${name}`;

  return (
    <Card
      className={cn("p-6 sm:p-8", className)}
      data-testid={`onboarding-card${placement === "circle" ? "-circle" : ""}`}
    >
      <ProgressDots n={n} total={total} />
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 text-2xl font-bold tracking-tight outline-none"
        data-testid="onboarding-step-title"
      >
        {stepTitle(step, draft.path)}
      </h2>

      {step === 1 && (
        <form onSubmit={next} className="mt-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor={id("first-name")}>Your first name</Label>
            <Input
              id={id("first-name")}
              name="firstName"
              autoComplete="given-name"
              maxLength={LIMITS.firstName}
              value={draft.firstName ?? ""}
              onChange={(e) => update({ firstName: e.target.value })}
              placeholder="Riya"
            />
          </div>
          <StepActions canNext={canContinue(1, draft)} />
        </form>
      )}

      {step === 2 && (
        <form onSubmit={next} className="mt-5 space-y-5">
          <fieldset className="space-y-3">
            <legend className="sr-only">Where are you starting?</legend>
            {PATHS.map((p) => {
              const Icon = p.icon;
              const checked = draft.path === p.id;
              return (
                <label
                  key={p.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    checked ? "border-primary bg-founder-soft" : "border-border hover:bg-accent",
                  )}
                >
                  <input
                    type="radio"
                    name={id("path")}
                    value={p.id}
                    checked={checked}
                    onChange={() => update({ path: p.id })}
                    className="mt-1 accent-[var(--founder)]"
                  />
                  <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="block font-semibold">{p.title}</span>
                    <span className="block text-sm text-muted-foreground">{p.hint}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
          <StepActions
            onBack={signedIn ? undefined : () => go(1)}
            canNext={canContinue(2, draft)}
          />
        </form>
      )}

      {step === 3 && (
        <form onSubmit={next} className="mt-5 space-y-5">
          {draft.path === "new-idea" && <NewIdeaFields draft={draft} update={update} idp={id} />}
          {draft.path === "existing" && <ExistingFields draft={draft} update={update} idp={id} />}
          {draft.path === "one-tool" && <OneToolFields draft={draft} update={update} idp={id} />}
          {saveError && (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {saveError}
            </p>
          )}
          <StepActions
            onBack={() => go(2)}
            canNext={canContinue(3, draft) && !saving}
            busy={saving}
            label={signedIn ? "Start building" : undefined}
          />
        </form>
      )}

      {step === 4 && !signedIn && (
        <div className="mt-5">
          <EmailCodeForm
            intro={
              <p className="text-muted-foreground">
                Enter your email and we&apos;ll send you a 6‑digit code. No password. Your startup
                is kept in your account, so you can open it on any device.
              </p>
            }
            idPrefix={id("save")}
            where="onboarding"
            // After the code, /startups/new saves the draft kept in this browser.
            redirectTo="/startups/new"
            verifyLabel="Start building"
            onBack={() => go(3)}
            footer={
              <p className="text-xs leading-5 text-muted-foreground">
                By continuing you agree to the{" "}
                <Link href="/terms" className="underline underline-offset-2">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline underline-offset-2">
                  Privacy Policy
                </Link>
                . Your idea stays private.
              </p>
            }
          />
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or continue as a guest{" "}
            <span className="h-px flex-1 bg-border" />
          </div>
          {/* A guest lands on /startups/new too, which saves this draft (decision 0012). */}
          <GuestForm
            redirectTo="/startups/new"
            knownName={draft.firstName}
            idPrefix={id("guest")}
          />
        </div>
      )}
    </Card>
  );
}

function ProgressDots({ n, total }: { n: number; total: number }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        Step {n} of {total}
      </p>
      <div
        className={cn("mt-2 grid gap-1.5", total === 4 ? "grid-cols-4" : "grid-cols-2")}
        aria-hidden
      >
        {Array.from({ length: total }, (_, i) => i + 1).map((k) => (
          <span key={k} className={cn("h-1.5 rounded-full", k <= n ? "bg-primary" : "bg-muted")} />
        ))}
      </div>
    </div>
  );
}

function StepActions({
  onBack,
  canNext,
  busy = false,
  label = "Continue",
}: {
  onBack?: () => void;
  canNext: boolean;
  busy?: boolean;
  label?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", onBack ? "justify-between" : "justify-end")}>
      {onBack && (
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden /> Back
        </Button>
      )}
      <Button type="submit" disabled={!canNext}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {label} {!busy && <ArrowRight aria-hidden />}
      </Button>
    </div>
  );
}

type FieldProps = {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
  /** Field ids are unique per card (Home can show two). */
  idp: (name: string) => string;
};

function NewIdeaFields({ draft, update, idp }: FieldProps) {
  const discover = draft.newIdeaMode === "discover";
  return (
    <>
      <div
        className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
        role="radiogroup"
        aria-label="Do you have an idea yet?"
      >
        {(
          [
            ["idea", "I have an idea"],
            ["discover", "Help me find a problem"],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={draft.newIdeaMode === mode}
            onClick={() => update({ newIdeaMode: mode })}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              draft.newIdeaMode === mode
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {discover ? (
        <div className="space-y-2">
          <Label htmlFor={idp("interest")}>An area you care about</Label>
          <Input
            id={idp("interest")}
            maxLength={LIMITS.idea}
            value={draft.interest ?? ""}
            onChange={(e) => update({ interest: e.target.value })}
            placeholder="Getting to college every day"
          />
          <p className="text-sm text-muted-foreground">
            Discover will help you turn it into a clear problem.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor={idp("idea")}>Your idea in one sentence</Label>
          <Textarea
            id={idp("idea")}
            rows={3}
            maxLength={LIMITS.idea}
            value={draft.idea ?? ""}
            onChange={(e) => update({ idea: e.target.value })}
            placeholder="Cheaper e-bike rentals for students who live a few kilometres from campus"
          />
          <p className="text-right text-xs text-muted-foreground">
            {(draft.idea ?? "").length}/{LIMITS.idea}
          </p>
        </div>
      )}
    </>
  );
}

function ExistingFields({ draft, update, idp }: FieldProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={idp("startup-name")}>Business name</Label>
        <Input
          id={idp("startup-name")}
          autoComplete="organization"
          maxLength={LIMITS.startupName}
          value={draft.startupName ?? ""}
          onChange={(e) => update({ startupName: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={idp("stage")}>Stage</Label>
          <Select
            id={idp("stage")}
            value={draft.stage ?? ""}
            onChange={(e) => update({ stage: e.target.value })}
          >
            <option value="" disabled>
              Choose a stage
            </option>
            {EXISTING_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={idp("industry")}>Industry</Label>
          <Input
            id={idp("industry")}
            maxLength={LIMITS.industry}
            value={draft.industry ?? ""}
            onChange={(e) => update({ industry: e.target.value })}
            placeholder="Food and beverage"
          />
        </div>
      </div>
    </>
  );
}

function OneToolFields({ draft, update, idp }: FieldProps) {
  return (
    <>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">Which tool should we open?</legend>
        <div className="grid gap-2">
          {PILLARS.map((p) => {
            const checked = draft.tool === p.id;
            return (
              <label
                key={p.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                  checked ? "border-primary bg-founder-soft" : "border-border hover:bg-accent",
                )}
              >
                <input
                  type="radio"
                  name={idp("tool")}
                  value={p.id}
                  checked={checked}
                  onChange={() => update({ tool: p.id })}
                  className="mt-1 accent-[var(--founder)]"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <PillarIcon id={p.id} className="size-4 text-primary" />
                    {p.number} · {p.name}
                  </span>
                  <span className="block text-sm text-muted-foreground">{p.question}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}
