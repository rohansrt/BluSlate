"use client";

import { useActionState } from "react";
import { Loader2, UserRound } from "lucide-react";
import { Button, Input, Label } from "@bluslate/ui";
import { continueAsGuest, type GuestFormState } from "@/lib/auth-actions";
import { rememberEmail, useRememberedEmail } from "@/components/auth/remembered-email";
import { setNoTrack, track } from "@/lib/analytics/client";

/**
 * "Continue as guest" (docs/decisions/0010): a first name and an email, no
 * code. The work is kept in this browser; signing in with a code later keeps it.
 */
export function GuestForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState<GuestFormState, FormData>(continueAsGuest, {});
  const remembered = useRememberedEmail();
  const nameError = state.field === "name" ? state.error : undefined;
  const emailError = state.field === "email" ? state.error : undefined;
  const ageError = state.field === "age" ? state.error : undefined;
  const formError = state.error && !state.field ? state.error : undefined;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const data = new FormData(e.currentTarget);
        const email = data.get("email");
        if (typeof email === "string" && email.trim()) rememberEmail(email.trim().toLowerCase());
        // Under-18s are never tracked (docs/decisions/0011).
        const age = Number(data.get("age"));
        setNoTrack(Number.isFinite(age) && age < 18);
        track("guest_started");
      }}
      className="space-y-4"
      data-testid="guest-form"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
        <div className="space-y-2">
          <Label htmlFor="guest-name">Your first name</Label>
          <Input
            id="guest-name"
            name="name"
            autoComplete="given-name"
            maxLength={60}
            required
            placeholder="Riya"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "guest-name-error" : undefined}
          />
          {nameError && (
            <p id="guest-name-error" role="alert" className="text-sm text-danger">
              {nameError}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="guest-age">Your age</Label>
          <Input
            id="guest-age"
            name="age"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            required
            placeholder="20"
            aria-invalid={ageError ? true : undefined}
            aria-describedby={ageError ? "guest-age-error" : undefined}
          />
          {ageError && (
            <p id="guest-age-error" role="alert" className="text-sm text-danger">
              {ageError}
            </p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="guest-email">Your email</Label>
          <Input
            key={remembered}
            id="guest-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={remembered}
            placeholder="you@example.com"
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "guest-email-error" : undefined}
          />
          {emailError && (
            <p id="guest-email-error" role="alert" className="text-sm text-danger">
              {emailError}
            </p>
          )}
        </div>
      </div>
      {formError && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      )}
      <Button type="submit" variant="outline" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <UserRound aria-hidden />}
        Continue as guest
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        No code needed. Guest work is saved in this browser only; sign in with a code later to keep
        it and open it on any device.
      </p>
    </form>
  );
}
