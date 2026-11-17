"use client";

import { useActionState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button, Input, Label } from "@bluslate/ui";
import { sendSignInLink, type SignInState } from "@/lib/auth-actions";

export function SignInForm({
  redirectTo,
  submitLabel,
}: {
  redirectTo: string;
  submitLabel?: string;
}) {
  const [state, action, pending] = useActionState<SignInState, FormData>(sendSignInLink, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "signin-email-error" : undefined}
        />
        {state.error && (
          <p id="signin-email-error" role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
        {submitLabel ?? "Email me a sign-in link"}
      </Button>
    </form>
  );
}
