"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lightbulb, Building2, Wrench, Mail, Loader2 } from "lucide-react";
import { Button, Card, Input, Label, Select, Textarea, cn } from "@bluslate/ui";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import {
  EXISTING_STAGES,
  LIMITS,
  canContinue,
  parseDraft,
  type EntryPathId,
  type OnboardingDraft,
} from "@/lib/onboarding";
import { clearDraft, loadDraft, saveDraft } from "@/lib/onboarding-draft";
import { PILLARS } from "@/lib/pillars";
import { sendSignInLink, type SignInState } from "@/lib/auth-actions";

type Step = 1 | 2 | 3 | 4;

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
  /** Save a complete draft straight away (used after the magic-link sign-in). */
  autoSubmit?: boolean;
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

interface InitialState {
  draft: OnboardingDraft;
  step: Step;
}

function initialState(knownName: string | null | undefined): InitialState {
  const stored = loadDraft() ?? {};
  const draft: OnboardingDraft = { country: "IN", newIdeaMode: "idea", ...stored };
  if (!draft.firstName && knownName) draft.firstName = knownName;
  const storedStep = draft.step && draft.step >= 1 && draft.step <= 4 ? draft.step : null;
  // Signed-in founders we already know skip the name question.
  return { draft, step: storedStep ?? (knownName ? 2 : 1) };
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
  if (!isClient) return <PlaceholderCard className={props.className} />;
  return <OnboardingCardInner {...props} />;
}

function PlaceholderCard({ className }: { className?: string }) {
  return (
    <Card className={cn("p-6 sm:p-8", className)} aria-busy="true">
      <ProgressDots step={1} />
      <h2 className="mt-5 text-2xl font-bold tracking-tight">{stepTitle(1, undefined)}</h2>
      <div className="mt-5 space-y-2">
        <Label htmlFor="ob-first-name-placeholder">Your first name</Label>
        <Input id="ob-first-name-placeholder" disabled placeholder="Riya" />
      </div>
      <div className="mt-5 flex justify-end">
        <Button disabled>
          Continue <ArrowRight aria-hidden />
        </Button>
      </div>
    </Card>
  );
}

function OnboardingCardInner({
  signedIn,
  knownName,
  autoSubmit = false,
  className,
}: OnboardingCardProps) {
  const router = useRouter();
  const [initial] = useState(() => initialState(knownName));
  const shouldAutoSubmit = autoSubmit && signedIn && parseDraft(initial.draft).success;
  const [draft, setDraft] = useState<OnboardingDraft>(initial.draft);
  const [step, setStep] = useState<Step>(initial.step);
  const [saving, setSaving] = useState(shouldAutoSubmit);
  const [saveError, setSaveError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const movedRef = useRef(false);
  const autoSubmittedRef = useRef(false);

  // Keep the draft in the browser as the founder types.
  useEffect(() => {
    saveDraft({ ...draft, step });
  }, [draft, step]);

  // Move focus to the new step's heading so screen readers announce it.
  useEffect(() => {
    if (movedRef.current) headingRef.current?.focus();
  }, [step]);

  function handleResult(result: SaveResult) {
    if (result.ok) {
      clearDraft();
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
    void postStartup(draft).then(handleResult);
  }

  // After the magic link: a complete draft is saved without another click.
  useEffect(() => {
    if (!shouldAutoSubmit || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    void postStartup(initial.draft).then(handleResult);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const update = (patch: Partial<OnboardingDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const go = (next: Step) => {
    movedRef.current = true;
    setSaveError(null);
    setStep(next);
  };

  const next = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (step < 4 && canContinue(step as 1 | 2 | 3, draft)) go((step + 1) as Step);
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

  return (
    <Card className={cn("p-6 sm:p-8", className)} data-testid="onboarding-card">
      <ProgressDots step={step} />
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
            <Label htmlFor="ob-first-name">Your first name</Label>
            <Input
              id="ob-first-name"
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
                    name="path"
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
          <StepActions onBack={() => go(1)} canNext={canContinue(2, draft)} />
        </form>
      )}

      {step === 3 && (
        <form onSubmit={next} className="mt-5 space-y-5">
          {draft.path === "new-idea" && <NewIdeaFields draft={draft} update={update} />}
          {draft.path === "existing" && <ExistingFields draft={draft} update={update} />}
          {draft.path === "one-tool" && <OneToolFields draft={draft} update={update} />}
          <StepActions onBack={() => go(2)} canNext={canContinue(3, draft)} />
        </form>
      )}

      {step === 4 && (
        <div className="mt-5 space-y-5">
          {signedIn ? (
            <>
              <p className="text-muted-foreground">
                We&apos;ll create your startup and take you to your city: seven hubs, one for each
                step.
              </p>
              {saveError && (
                <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                  {saveError}
                </p>
              )}
              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="ghost" onClick={() => go(3)}>
                  <ArrowLeft aria-hidden /> Back
                </Button>
                <Button type="button" onClick={saveStartup} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" aria-hidden /> : null}
                  Save and open my city
                </Button>
              </div>
            </>
          ) : (
            <EmailStep onBack={() => go(3)} />
          )}
        </div>
      )}
    </Card>
  );
}

function ProgressDots({ step }: { step: Step }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        Step {step} of 4
      </p>
      <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={cn("h-1.5 rounded-full", n <= step ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>
    </div>
  );
}

function StepActions({ onBack, canNext }: { onBack?: () => void; canNext: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", onBack ? "justify-between" : "justify-end")}>
      {onBack && (
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden /> Back
        </Button>
      )}
      <Button type="submit" disabled={!canNext}>
        Continue <ArrowRight aria-hidden />
      </Button>
    </div>
  );
}

type FieldProps = { draft: OnboardingDraft; update: (patch: Partial<OnboardingDraft>) => void };

function PlaceFields({
  draft,
  update,
  cityOptional = false,
}: FieldProps & { cityOptional?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="ob-city">
          City
          {cityOptional && <span className="font-normal text-muted-foreground"> (optional)</span>}
        </Label>
        <Input
          id="ob-city"
          autoComplete="address-level2"
          maxLength={LIMITS.city}
          value={draft.city ?? ""}
          onChange={(e) => update({ city: e.target.value })}
          placeholder="Pune"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ob-country">Country</Label>
        <Select
          id="ob-country"
          autoComplete="country"
          value={draft.country ?? "IN"}
          onChange={(e) => update({ country: e.target.value })}
        >
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

function NewIdeaFields({ draft, update }: FieldProps) {
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
          <Label htmlFor="ob-interest">An area you care about</Label>
          <Input
            id="ob-interest"
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
          <Label htmlFor="ob-idea">Your idea in one sentence</Label>
          <Textarea
            id="ob-idea"
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
      <PlaceFields draft={draft} update={update} />
    </>
  );
}

function ExistingFields({ draft, update }: FieldProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="ob-startup-name">Business name</Label>
        <Input
          id="ob-startup-name"
          autoComplete="organization"
          maxLength={LIMITS.startupName}
          value={draft.startupName ?? ""}
          onChange={(e) => update({ startupName: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ob-stage">Stage</Label>
          <Select
            id="ob-stage"
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
          <Label htmlFor="ob-industry">Industry</Label>
          <Input
            id="ob-industry"
            maxLength={LIMITS.industry}
            value={draft.industry ?? ""}
            onChange={(e) => update({ industry: e.target.value })}
            placeholder="Food and beverage"
          />
        </div>
      </div>
      <PlaceFields draft={draft} update={update} />
    </>
  );
}

function OneToolFields({ draft, update }: FieldProps) {
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
                  name="tool"
                  value={p.id}
                  checked={checked}
                  onChange={() => update({ tool: p.id })}
                  className="mt-1 accent-[var(--founder)]"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    {p.number} · {p.name}
                  </span>
                  <span className="block text-sm text-muted-foreground">{p.question}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <PlaceFields draft={draft} update={update} cityOptional />
    </>
  );
}

function EmailStep({ onBack }: { onBack: () => void }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(sendSignInLink, {});
  return (
    <form action={action} className="space-y-5">
      <p className="text-muted-foreground">
        Sign in with your email to keep your startup. We&apos;ll send you a link, so there&apos;s no
        password to remember.
      </p>
      <input type="hidden" name="redirectTo" value="/startups/new" />
      <div className="space-y-2">
        <Label htmlFor="ob-email">Email</Label>
        <Input
          id="ob-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "ob-email-error" : undefined}
        />
        {state.error && (
          <p id="ob-email-error" role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden /> Back
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
          Email me a sign-in link
        </Button>
      </div>
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
    </form>
  );
}
