"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Presentation,
  RefreshCw,
  Sparkles,
  Wand2,
  LayoutGrid,
  X,
} from "lucide-react";
import type { GoalProgress } from "@bluslate/contracts";
import { Button, ProgressIcon, cn } from "@bluslate/ui";
import { StepNav } from "@/components/journey/journey-frame";
import { DOC_KINDS, DOC_KIND_INFO, type DocKind } from "@/lib/pitch-doc-kinds";
import { PILLARS, type PillarId } from "@/lib/pillars";

/**
 * Pitch docs (decision 0012): five documents, each with Generate and
 * Download. Download is off until a document has been generated, and then
 * gives the last generated version until the founder generates it again.
 * When the steps a document uses aren't complete, the founder chooses: fill
 * the gaps with AI predictions, or use only what's done.
 */

export interface DocMetaView {
  kind: DocKind;
  generatedAt: string;
  aiFilled: boolean;
  sections: number;
  leftOut: string[];
}

const ICONS: Record<DocKind, typeof FileText> = {
  summary: FileText,
  deck: Presentation,
  plan: FileText,
  canvas: LayoutGrid,
  financials: FileSpreadsheet,
};

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

const pillarName = (id: PillarId) => PILLARS.find((p) => p.id === id)?.name ?? id;

export function PitchDocsPanel({
  startupId,
  progress,
  initialDocs,
  ai,
}: {
  startupId: string;
  progress: Record<PillarId, GoalProgress>;
  initialDocs: DocMetaView[];
  ai: { ok: boolean; reason?: string };
}) {
  const router = useRouter();
  const [docs, setDocs] = useState<Partial<Record<DocKind, DocMetaView>>>(() =>
    Object.fromEntries(initialDocs.map((d) => [d.kind, d])),
  );
  const [busy, setBusy] = useState<DocKind[]>([]);
  const [asking, setAsking] = useState<DocKind[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gapsFor = (kinds: DocKind[]) =>
    [...new Set(kinds.flatMap((k) => DOC_KIND_INFO[k].pillars))].filter(
      (p) => progress[p].state !== "complete",
    );

  async function generate(kinds: DocKind[], aiFill: boolean) {
    setAsking(null);
    setError(null);
    setBusy(kinds);
    try {
      const res = await fetch(`/api/startups/${startupId}/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kinds, aiFill }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        docs?: DocMetaView[];
        error?: string;
      };
      if (!res.ok || !body.docs) throw new Error(body.error ?? "Couldn't make the documents.");
      setDocs((cur) => ({ ...cur, ...Object.fromEntries(body.docs!.map((d) => [d.kind, d])) }));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy([]);
    }
  }

  function start(kinds: DocKind[]) {
    if (gapsFor(kinds).length > 0) setAsking(kinds);
    else void generate(kinds, false);
  }

  const generatedCount = DOC_KINDS.filter((k) => docs[k]).length;
  const working = busy.length > 0;

  return (
    <div className="min-w-0 space-y-5 lg:col-span-2" data-testid="pitch-docs">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="min-w-0">
          <h2 className="font-semibold">Make your pitch documents</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Generate any time. Each document uses only the steps you&apos;ve worked on; steps with
            nothing in them are left out. {generatedCount} of {DOC_KINDS.length} generated.
          </p>
        </div>
        <Button onClick={() => start([...DOC_KINDS])} disabled={working} data-testid="generate-all">
          {working && busy.length === DOC_KINDS.length ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Wand2 aria-hidden />
          )}
          Generate all
        </Button>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {DOC_KINDS.map((kind) => {
          const info = DOC_KIND_INFO[kind];
          const meta = docs[kind];
          const Icon = ICONS[kind];
          const isBusy = busy.includes(kind);
          return (
            <li
              key={kind}
              className="rounded-xl border border-border bg-card p-4 sm:p-5"
              data-testid={`doc-${kind}`}
            >
              <div className="flex flex-wrap items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-founder-soft text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="flex flex-wrap items-center gap-2 font-semibold">
                    {info.title}
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {info.format}
                    </span>
                    {meta?.aiFilled && (
                      <span className="inline-flex items-center gap-1 rounded bg-synthetic-soft px-1.5 py-0.5 text-[11px] font-semibold text-synthetic">
                        <Sparkles className="size-3" aria-hidden /> Includes AI predictions
                      </span>
                    )}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{info.description}</p>
                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {info.pillars.map((p) => (
                      <li key={p} className="inline-flex items-center gap-1">
                        <ProgressIcon state={progress[p].state} className="size-3" />
                        {pillarName(p)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs" data-testid={`doc-${kind}-status`}>
                    {meta ? (
                      <span className="text-actual">
                        Generated {when(meta.generatedAt)} · {meta.sections}{" "}
                        {meta.sections === 1 ? "step" : "steps"}
                        {meta.leftOut.length > 0 && (
                          <span className="text-muted-foreground">
                            {" "}
                            · left out: {meta.leftOut.join(", ")}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not generated yet</span>
                    )}
                  </p>
                </div>
                <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    onClick={() => start([kind])}
                    disabled={working}
                    data-testid={`generate-${kind}`}
                  >
                    {isBusy ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : meta ? (
                      <RefreshCw aria-hidden />
                    ) : (
                      <Wand2 aria-hidden />
                    )}
                    {meta ? "Generate again" : "Generate"}
                  </Button>
                  {meta ? (
                    <a
                      href={`/api/startups/${startupId}/docs/${kind}?v=${encodeURIComponent(meta.generatedAt)}`}
                      download
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:flex-none"
                      data-testid={`download-${kind}`}
                    >
                      <Download className="size-4" aria-hidden /> Download
                    </a>
                  ) : (
                    <Button
                      disabled
                      className="flex-1 sm:flex-none"
                      title="Generate it first"
                      data-testid={`download-${kind}`}
                    >
                      <Download aria-hidden /> Download
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <StepNav />

      {asking && (
        <GapDialog
          kinds={asking}
          gaps={gapsFor(asking)}
          progress={progress}
          ai={ai}
          onCancel={() => setAsking(null)}
          onChoose={(aiFill) => void generate(asking, aiFill)}
        />
      )}
    </div>
  );
}

function GapDialog({
  kinds,
  gaps,
  progress,
  ai,
  onCancel,
  onChoose,
}: {
  kinds: DocKind[];
  gaps: PillarId[];
  progress: Record<PillarId, GoalProgress>;
  ai: { ok: boolean; reason?: string };
  onCancel: () => void;
  onChoose: (aiFill: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("button[data-autofocus]")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const onlyNumbers = kinds.length === 1 && kinds[0] === "financials";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onCancel}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gap-title"
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid="gap-dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="gap-title" className="text-lg font-semibold">
            Some steps aren&apos;t complete
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            aria-label="Cancel"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {kinds.length === 1 && kinds[0]
            ? `The ${DOC_KIND_INFO[kinds[0]].title} uses these steps, and they still have open goals:`
            : "These documents use steps that still have open goals:"}
        </p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {gaps.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <ProgressIcon state={progress[p].state} />
              <span className="flex-1">{pillarName(p)}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {progress[p].met}/{progress[p].total} goals
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            disabled={!ai.ok || onlyNumbers}
            onClick={() => onChoose(true)}
            className={cn(
              "w-full rounded-xl border border-dashed p-3 text-left transition-colors",
              ai.ok && !onlyNumbers
                ? "border-synthetic bg-synthetic-soft/60 hover:bg-synthetic-soft"
                : "cursor-not-allowed border-border opacity-70",
            )}
            data-testid="gap-ai"
          >
            <span className="flex items-center gap-2 font-semibold text-synthetic">
              <Sparkles className="size-4" aria-hidden /> Fill the gaps with AI predictions
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {onlyNumbers
                ? "AI doesn't predict numbers, so the Financial model always uses only your work."
                : ai.ok
                  ? "A complete document. AI's best guesses are marked as predictions, never as your work. AI doesn't predict numbers."
                  : "Not available yet: AI predictions are switched on once an admin connects an AI model."}
            </span>
          </button>
          <button
            type="button"
            data-autofocus
            onClick={() => onChoose(false)}
            className="w-full rounded-xl border border-border p-3 text-left transition-colors hover:bg-accent"
            data-testid="gap-own"
          >
            <span className="font-semibold">Use only what I&apos;ve completed</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Steps with nothing in them are left out; open goals are listed as still open.
            </span>
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
