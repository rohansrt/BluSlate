"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, CircleAlert, KeyRound, Loader2 } from "lucide-react";
import { Badge, Button, Card, Input, Label, cn } from "@bluslate/ui";
import { createModel, testDraftConnection, type ActionState } from "@/lib/admin-actions";

export interface CatalogEntry {
  modelId: string;
  displayName: string;
  suggestedTier: "fast" | "standard" | "top";
  summary: string;
  input: number;
  output: number;
  cacheRead: number;
  added: boolean;
}

const TIER_LABEL = { fast: "Fast", standard: "Standard", top: "Top" } as const;

/**
 * "Add a model", in five steps on one page: provider → model → API key →
 * prices → where to use it. Test the connection (free) before saving.
 */
export function AddModelForm({
  catalog,
  keyStatus,
  defaultTiersTaken,
}: {
  catalog: CatalogEntry[];
  /** Whether ANTHROPIC_API_KEY is set on the server (never the key itself). */
  keyStatus: Record<string, boolean>;
  defaultTiersTaken: string[];
}) {
  const first = catalog.find((c) => !c.added) ?? null;
  const [choice, setChoice] = useState<string>(first?.modelId ?? "other");
  const picked = catalog.find((c) => c.modelId === choice) ?? null;
  const [customId, setCustomId] = useState("");
  const [credentialEnv, setCredentialEnv] = useState("ANTHROPIC_API_KEY");
  const [testState, testAction, testing] = useActionState<ActionState, FormData>(
    testDraftConnection,
    {},
  );
  const [saveState, saveAction, saving] = useActionState<ActionState, FormData>(createModel, {});
  const suggested = picked?.suggestedTier ?? "standard";
  const keyKnown = credentialEnv in keyStatus;

  return (
    <form action={saveAction} className="space-y-6" data-testid="add-model-form">
      <Step n={1} title="Provider">
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-primary bg-founder-soft p-3 text-sm font-semibold">
            <input
              type="radio"
              name="provider"
              value="anthropic"
              defaultChecked
              className="accent-[var(--founder)]"
            />
            Anthropic (Claude)
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
            More providers later
          </div>
        </div>
      </Step>

      <Step n={2} title="Model">
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Choose a model</legend>
          {catalog.map((c) => (
            <label
              key={c.modelId}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                choice === c.modelId
                  ? "border-primary bg-founder-soft"
                  : "border-border hover:bg-accent",
                c.added && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name="catalogChoice"
                value={c.modelId}
                checked={choice === c.modelId}
                disabled={c.added}
                onChange={() => setChoice(c.modelId)}
                className="mt-1 accent-[var(--founder)]"
              />
              <span className="text-sm">
                <span className="flex flex-wrap items-center gap-2 font-semibold">
                  {c.displayName}
                  <Badge variant="neutral">{TIER_LABEL[c.suggestedTier]}</Badge>
                  {c.added && <Badge variant="actual">Added</Badge>}
                </span>
                <span className="block text-muted-foreground">{c.summary}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  ${c.input} in · ${c.output} out per million tokens
                </span>
              </span>
            </label>
          ))}
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3",
              choice === "other"
                ? "border-primary bg-founder-soft"
                : "border-border hover:bg-accent",
            )}
          >
            <input
              type="radio"
              name="catalogChoice"
              value="other"
              checked={choice === "other"}
              onChange={() => setChoice("other")}
              className="mt-1 accent-[var(--founder)]"
            />
            <span className="w-full text-sm">
              <span className="font-semibold">Another model ID</span>
              <Input
                aria-label="Model ID"
                className="mt-2 h-9 font-mono text-sm"
                placeholder="claude-…"
                value={customId}
                onChange={(e) => setCustomId(e.target.value.trim())}
                onFocus={() => setChoice("other")}
              />
            </span>
          </label>
        </fieldset>
        <input type="hidden" name="modelId" value={picked ? picked.modelId : customId} />
        <div className="mt-4 max-w-sm space-y-2">
          <Label htmlFor="displayName">Name shown in the dashboard</Label>
          <Input
            id="displayName"
            name="displayName"
            key={`n-${choice}`}
            defaultValue={picked?.displayName ?? customId}
            required
          />
        </div>
      </Step>

      <Step n={3} title="API key">
        <p className="text-sm text-muted-foreground">
          Keys are never stored in BluSlate. Put the key in the server&apos;s environment (for local
          work, <code>apps/web/.env.local</code>) and enter the variable&apos;s name here.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="credentialEnv">Environment variable</Label>
            <Input
              id="credentialEnv"
              name="credentialEnv"
              className="font-mono"
              value={credentialEnv}
              onChange={(e) => setCredentialEnv(e.target.value.trim().toUpperCase())}
            />
          </div>
          <p
            className={cn(
              "flex items-center gap-1.5 pb-2.5 text-sm font-medium",
              keyKnown && keyStatus[credentialEnv] ? "text-actual" : "text-review",
            )}
            data-testid="key-status"
          >
            <KeyRound className="size-4" aria-hidden />
            {keyKnown
              ? keyStatus[credentialEnv]
                ? "Key found on the server"
                : "Not set yet"
              : "Checked when you test"}
          </p>
        </div>
      </Step>

      <Step n={4} title="Prices (USD per million tokens)">
        <p className="text-sm text-muted-foreground">
          Used for cost tracking and daily caps. Filled in for known models.
        </p>
        <div className="mt-3 grid max-w-xl gap-3 sm:grid-cols-3" key={`p-${choice}`}>
          {[
            ["inputPerMTok", "Input", picked?.input],
            ["outputPerMTok", "Output", picked?.output],
            ["cacheReadPerMTok", "Cache read", picked?.cacheRead],
          ].map(([name, label, value]) => (
            <div key={name as string} className="space-y-2">
              <Label htmlFor={name as string}>{label as string}</Label>
              <Input
                id={name as string}
                name={name as string}
                type="number"
                step="0.001"
                min="0"
                defaultValue={(value as number | undefined) ?? ""}
                required
              />
            </div>
          ))}
        </div>
      </Step>

      <Step n={5} title="Where to use it">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="assignTier"
            value={suggested}
            key={`t-${choice}`}
            defaultChecked={!defaultTiersTaken.includes(suggested)}
            className="size-4 accent-[var(--founder)]"
          />
          Make it the default <strong>{TIER_LABEL[suggested]}</strong> model for every pillar
          {defaultTiersTaken.includes(suggested) && (
            <span className="text-muted-foreground"> (replaces the current one)</span>
          )}
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          You can fine-tune per pillar on the models page.
        </p>
      </Step>

      {(testState.message || saveState.message) && (
        <p
          role="status"
          className={cn(
            "flex items-start gap-2 rounded-xl px-4 py-3 text-sm",
            (saveState.message ? saveState.ok : testState.ok)
              ? "bg-actual-soft text-actual"
              : "bg-review-soft text-review",
          )}
          data-testid="model-test-result"
        >
          {(saveState.message ? saveState.ok : testState.ok) ? (
            <CheckCircle2 className="mt-0.5 size-4" aria-hidden />
          ) : (
            <CircleAlert className="mt-0.5 size-4" aria-hidden />
          )}
          {saveState.message ?? testState.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          formAction={testAction}
          variant="outline"
          disabled={testing || saving}
        >
          {testing && <Loader2 className="animate-spin" aria-hidden />} Test connection
        </Button>
        <Button type="submit" disabled={testing || saving}>
          {saving && <Loader2 className="animate-spin" aria-hidden />} Add model
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Testing uses Anthropic&apos;s free Models API, so it doesn&apos;t spend tokens. You can add
        a model before its key is set; AI features start using it once the key is there.
      </p>
    </form>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {n}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </Card>
  );
}
