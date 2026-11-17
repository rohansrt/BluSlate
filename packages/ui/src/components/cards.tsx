import * as React from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import type { EvidenceLabel } from "@bluslate/contracts";
import { cn } from "../cn";
import { Badge } from "./badge";
import { EvidenceBadge } from "./evidence-badge";

/**
 * The visual code used on every screen (spec §5.8): founder decision = solid
 * blue · AI suggestion = dashed grey · enabler = orange · needs review = amber
 * · synthetic = purple badge.
 */

export function DecisionCard({
  title = "Your decision",
  label,
  meta,
  children,
  className,
}: {
  title?: string;
  label: EvidenceLabel;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-xl border-2 border-founder bg-card p-4", className)}
      data-card="decision"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-founder">{title}</p>
        <EvidenceBadge label={label} />
      </div>
      <div className="mt-2">{children}</div>
      {meta && <p className="mt-2 text-xs text-muted-foreground">{meta}</p>}
    </div>
  );
}

export function SuggestionCard({
  label,
  children,
  actions,
  className,
}: {
  label: EvidenceLabel;
  children: React.ReactNode;
  /** Accept / edit / dismiss buttons. A suggestion never applies itself. */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-xl border-2 border-dashed border-ai/70 bg-ai-soft/40 p-4", className)}
      data-card="suggestion"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ai">
          <Sparkles className="size-3.5" aria-hidden /> Suggested by AI
        </p>
        <EvidenceBadge label={label} />
      </div>
      <div className="mt-2">{children}</div>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EnablerCard({
  name,
  kind,
  lastChecked,
  children,
  className,
}: {
  name: string;
  /** A real provider (researched, dated) or a synthetic quote (labelled). */
  kind: "real" | "synthetic";
  lastChecked?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-xl border-2 border-enabler/60 bg-enabler-soft/50 p-4", className)}
      data-card="enabler"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{name}</p>
        {kind === "real" ? (
          <Badge variant="enabler">Real provider</Badge>
        ) : (
          <EvidenceBadge label="SYNTHETIC" />
        )}
      </div>
      {kind === "synthetic" && (
        <p className="mt-1 text-xs text-muted-foreground">Synthetic quote, for simulation only.</p>
      )}
      {kind === "real" && lastChecked && (
        <p className="mt-1 text-xs text-muted-foreground">Last checked {lastChecked}</p>
      )}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

export function ReviewBanner({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-xl bg-review-soft px-4 py-3 text-sm text-review",
        className,
      )}
      data-card="review"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
