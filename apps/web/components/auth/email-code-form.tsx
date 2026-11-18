"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react";
import { Button, Input, Label } from "@bluslate/ui";
import { sendSignInCode, verifySignInCode, type CodeFormState } from "@/lib/auth-actions";
import { rememberEmail, useRememberedEmail } from "@/components/auth/remembered-email";

const RESEND_AFTER_MS = 30_000;

/**
 * Sign in with a 6-digit email code (docs/decisions/0009), in two parts on
 * the same card: the email, then the code. Sign in and sign up are the same:
 * a new email gets a new account, and a known email opens its past work.
 */
export function EmailCodeForm({
  redirectTo,
  sendLabel = "Email me a code",
  verifyLabel = "Sign in",
  onBack,
  intro,
  footer,
  idPrefix = "signin",
  defaultEmail,
}: {
  /** Where to go once signed in. */
  redirectTo: string;
  sendLabel?: string;
  verifyLabel?: string;
  /** Shown as "Back" on the email part, e.g. to the previous onboarding step. */
  onBack?: () => void;
  /** Shown above the email part only. */
  intro?: ReactNode;
  /** Shown under the email part, e.g. the Terms line. */
  footer?: ReactNode;
  idPrefix?: string;
  /** Pre-filled email, e.g. the one a guest typed. The device's last email wins. */
  defaultEmail?: string | null;
}) {
  const [state, dispatch, pending] = useActionState<CodeFormState, FormData>(
    async (prev, formData) => {
      const intent = formData.get("intent");
      if (intent === "change-email") return { step: "email" };
      if (intent === "verify") return verifySignInCode(prev, formData);
      return sendSignInCode(prev, formData);
    },
    { step: "email" },
  );
  const remembered = useRememberedEmail() || defaultEmail || "";

  // The code was right: a full page load lets Auth.js set the session cookie.
  useEffect(() => {
    if (state.step !== "done") return;
    rememberEmail(state.email);
    window.location.assign(state.url);
  }, [state]);

  // "Send a new code" unlocks 30 seconds after the last one was sent.
  const sentAt = state.step === "code" ? state.sentAt : 0;
  const [resendReadyFor, setResendReadyFor] = useState(0);
  useEffect(() => {
    if (!sentAt) return;
    const wait = Math.max(0, sentAt + RESEND_AFTER_MS - Date.now());
    const timer = setTimeout(() => setResendReadyFor(sentAt), wait);
    return () => clearTimeout(timer);
  }, [sentAt]);

  if (state.step === "done") {
    return (
      <div className="flex items-center gap-3 text-muted-foreground" role="status">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <span>Signing you in…</span>
      </div>
    );
  }

  if (state.step === "code") {
    const errorId = `${idPrefix}-code-error`;
    return (
      <form action={dispatch} className="space-y-5" data-testid="code-form">
        <input type="hidden" name="email" value={state.email} />
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <p className="text-muted-foreground" role="status">
          {state.resent ? "We sent a new code to " : "We sent a 6‑digit code to "}
          <span className="font-semibold text-foreground">{state.email}</span>. It works for 10
          minutes.
        </p>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-code`}>6‑digit code</Label>
          <Input
            id={`${idPrefix}-code`}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 \-]*"
            maxLength={7}
            required
            autoFocus
            placeholder="123 456"
            className="font-mono text-lg tracking-[0.3em]"
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? errorId : undefined}
          />
          {state.error && (
            <p id={errorId} role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          )}
        </div>
        <Button type="submit" name="intent" value="verify" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {verifyLabel} {!pending && <ArrowRight aria-hidden />}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <Button
            type="submit"
            name="intent"
            value="change-email"
            variant="ghost"
            size="sm"
            formNoValidate
            disabled={pending}
          >
            <ArrowLeft aria-hidden /> Use a different email
          </Button>
          <Button
            type="submit"
            name="intent"
            value="resend"
            variant="ghost"
            size="sm"
            formNoValidate
            disabled={pending || resendReadyFor !== sentAt}
          >
            Send a new code
          </Button>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Can&apos;t find it? Check your spam or promotions folder.
        </p>
      </form>
    );
  }

  const errorId = `${idPrefix}-email-error`;
  return (
    <form action={dispatch} className="space-y-5">
      {intro}
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`}>Email</Label>
        <Input
          key={remembered}
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={remembered}
          placeholder="you@example.com"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : undefined}
        />
        {state.error && (
          <p id={errorId} role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}
      </div>
      <div className={onBack ? "flex items-center justify-between gap-3" : undefined}>
        {onBack && (
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft aria-hidden /> Back
          </Button>
        )}
        <Button
          type="submit"
          name="intent"
          value="send"
          className={onBack ? undefined : "w-full"}
          disabled={pending}
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
          {sendLabel}
        </Button>
      </div>
      {footer}
    </form>
  );
}
