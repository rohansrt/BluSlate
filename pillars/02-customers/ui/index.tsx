"use client";

import { currencySymbol, type PillarScreenProps } from "@bluslate/contracts";
import {
  AiPlaceholder,
  ChipSelect,
  Dots,
  EvidenceBadge,
  Field,
  FromUpstream,
  NumberField,
  Quadrant,
  RowList,
  Section,
  Segmented,
  Select,
  Stat,
  TextField,
  newRowId,
  cn,
} from "@bluslate/ui";
import {
  CHANNELS,
  ROLES,
  TAGS,
  TAG_LABEL,
  beliefStatus,
  expectedReplies,
  needScore,
  type CustomersState,
  outreachChannels,
} from "../src/workspace";

const STATUS_STYLE = {
  supported: "bg-actual-soft text-actual",
  against: "bg-danger-soft text-danger",
  unclear: "bg-muted text-muted-foreground",
} as const;

/** Customer Discovery v1: segments → outreach → interview log → needs → belief check. */
export function CustomersScreen({ state: s, update, ctx }: PillarScreenProps<CustomersState>) {
  const set = (patch: Partial<CustomersState>) => update((x) => ({ ...x, ...patch }));
  const cur = currencySymbol(ctx.startup.currency);
  const fromP1 = Boolean(ctx.upstream.Problem?.length);
  const replies = expectedReplies(s);

  return (
    <div className="space-y-5">
      <Section step={1} title="The problem you're checking" hint="Who you talk to depends on this.">
        {fromP1 ? (
          <FromUpstream pillar="Problem Discovery">{s.problem}</FromUpstream>
        ) : (
          <TextField
            label="Problem"
            value={s.problem}
            maxLength={600}
            onChange={(problem) => set({ problem })}
            placeholder="e.g. Students lose time and money getting to class"
          />
        )}
      </Section>

      <Section
        step={2}
        title="Who has it?"
        hint="2–5 segments. Separate who uses it from who pays."
      >
        <RowList
          items={s.segments}
          onChange={(segments) => set({ segments })}
          newItem={() => ({
            id: newRowId(),
            name: "",
            kind: "b2c" as const,
            roles: [],
            channels: [],
            wtpLow: null,
            wtpHigh: null,
          })}
          addLabel="Add a segment"
          max={5}
          empty="e.g. Students 3–8 km from campus · Parents who pay · Campus facilities office"
          renderItem={(g, patch) => (
            <div className="space-y-2">
              <TextField
                label="Segment"
                value={g.name}
                maxLength={80}
                onChange={(name) => patch({ name })}
                placeholder="Segment name"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Segmented
                  label="Type"
                  options={[
                    { value: "b2c", label: "People (B2C)" },
                    { value: "b2b", label: "Businesses (B2B)" },
                  ]}
                  value={g.kind}
                  onChange={(kind) => kind && patch({ kind })}
                />
              </div>
              <Field label="Their role">
                <ChipSelect
                  label="Roles"
                  options={ROLES}
                  value={g.roles}
                  onChange={(roles) => patch({ roles })}
                />
              </Field>
              <Field label="Where to find them">
                <ChipSelect
                  label="Channels"
                  options={CHANNELS}
                  value={g.channels}
                  onChange={(channels) => patch({ channels })}
                />
              </Field>
              <Field
                label="What might they pay per month?"
                hint="A guess until interviews show what they spend today."
              >
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    label="Low"
                    prefix={cur}
                    value={g.wtpLow}
                    onChange={(wtpLow) => patch({ wtpLow })}
                  />
                  <NumberField
                    label="High"
                    prefix={cur}
                    value={g.wtpHigh}
                    onChange={(wtpHigh) => patch({ wtpHigh })}
                  />
                </div>
              </Field>
            </div>
          )}
        />
      </Section>

      <Section
        step={3}
        title="Plan your outreach"
        hint="Nothing is sent from BluSlate. You contact people yourself."
      >
        <Field label="Channels" hint="Where you find each segment, from step 2.">
          <p className="text-sm" data-testid="outreach-channels">
            {outreachChannels(s).length
              ? outreachChannels(s).join(" · ")
              : "Pick “Where to find them” for a segment above."}
          </p>
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="People to contact">
            <NumberField
              label="Contacts"
              value={s.contacts}
              onChange={(contacts) => set({ contacts })}
            />
          </Field>
          <Field label="Expected reply rate">
            <NumberField
              label="Reply rate"
              suffix="%"
              max={100}
              value={s.replyRatePct}
              onChange={(replyRatePct) => set({ replyRatePct })}
            />
          </Field>
          <Stat
            label="Expected replies"
            value={replies === null ? null : String(replies)}
            evidence="ASSUMED"
          />
        </div>
        <AiPlaceholder
          title="Draft outreach messages"
          detail="Drafts would need your approval before you send anything."
        />
      </Section>

      <Section
        step={4}
        title="Interview log"
        hint="Real conversations only. Ask about past behaviour, not opinions about your idea."
        aside={<EvidenceBadge label="FIELD" />}
      >
        <RowList
          items={s.interviews}
          onChange={(interviews) => set({ interviews })}
          newItem={() => ({
            id: newRowId(),
            segmentId: s.segments[0]?.id ?? "",
            label: "",
            date: new Date().toISOString().slice(0, 10),
            painLevel: null,
            quote: "",
            tags: [],
          })}
          addLabel="Log an interview"
          max={60}
          empty="No interviews yet. Aim for 8 across at least 2 segments."
          renderItem={(i, patch) => (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-3">
                <TextField
                  label="Who (no full names)"
                  value={i.label}
                  maxLength={60}
                  onChange={(label) => patch({ label })}
                  placeholder="e.g. 2nd-year student, Kothrud"
                />
                <Select
                  aria-label="Segment"
                  value={i.segmentId}
                  onChange={(e) => patch({ segmentId: e.target.value })}
                >
                  <option value="">Segment…</option>
                  {s.segments.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name || "Untitled"}
                    </option>
                  ))}
                </Select>
                <input
                  type="date"
                  aria-label="Date"
                  value={i.date}
                  onChange={(e) => patch({ date: e.target.value })}
                  className="h-11 rounded-lg border border-input bg-card px-3"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                How much does the problem hurt them?
                <Dots
                  label="Pain level"
                  value={i.painLevel}
                  onChange={(painLevel) => patch({ painLevel })}
                />
              </div>
              <TextField
                label="Best quote"
                value={i.quote}
                maxLength={240}
                onChange={(quote) => patch({ quote })}
                placeholder="What they said, word for word"
              />
              <ChipSelect
                label="Tags"
                options={TAGS.map((t) => ({ value: t, label: TAG_LABEL[t] }))}
                value={i.tags}
                onChange={(tags) => patch({ tags })}
              />
            </div>
          )}
        />
        <AiPlaceholder
          title="Rehearse with AI personas"
          detail="Synthetic interviews will be labelled SYNTHETIC and never count as evidence."
        />
      </Section>

      <Section
        step={5}
        title="Needs"
        hint="What they need, how often, how badly, and how many real sources back it."
      >
        <RowList
          items={s.needs}
          onChange={(needs) => set({ needs })}
          newItem={() => ({
            id: newRowId(),
            statement: "",
            frequency: null,
            severity: null,
            sources: null,
          })}
          addLabel="Add a need"
          max={12}
          renderItem={(n, patch) => (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <TextField
                    label="Need"
                    value={n.statement}
                    maxLength={160}
                    onChange={(statement) => patch({ statement })}
                    placeholder="e.g. Reach class on time without paying for an auto"
                  />
                </div>
                <span className="text-lg font-bold tabular-nums" title="Need score">
                  {needScore(n) ?? "—"}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  Frequency
                  <Dots
                    label="Frequency"
                    value={n.frequency}
                    onChange={(frequency) => patch({ frequency })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  Severity
                  <Dots
                    label="Severity"
                    value={n.severity}
                    onChange={(severity) => patch({ severity })}
                  />
                </div>
                <NumberField
                  label="Real sources"
                  suffix="sources"
                  value={n.sources}
                  onChange={(sources) => patch({ sources })}
                />
              </div>
            </div>
          )}
        />
        {s.needs.some((n) => n.frequency !== null && n.severity !== null) && (
          <Quadrant
            xLabel="Frequency"
            yLabel="Severity"
            labels={["Rare but painful", "Must solve", "Ignore", "Frequent nuisance"]}
            points={s.needs
              .map((n, i) => ({ n, i }))
              .filter(({ n }) => n.frequency !== null && n.severity !== null)
              .map(({ n, i }) => ({
                id: n.id,
                x: n.frequency!,
                y: n.severity!,
                label: `N${i + 1}`,
              }))}
          />
        )}
      </Section>

      <Section
        step={6}
        title="Belief check"
        hint="How many conversations support or contradict each belief. Status is worked out, not chosen."
      >
        <RowList
          items={s.beliefs}
          onChange={(beliefs) => set({ beliefs })}
          newItem={() => ({ id: newRowId(), statement: "", support: null, against: null })}
          addLabel="Add a belief"
          max={12}
          empty={
            ctx.upstream.Hypothesis?.length
              ? undefined
              : "Beliefs from Problem Discovery appear here once published. Or add your own."
          }
          renderItem={(b, patch) => {
            const st = beliefStatus(b);
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <TextField
                      label="Belief"
                      value={b.statement}
                      maxLength={240}
                      onChange={(statement) => patch({ statement })}
                    />
                  </div>
                  <span
                    className={cn("rounded px-2 py-0.5 text-xs font-semibold", STATUS_STYLE[st])}
                  >
                    {st}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    label="Supporting"
                    suffix="for"
                    value={b.support}
                    onChange={(support) => patch({ support })}
                  />
                  <NumberField
                    label="Against"
                    suffix="against"
                    value={b.against}
                    onChange={(against) => patch({ against })}
                  />
                </div>
              </div>
            );
          }}
        />
      </Section>
    </div>
  );
}
