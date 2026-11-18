"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input, Label } from "@bluslate/ui";
import { setNoTrack, track } from "@/lib/analytics/client";
import { saveProfile, type ProfileFormState } from "@/lib/profile-actions";

/** Name and age (docs/decisions/0011): on /welcome after a first sign-in, and on Profile. */
export function ProfileForm({
  name,
  age,
  next,
  submitLabel = "Save",
}: {
  name: string;
  age: number | null;
  /** Where to go after saving; Profile by default. */
  next?: string;
  submitLabel?: string;
}) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveProfile, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const value = Number(new FormData(e.currentTarget).get("age"));
        // Under-18s are never tracked; decide before the event below is sent.
        setNoTrack(Number.isFinite(value) && value < 18);
        if (next) track("profile_completed");
      }}
      className="space-y-4"
      data-testid="profile-form"
    >
      {next && <input type="hidden" name="next" value={next} />}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
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
        <div className="space-y-2">
          <Label htmlFor="profile-age">Your age</Label>
          <Input
            id="profile-age"
            name="age"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            defaultValue={age ?? ""}
            required
            placeholder="20"
          />
        </div>
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
