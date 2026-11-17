"use client";

import { ARCHETYPES, type PillarScreenProps } from "@bluslate/contracts";
import {
  AiPlaceholder,
  Field,
  FromUpstream,
  NumberField,
  RowList,
  Section,
  Segmented,
  Select,
  TagInput,
  TextField,
  newRowId,
  cn,
} from "@bluslate/ui";
import {
  ARCHETYPE_LABEL,
  BILLING,
  CONFIDENCE,
  IMPACT,
  MVP_TYPES,
  REVENUE_TYPES,
  mvp,
  rankedFeatures,
  rice,
  valueStatement,
  type BuildState,
} from "../src/workspace";

/** Product Design v1: needs → value proposition → features and MVP line → business model. */
export function BuildScreen({ state: s, update, ctx }: PillarScreenProps<BuildState>) {
  const set = (patch: Partial<BuildState>) => update((x) => ({ ...x, ...patch }));
  const m = mvp(s);
  const ranked = rankedFeatures(s);
  const vs = valueStatement(s);
  const seg = ctx.upstream.Segment?.map((x) => String(x.name)).join(", ");
  const bmc: [string, string][] = [
    ["Customer segments", s.forWho || seg || ""],
    ["Value proposition", vs],
    ["Key activities", m.inScope.map((f) => f.name).join(", ")],
    [
      "Revenue streams",
      [REVENUE_TYPES.find((r) => r.value === s.revenueType)?.label, s.billing]
        .filter(Boolean)
        .join(", "),
    ],
    ["Channels", "From Go-to-Market Plan"],
    ["Cost structure", "From Operations Setup"],
  ];

  return (
    <div className="space-y-5">
      <Section step={1} title="Needs to cover" hint="Every feature should serve one of these.">
        {ctx.upstream.Need?.length ? (
          <FromUpstream pillar="Customer Discovery">
            {ctx.upstream.Need.length} needs loaded. Edit them here for this design.
          </FromUpstream>
        ) : null}
        <RowList
          items={s.needs}
          onChange={(needs) => set({ needs })}
          newItem={() => ({ id: newRowId(), statement: "" })}
          addLabel="Add a need"
          max={12}
          renderItem={(n, patch) => (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  m.covered.includes(n) ? "bg-actual" : "bg-review",
                )}
                title={m.covered.includes(n) ? "Covered by the MVP" : "Not covered yet"}
              />
              <TextField
                label="Need"
                value={n.statement}
                maxLength={160}
                onChange={(statement) => patch({ statement })}
                placeholder="e.g. Get to class on time"
              />
            </div>
          )}
        />
      </Section>

      <Section
        step={2}
        title="Value proposition"
        hint="Jobs they're trying to get done, pains in the way, gains they'd love."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Jobs">
            <TagInput
              label="Jobs"
              value={s.jobs}
              onChange={(jobs) => set({ jobs })}
              placeholder="e.g. Get to class"
            />
          </Field>
          <Field label="Pains">
            <TagInput
              label="Pains"
              value={s.pains}
              onChange={(pains) => set({ pains })}
              placeholder="e.g. Late buses"
            />
          </Field>
          <Field label="Gains">
            <TagInput
              label="Gains"
              value={s.gains}
              onChange={(gains) => set({ gains })}
              placeholder="e.g. Extra sleep"
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="For">
            <TextField
              label="For who"
              value={s.forWho}
              maxLength={140}
              onChange={(forWho) => set({ forWho })}
            />
          </Field>
          <Field label="We offer a…">
            <TextField
              label="Category"
              value={s.category}
              maxLength={80}
              onChange={(category) => set({ category })}
              placeholder="e.g. e-bike rental"
            />
          </Field>
          <Field label="That…">
            <TextField
              label="Benefit"
              value={s.benefit}
              maxLength={160}
              onChange={(benefit) => set({ benefit })}
              placeholder="e.g. gets them to class in 15 minutes for less than an auto"
            />
          </Field>
          <Field label="Unlike…">
            <TextField
              label="Unlike"
              value={s.unlike}
              maxLength={80}
              onChange={(unlike) => set({ unlike })}
              placeholder="e.g. ride-hailing"
            />
          </Field>
        </div>
        <p
          className={cn(
            "rounded-lg border-2 border-dashed border-founder/40 bg-founder-soft/40 p-3",
            !vs && "text-muted-foreground",
          )}
          data-testid="value-statement"
        >
          {vs || "Your value proposition builds itself as you fill in For and That."}
        </p>
      </Section>

      <Section
        step={3}
        title="Features and the MVP line"
        hint="Score with RICE, then tick what's in the first version. Keep it small."
      >
        <Field label="People building it">
          <div className="max-w-40">
            <NumberField
              label="Team size"
              suffix="people"
              value={s.teamSize}
              min={0.5}
              step={0.5}
              onChange={(teamSize) => set({ teamSize })}
            />
          </div>
        </Field>
        <RowList
          items={s.features}
          onChange={(features) => set({ features })}
          newItem={() => ({
            id: newRowId(),
            name: "",
            needId: "",
            reach: null,
            impact: "1" as const,
            confidence: "50" as const,
            effort: null,
            inScope: false,
          })}
          addLabel="Add a feature"
          max={20}
          renderItem={(f, patch) => (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <TextField
                    label="Feature"
                    value={f.name}
                    maxLength={80}
                    onChange={(name) => patch({ name })}
                    placeholder="e.g. Unlock a bike with a QR code"
                  />
                </div>
                <span className="text-lg font-bold tabular-nums" title="RICE score">
                  {rice(f) ?? "—"}
                </span>
                <label
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm",
                    f.inScope
                      ? "border-founder bg-founder text-founder-foreground"
                      : "border-border",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={f.inScope}
                    onChange={(e) => patch({ inScope: e.target.checked })}
                  />
                  {f.inScope ? "✓ In MVP" : "Add to MVP"}
                </label>
              </div>
              <Select
                aria-label="Serves need"
                value={f.needId}
                onChange={(e) => patch({ needId: e.target.value })}
              >
                <option value="">Serves which need?</option>
                {s.needs.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.statement || "Untitled need"}
                  </option>
                ))}
              </Select>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Reach (people per quarter)">
                  <NumberField
                    label="Reach"
                    value={f.reach}
                    onChange={(reach) => patch({ reach })}
                  />
                </Field>
                <Field label="Effort">
                  <NumberField
                    label="Effort"
                    suffix="person-weeks"
                    value={f.effort}
                    onChange={(effort) => patch({ effort })}
                  />
                </Field>
              </div>
              <Field label="Impact">
                <Segmented
                  label="Impact"
                  options={IMPACT}
                  value={f.impact}
                  onChange={(impact) => impact && patch({ impact })}
                />
              </Field>
              <Field label="Confidence">
                <Segmented
                  label="Confidence"
                  options={CONFIDENCE}
                  value={f.confidence}
                  onChange={(confidence) => confidence && patch({ confidence })}
                />
              </Field>
            </div>
          )}
        />
        {ranked.length > 0 && (
          <ol className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm" data-testid="priority-board">
            {ranked.map(({ f, score }, i) => (
              <li
                key={f.id}
                className={cn(
                  "flex justify-between gap-2",
                  f.inScope ? "font-semibold" : "text-muted-foreground",
                )}
              >
                <span>
                  {i + 1}. {f.name || "Untitled"} {f.inScope && "· MVP"}
                </span>
                <span className="tabular-nums">{score ?? "—"}</span>
              </li>
            ))}
            <li className="pt-1 text-xs text-muted-foreground">
              MVP: {m.inScope.length} features · {m.effort} person-weeks
              {m.weeks !== null ? ` · about ${m.weeks} weeks` : ""}
            </li>
          </ol>
        )}
        <AiPlaceholder title="Suggest features for uncovered needs" />
      </Section>

      <Section
        step={4}
        title="Business model"
        hint="What kind of business, what the first version is, and how it earns."
      >
        <Field label="Business type">
          <Segmented
            label="Archetype"
            options={ARCHETYPES.map((a) => ({ value: a, label: ARCHETYPE_LABEL[a] }))}
            value={s.archetype}
            onChange={(archetype) => set({ archetype })}
          />
        </Field>
        <Field label="First version">
          <Segmented
            label="MVP type"
            options={MVP_TYPES}
            value={s.mvpType}
            onChange={(mvpType) => set({ mvpType })}
          />
        </Field>
        <Field label="How it earns">
          <Segmented
            label="Revenue model"
            options={REVENUE_TYPES}
            value={s.revenueType}
            onChange={(revenueType) => set({ revenueType })}
          />
        </Field>
        <Field label="Billed">
          <Segmented
            label="Billing"
            options={BILLING}
            value={s.billing}
            onChange={(billing) => set({ billing })}
          />
        </Field>
        <div className="grid gap-2 sm:grid-cols-3" data-testid="bmc">
          {bmc.map(([k, v]) => (
            <div key={k} className="min-h-20 rounded-lg border border-border p-2 text-xs">
              <div className="font-semibold uppercase tracking-wide text-muted-foreground">{k}</div>
              <div className={cn("mt-1", !v && "text-muted-foreground/60")}>{v || "—"}</div>
            </div>
          ))}
        </div>
        <AiPlaceholder
          title="Generate an MVP mockup"
          detail="A clickable preview, sandboxed, for testing with personas."
        />
      </Section>
    </div>
  );
}
