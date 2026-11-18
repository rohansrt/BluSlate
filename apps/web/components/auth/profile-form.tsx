"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input, Label } from "@bluslate/ui";
import { track } from "@/lib/analytics/client";
import { saveProfile, type ProfileFormState } from "@/lib/profile-actions";

/** First name (decisions 0011, 0012): on /welcome after a first sign-in, and on Profile. */
export function ProfileForm({
  name,
  next,
  submitLabel = "Save",
}: {
  name: string;
  /** Where to go after saving; Profile by default. */
  next?: string;
  submitLabel?: string;
}) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveProfile, {});
  return (
    <form
      action={action}
      onSubmit={() => {
        if (next) track("profile_completed");
      }}
      className="space-y-4"
      data-testid="profile-form"
    >
      {next && <input type="hidden" name="next" value={next} />}
      <div className="space-y-2">
        <Label htmlFor="profile-name">Your first name</Label>
        <Input
          id="profile-name"
          name="name"
          autoComplete="given-name"
          defaultValue={name}
          maxLength={60}
          required
          placeholder="Riya"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {submitLabel}
      </Button>
    </form>
  );
}
