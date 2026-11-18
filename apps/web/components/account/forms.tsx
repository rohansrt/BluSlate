"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Send, UserPlus } from "lucide-react";
import { Button, Input, Label, Textarea, cn } from "@bluslate/ui";
import {
  requestConsult,
  saveIdea,
  sendFeedback,
  sendFriendRequest,
  type FormState,
} from "@/lib/account-actions";
import { NEEDS_WORK, USEFULNESS, WANT_NEXT, WORKS_WELL } from "@/lib/feedback";
import { initOnboarding, setOnboarding } from "@/lib/onboarding-store";
import { track } from "@/lib/analytics/client";

/** Client forms for the account pages (docs/decisions/0011). */

function Status({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="rounded-lg bg-actual-soft px-3 py-2 text-sm text-actual">
        {state.ok}
      </p>
    );
  return null;
}

/** Track an event once each time an action succeeds. */
function useTrackOk(state: FormState, onOk: () => void) {
  const last = useRef<FormState | null>(null);
  useEffect(() => {
    if (state.ok && last.current !== state) onOk();
    last.current = state;
  }, [state, onOk]);
}

// ─── Idea Book ──────────────────────────────────────────────────────────────

export function IdeaForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(saveIdea, {});
  const formRef = useRef<HTMLFormElement>(null);
  useTrackOk(state, () => {
    track("idea_saved", { source: "own" });
    formRef.current?.reset();
  });
  return (
    <form ref={formRef} action={action} className="space-y-3" data-testid="idea-form">
      <Label htmlFor="idea-text">A new idea</Label>
      <Textarea
        id="idea-text"
        name="text"
        rows={3}
        maxLength={500}
        required
        placeholder="Anything: a product, a shop, a problem you keep noticing…"
      />
      <Status state={state} />
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />} Save idea
      </Button>
    </form>
  );
}

export function SaveSuggestionButton({ text }: { text: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveIdea, {});
  useTrackOk(state, () => track("idea_saved", { source: "suggested" }));
  return (
    <form action={action}>
      <input type="hidden" name="text" value={text} />
      <input type="hidden" name="source" value="suggested" />
      <Button type="submit" size="sm" variant="outline" disabled={pending || Boolean(state.ok)}>
        {state.ok ? "Saved" : "Save"}
      </Button>
    </form>
  );
}

/** Start a startup from an idea: the onboarding card opens with the idea filled in. */
export function StartFromIdeaButton({ text, name }: { text: string; name: string | null }) {
  const router = useRouter();
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => {
        initOnboarding(true, name);
        setOnboarding((s) => ({
          step: 3,
          draft: { ...s.draft, path: "new-idea", newIdeaMode: "idea", idea: text.slice(0, 280) },
        }));
        router.push("/startups/new?fresh=1");
      }}
    >
      Start with this <ArrowRight aria-hidden />
    </Button>
  );
}

// ─── Collaborate ────────────────────────────────────────────────────────────

export function FriendRequestForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendFriendRequest, {});
  const formRef = useRef<HTMLFormElement>(null);
  useTrackOk(state, () => {
    track("friend_request_sent");
    formRef.current?.reset();
  });
  return (
    <form ref={formRef} action={action} className="space-y-3" data-testid="friend-form">
      <Label htmlFor="friend-email">Your friend&apos;s email</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="friend-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="friend@example.com"
        />
        <Button type="submit" disabled={pending} className="shrink-0">
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <UserPlus aria-hidden />}
          Send request
        </Button>
      </div>
      <Status state={state} />
    </form>
  );
}

// ─── Consult ────────────────────────────────────────────────────────────────

export function ConsultForm({ name, email }: { name: string | null; email: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestConsult, {});
  useTrackOk(state, () => track("consult_requested"));
  if (state.ok)
    return (
      <div className="space-y-3" data-testid="consult-done">
        <Status state={state} />
      </div>
    );
  return (
    <form action={action} className="space-y-4" data-testid="consult-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="consult-name">Your name</Label>
          <Input id="consult-name" name="name" maxLength={80} defaultValue={name ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="consult-phone">Contact number</Label>
          <Input
            id="consult-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            placeholder="+91 98765 43210"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="consult-email">Your email</Label>
          <Input
            id="consult-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={email ?? ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="consult-message">How can we help?</Label>
        <Textarea
          id="consult-message"
          name="message"
          rows={5}
          maxLength={2000}
          required
          placeholder="Your startup, where you're stuck, and what kind of help you'd like."
        />
      </div>
      <Status state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        Send my request
      </Button>
    </form>
  );
}

// ─── Feedback ───────────────────────────────────────────────────────────────

function Choices({
  name,
  legend,
  options,
  multiple,
}: {
  name: string;
  legend: string;
  options: readonly (readonly [string, string])[];
  multiple: boolean;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 font-semibold">
        {legend}{" "}
        <span className="text-sm font-normal text-muted-foreground">
          {multiple ? "(pick any)" : "(pick one)"}
        </span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([id, label]) => (
          <label
            key={id}
            className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-founder-soft has-[:checked]:text-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              value={id}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FeedbackForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendFeedback, {});
  useTrackOk(state, () => track("feedback_sent"));
  if (state.ok) return <Status state={state} />;
  return (
    <form action={action} className="space-y-7" data-testid="feedback-form">
      <Choices
        name="worksWell"
        legend="1. What works well for you?"
        options={WORKS_WELL}
        multiple
      />
      <Choices
        name="needsWork"
        legend="2. What needs the most work?"
        options={NEEDS_WORK}
        multiple
      />
      <Choices
        name="usefulness"
        legend="3. How useful is BluSlate for your idea?"
        options={USEFULNESS}
        multiple={false}
      />
      <Choices name="wantNext" legend="4. What would you like next?" options={WANT_NEXT} multiple />
      <fieldset>
        <legend className="mb-2 font-semibold">
          5. How likely are you to recommend BluSlate to a friend?{" "}
          <span className="text-sm font-normal text-muted-foreground">
            (0 = not at all, 10 = very)
          </span>
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 11 }, (_, n) => (
            <label
              key={n}
              className={cn(
                "grid size-10 cursor-pointer place-items-center rounded-lg border border-border text-sm font-semibold transition-colors hover:bg-accent",
                "has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
              )}
            >
              <input type="radio" name="recommend" value={n} className="sr-only" />
              {n}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="feedback-comment">
          Anything else? <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea id="feedback-comment" name="comment" rows={4} maxLength={2000} />
      </div>
      <Status state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        Send feedback
      </Button>
    </form>
  );
}
