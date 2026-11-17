import * as React from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import type { EvidenceLabel } from "@bluslate/contracts";
import { Button } from "./button";
import { EvidenceBadge } from "./evidence-badge";

export interface PublishChange {
  field: string;
  before?: string | null;
  after: string;
  label: EvidenceLabel;
}

/**
 * The Publish panel (spec §5.5 step 2, §6.3): what will change, its label, and
 * what else it affects, shown before the founder approves. Only "Approve and
 * publish" writes to the Twin.
 */
export function PublishPanel({
  entityName,
  changes,
  isNew,
  fromVersion,
  affected,
  busy = false,
  error,
  onApprove,
  onEdit,
  onReject,
}: {
  entityName: string;
  changes: PublishChange[];
  isNew: boolean;
  fromVersion: number | null;
  /** Human-readable entities and pillars that will be marked "May be outdated". */
  affected: { name: string; pillar: string }[];
  busy?: boolean;
  error?: string | null;
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
}) {
  return (
    <section
      aria-label="Publish"
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      data-testid="publish-panel"
    >
      <h3 className="font-semibold">Ready to publish</h3>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {isNew
          ? `This creates your first ${entityName}.`
          : `This saves version ${(fromVersion ?? 0) + 1} of your ${entityName}. Version ${fromVersion} stays in its history.`}
      </p>

      <ul className="mt-4 space-y-3">
        {changes.map((c) => (
          <li key={c.field} className="rounded-xl bg-muted/60 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{c.field}</span>
              <EvidenceBadge label={c.label} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {c.before ? (
                <>
                  <span className="text-muted-foreground line-through">{c.before}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
                </>
              ) : null}
              <span className="text-foreground">{c.after}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 text-sm">
        <p className="font-medium">What else this affects</p>
        {affected.length === 0 ? (
          <p className="mt-0.5 text-muted-foreground">Nothing else uses this yet.</p>
        ) : (
          <ul className="mt-1 list-disc pl-5 text-muted-foreground">
            {affected.map((a) => (
              <li key={`${a.pillar}-${a.name}`}>
                {a.name} in {a.pillar} will be marked &ldquo;May be outdated&rdquo;
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button onClick={onApprove} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <CheckCircle2 aria-hidden />}
          Approve and publish
        </Button>
        <Button variant="outline" onClick={onEdit} disabled={busy}>
          Edit
        </Button>
        <Button variant="ghost" onClick={onReject} disabled={busy}>
          Discard draft
        </Button>
      </div>
    </section>
  );
}
