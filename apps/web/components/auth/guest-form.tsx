"use client";

import { useActionState } from "react";
import { Loader2, UserRound } from "lucide-react";
import { Button, Input, Label } from "@bluslate/ui";
import { continueAsGuest, type GuestFormState } from "@/lib/auth-actions";
import { rememberEmail, useRememberedEmail } from "@/components/auth/remembered-email";
import { track } from "@/lib/analytics/client";

/**
 * "Continue as guest" (docs/decisions/0010, 0012): a first name and an email,
 * no code and no age. The work is kept in this browser; signing in with a code later keeps it.
 */
export function GuestForm({
  redirectTo,
  knownName,
  idPrefix = "guest",
}: {
  redirectTo: string;
  /** The first name typed earlier (onboarding): not asked again. */
  knownName?: string;
  /** Field ids are unique per form (Home can show two onboarding cards). */
  idPrefix?: string;
}) {
  const [state, action, pending] = useActionState<GuestFormState, FormData>(continueAsGuest, {});
  const remembered = useRememberedEmail();
  const nameError = state.field === "name" ? state.error : undefined;
  const emailError = state.field === "email" ? state.error : undefined;
  const formError = state.error && !state.field ? state.error : undefined;
  const name = knownName?.trim();
  const fid = (x: string) => `${idPrefix}-${x}`;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const data = new FormData(e.currentTarget);
        const email = data.get("email");
        if (typeof email === "string" && email.trim()) rememberEmail(email.trim().toLowerCase());
        track("guest_started");
      }}
      className="space-y-4"
      data-testid="guest-form"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {name ? (
        <input type="hidden" name="name" value={name} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor={fid("name")}>Your first name</Label>
          <Input
            id={fid("name")}
            name="name"
            autoComplete="given-name"
            maxLength={60}
            required
            placeholder="Riya"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? fid("name-error") : undefined}
          />
          {nameError && (
            <p id={fid("name-error")} role="alert" className="text-sm text-danger">
              {nameError}
            </p>
          )}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor={fid("email")}>Your email</Label>
        <Input
          key={remembered}
          id={fid("email")}
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={remembered}
          placeholder="you@example.com"
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? fid("email-error") : undefined}
        />
        {emailError && (
          <p id={fid("email-error")} role="alert" className="text-sm text-danger">
            {emailError}
          </p>
        )}
      </div>
      {(formError || (name && nameError)) && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {formError ?? nameError}
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
