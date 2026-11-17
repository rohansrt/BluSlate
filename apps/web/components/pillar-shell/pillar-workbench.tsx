"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import type { WorkspaceContext } from "@bluslate/contracts";
import { AiPlaceholder, Button, EvidenceBadge, GoalsPanel, ReportOut, cn } from "@bluslate/ui";
import { PILLAR_SCREENS } from "@/lib/pillar-screens";
import { PILLAR_WORKSPACES } from "@/lib/pillar-workspaces";
import type { PillarId } from "@/lib/pillars";

/**
 * The centre and right of every pillar page (decision 0006). The centre is the
 * pillar's own screen, ending with its Report out. The right is the live Goals
 * column, publishing, and the AI helpers (placeholders until AI is switched on).
 * Work is autosaved; nothing reaches other pillars until the founder publishes.
 */

type SaveState = "saved" | "saving" | "dirty" | "error";

export function PillarWorkbench({
  startupId,
  pillar,
  pillarName,
  initialState,
  ctx,
  everPublished,
}: {
  startupId: string;
  pillar: PillarId;
  pillarName: string;
  initialState: unknown;
  ctx: WorkspaceContext;
  everPublished: boolean;
}) {
  const router = useRouter();
  const def = PILLAR_WORKSPACES[pillar];
  const Screen = PILLAR_SCREENS[pillar];
  const [state, setState] = useState<unknown>(initialState);
  const [save, setSave] = useState<SaveState>("saved");
  const [reviewing, setReviewing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  const base = `/api/startups/${startupId}/pillars/${pillar}/workspace`;

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setSave("saving");
    try {
      const res = await fetch(base, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: latest.current }),
      });
      setSave(res.ok ? "saved" : "error");
      return res.ok;
    } catch {
      setSave("error");
      return false;
    }
  }, [base]);

  const update = useCallback(
    (fn: (s: unknown) => unknown) => {
      setState((s: unknown) => {
        const next = fn(s);
        latest.current = next;
        return next;
      });
      setSave("dirty");
      setNotice(null);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 800);
    },
    [flush],
  );

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (timer.current) {
        void flush();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [flush]);

  const goals = useMemo(() => def.goals(state, ctx), [def, state, ctx]);
  const report = useMemo(() => def.report(state, ctx), [def, state, ctx]);
  const entities = useMemo(() => def.entities(state, ctx), [def, state, ctx]);

  async function approve() {
    setPublishing(true);
    setError(null);
    try {
      if (!(await flush())) throw new Error("Couldn't save your latest answers. Try again.");
      const res = await fetch(`${base}/publish`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        changed?: number;
        unchanged?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? "Couldn't publish. Try again.");
      setReviewing(false);
      setNotice(
        body.changed
          ? `Published ${body.changed} item${body.changed === 1 ? "" : "s"}. Other steps can now use them.`
          : "Nothing changed since your last publish.",
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 lg:col-span-2 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0 space-y-5" data-testid="workbench">
        <div className="flex items-center justify-end text-xs text-muted-foreground" role="status">
          {save === "saving" && (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" aria-hidden /> Saving…
            </span>
          )}
          {save === "saved" && "All changes saved"}
          {save === "dirty" && "Unsaved changes"}
          {save === "error" && (
            <span className="text-danger">Couldn&apos;t save. Your answers are still here.</span>
          )}
        </div>
        <Screen state={state} update={update} ctx={ctx} />
        <ReportOut title={pillarName} block={report} />
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
        <GoalsPanel goals={goals} />

        <section className="rounded-xl border border-border bg-card p-4" aria-label="Publish">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Publish
          </h2>
          {!reviewing ? (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                {entities.length === 0
                  ? "Nothing to publish yet."
                  : `${entities.length} item${entities.length === 1 ? "" : "s"} ready. Publishing lets other steps use them.`}
              </p>
              <Button
                className="w-full"
                disabled={entities.length === 0}
                onClick={() => {
                  setReviewing(true);
                  setError(null);
                }}
              >
                <Send aria-hidden /> Review and publish
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">You&apos;re approving:</p>
              <ul className="max-h-60 space-y-1.5 overflow-y-auto text-sm">
                {entities.map((e) => (
                  <li key={e.key} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate" title={e.title}>
                      <span className="text-muted-foreground">{e.type}:</span> {e.title}
                    </span>
                    <EvidenceBadge label={e.evidenceLabel} />
                  </li>
                ))}
              </ul>
              {everPublished && (
                <p className="rounded-lg bg-review-soft px-3 py-2 text-xs text-review">
                  Changes create new versions. Steps built on the old ones are marked &quot;May be
                  outdated&quot;.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void approve()} disabled={publishing}>
                  {publishing ? <Loader2 className="animate-spin" aria-hidden /> : null}
                  Approve
                </Button>
                <Button variant="ghost" onClick={() => setReviewing(false)} disabled={publishing}>
                  Not yet
                </Button>
              </div>
            </div>
          )}
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className={cn(
                "mt-3 flex items-start gap-1.5 rounded-lg bg-actual-soft px-3 py-2 text-sm text-actual",
              )}
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden /> {notice}
            </p>
          )}
        </section>

        <section
          className="space-y-2 rounded-xl border border-border bg-card p-4"
          aria-label="AI helpers"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            AI helpers
          </h2>
          {def.aiHelpers.map((h) => (
            <AiPlaceholder key={h} title={h} />
          ))}
        </section>
      </aside>
    </div>
  );
}
