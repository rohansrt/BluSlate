"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@bluslate/ui";
import { deleteStartup } from "@/lib/startup-actions";

/** Two-step delete: ask, then confirm. Deleting removes everything in the startup. */
export function DeleteStartupButton({ id, name }: { id: string; name: string }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setAsking(true)}
        aria-label={`Delete ${name}`}
      >
        <Trash2 aria-hidden /> Delete
      </Button>
    );
  }
  return (
    <form
      action={deleteStartup}
      className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm"
      role="alertdialog"
      aria-label={`Delete ${name}?`}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="confirm" value="yes" />
      <p className="font-semibold text-danger">Delete &ldquo;{name}&rdquo;?</p>
      <p className="mt-1 text-foreground/80">
        Every answer, draft and version in it is removed. This can&apos;t be undone.
      </p>
      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm" className="bg-danger text-white hover:bg-danger/90">
          Delete forever
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setAsking(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
