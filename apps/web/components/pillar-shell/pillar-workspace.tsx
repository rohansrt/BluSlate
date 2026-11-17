"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import type { EvidenceLabel, PillarStarter } from "@bluslate/contracts";
import {
  AiRailPanel,
  Button,
  Card,
  DecisionCard,
  InputModeSwitch,
  Label,
  PublishPanel,
  ReviewBanner,
  Textarea,
  cn,
  type AiRailState,
  type InputMode,
  type PublishChange,
} from "@bluslate/ui";
import type { StarterState } from "@/lib/starter-state";

/**
 * The centre and right of the standard pillar layout (§6.1): the pillar's first
 * question with the three input modes, the Publish panel, and the AI rail.
 * The pillar's own screen (its placeholder until its Build step) renders below.
 */

interface Preview {
  isNew: boolean;
  fromVersion: number | null;
  changes: PublishChange[];
  affected: { name: string; pillar: string }[];
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function PillarWorkspace({
  startupId,
  pillar,
  pillarName,
  starter,
  state,
  children,
}: {
  startupId: string;
  pillar: string;
  pillarName: string;
  starter: PillarStarter;
  state: StarterState;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const base = `/api/startups/${startupId}/pillars/${pillar}`;
  const [mode, setMode] = useState<InputMode>("decide");
  const [value, setValue] = useState(state.draft?.value ?? "");
  const [editing, setEditing] = useState(!state.current || Boolean(state.draft));
  const [draftId, setDraftId] = useState<string | null>(state.draft?.id ?? null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<null | "save" | "publish">(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rail, setRail] = useState<AiRailState>({ kind: "idle" });

  async function call<T>(url: string, init: RequestInit): Promise<T> {
    const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
    const body = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) throw new Error(body.error ?? "Something went wrong. Please try again.");
    return body;
  }

  async function saveDraft(): Promise<string | null> {
    setBusy("save");
    setError(null);
    setNotice(null);
    try {
      const { draftId: id } = await call<{ draftId: string }>(`${base}/draft`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      });
      setDraftId(id);
      return id;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function review() {
    const id = await saveDraft();
    if (!id) return;
    try {
      setPreview(
        await call<Preview>(`${base}/preview`, {
          method: "POST",
          body: JSON.stringify({ draftId: id }),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function approve() {
    if (!draftId) return;
    setBusy("publish");
    setError(null);
    try {
      const r = await call<{ version: number }>(`${base}/publish`, {
        method: "POST",
        body: JSON.stringify({ draftId }),
      });
      setPreview(null);
      setDraftId(null);
      setEditing(false);
      setValue("");
      setNotice(
        r.version === 1
          ? "Published. Other steps can now use it."
          : `Published version ${r.version}.`,
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function discard() {
    if (draftId) {
      await fetch(`${base}/draft?draftId=${encodeURIComponent(draftId)}`, {
        method: "DELETE",
      }).catch(() => {});
    }
    setPreview(null);
    setDraftId(null);
    setValue("");
    setEditing(!state.current);
    router.refresh();
  }

  async function chooseMode(next: InputMode) {
    setMode(next);
    if (next !== "guide") return;
    setRail({ kind: "loading" });
    try {
      const res = await fetch(`${base}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "guide", answerSoFar: value || undefined }),
      });
      const body = (await res.json()) as AiRailState & { error?: string };
      setRail(
        res.ok
          ? body
          : { kind: "unavailable", message: body.error ?? "The AI helper couldn't be reached." },
      );
    } catch {
      setRail({ kind: "unavailable", message: "The AI helper couldn't be reached." });
    }
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 lg:col-span-2 lg:grid-cols-[minmax(0,1fr)_260px]">
      <Card className="min-w-0 p-0">
        <div
          role="tablist"
          aria-label={`${pillarName} sections`}
          className="flex gap-1 border-b border-border px-4"
        >
          <Tab selected>Work</Tab>
          <Tab>Evidence</Tab>
          <Tab>Publish</Tab>
        </div>
        <div role="tabpanel" aria-label="Work" className="space-y-8 p-5 sm:p-6">
          <section aria-labelledby="starter-question" className="space-y-4" data-testid="starter">
            <div>
              <h2 id="starter-question" className="text-lg font-semibold">
                {starter.question}
              </h2>
              <p className="text-sm text-muted-foreground">{starter.hint}</p>
            </div>

            {state.current && (
              <>
                {state.current.outdated && (
                  <ReviewBanner>
                    <strong>May be outdated.</strong> Something it was built from has changed. Take
                    a look and publish an update if needed.
                  </ReviewBanner>
                )}
                <DecisionCard
                  label={state.current.label as EvidenceLabel}
                  meta={`Version ${state.current.version} · approved ${dateFmt.format(new Date(state.current.approvedAt))}`}
                >
                  <p data-testid="current-value">{state.current.value}</p>
                </DecisionCard>
                {!editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(true);
                      setValue(state.current?.value ?? "");
                    }}
                  >
                    Change it
                  </Button>
                )}
              </>
            )}

            {editing && !preview && (
              <div className="space-y-4">
                <InputModeSwitch
                  value={mode}
                  onChange={(m) => void chooseMode(m)}
                  unavailable={{ research: "Arrives when this step is built" }}
                />
                <div className="space-y-2">
                  <Label htmlFor="starter-answer">
                    {mode === "guide"
                      ? "Your answer, once you've thought it through"
                      : "Your answer"}
                  </Label>
                  <Textarea
                    id="starter-answer"
                    rows={3}
                    maxLength={starter.maxLength}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={starter.placeholder}
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {value.length}/{starter.maxLength}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void review()} disabled={!value.trim() || busy !== null}>
                    {busy === "save" ? <Loader2 className="animate-spin" aria-hidden /> : null}
                    Review and publish
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void saveDraft()}
                    disabled={!value.trim() || busy !== null}
                  >
                    <Save aria-hidden /> Save draft
                  </Button>
                  {(state.current || draftId) && (
                    <Button variant="ghost" onClick={() => void discard()} disabled={busy !== null}>
                      Cancel
                    </Button>
                  )}
                </div>
                {draftId && !error && (
                  <p className="text-xs text-muted-foreground" role="status">
                    Draft saved. Nothing changes for other steps until you publish.
                  </p>
                )}
              </div>
            )}

            {preview && (
              <PublishPanel
                entityName={starter.entityType}
                isNew={preview.isNew}
                fromVersion={preview.fromVersion}
                changes={preview.changes}
                affected={preview.affected}
                busy={busy === "publish"}
                error={error}
                onApprove={() => void approve()}
                onEdit={() => setPreview(null)}
                onReject={() => void discard()}
              />
            )}

            {error && !preview && (
              <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-lg bg-actual-soft px-3 py-2 text-sm text-actual">
                {notice}
              </p>
            )}
          </section>

          <div className="border-t border-border pt-6">{children}</div>
        </div>
      </Card>

      <AiRailPanel state={rail} />
    </div>
  );
}

function Tab({ selected = false, children }: { selected?: boolean; children: React.ReactNode }) {
  return (
    <span
      role="tab"
      aria-selected={selected}
      aria-disabled={!selected}
      title={selected ? undefined : "Coming soon"}
      className={cn(
        "-mb-px border-b-2 px-3 py-3 text-sm font-semibold",
        selected
          ? "border-primary text-primary"
          : "cursor-not-allowed border-transparent text-muted-foreground/70",
      )}
    >
      {children}
    </span>
  );
}
