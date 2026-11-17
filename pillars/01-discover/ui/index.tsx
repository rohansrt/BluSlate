"use client";

import type { PillarScreenProps } from "@bluslate/contracts";
import {
  AiPlaceholder,
  Bars,
  Button,
  ChipSelect,
  Dots,
  EvidenceBadge,
  Field,
  Quadrant,
  RowList,
  Section,
  Segmented,
  TextField,
  newRowId,
  cn,
} from "@bluslate/ui";
import {
  ADVANTAGES,
  ALT_KINDS,
  BUDGET_BANDS,
  COST_KINDS,
  CRITERIA,
  DEFAULT_WEIGHTS,
  EXPERIENCE,
  FREQUENCY_BANDS,
  HYP_KINDS,
  TEST_METHODS,
  WHY_NOW_KINDS,
  composeStatement,
  hypothesisStarters,
  isTestable,
  opportunityScore,
  priority,
  problemChecks,
  quadrant,
  rankOpportunities,
  researchPlan,
  type DiscoverState,
} from "../src/workspace";

/** Problem Discovery v1: problem canvas → compare framings → beliefs to test → next week. */
export function DiscoverScreen({ state: s, update, ctx }: PillarScreenProps<DiscoverState>) {
  const set = (patch: Partial<DiscoverState>) => update((x) => ({ ...x, ...patch }));
  const checks = problemChecks(s);
  const statement = composeStatement(s);
  const ranked = rankOpportunities(s);
  const focusId = s.focusId || ranked[0]?.o.id || "";
  const starters = hypothesisStarters(s);
  const plan = researchPlan(s);

  return (
    <div className="space-y-5">
      <Section
        step={1}
        title="The problem"
        hint="Describe what goes wrong for someone, before any product exists."
      >
        {ctx.startup.idea && (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">From your start card:</span> “{ctx.startup.idea}
            ”
            {s.parkedSolution === ctx.startup.idea && (
              <span className="block text-xs text-muted-foreground">
                It sounds like a solution, so we&apos;ve parked it below for Product Design. Now
                describe the problem behind it.
              </span>
            )}
          </p>
        )}
        <Field label="In one sentence, what problem do people have?">
          <TextField
            label="The problem"
            value={s.pain}
            maxLength={280}
            onChange={(pain) => set({ pain })}
            placeholder="e.g. lose time and money getting to class"
          />
        </Field>
        <Field label="Who has it? Be specific.">
          <TextField
            label="Who has it"
            value={s.who}
            maxLength={140}
            onChange={(who) => set({ who })}
            placeholder="e.g. College students in Pune who live 3–8 km from campus"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="How often does it happen?">
            <Segmented
              label="How often"
              options={FREQUENCY_BANDS.map((b) => ({ value: b.value, label: b.label }))}
              value={s.frequencyBand}
              onChange={(frequencyBand) => set({ frequencyBand })}
            />
          </Field>
          <Field label="How badly does it hurt?">
            <Dots
              label="Severity"
              value={s.severity}
              onChange={(severity) => set({ severity })}
              low="Annoying"
              high="Serious"
            />
          </Field>
        </div>
        <Field label="What does it cost them?">
          <ChipSelect
            label="Cost kinds"
            options={COST_KINDS}
            value={s.costKinds}
            onChange={(costKinds) => set({ costKinds })}
          />
          <TextField
            label="Cost of pain"
            value={s.costOfPain}
            maxLength={200}
            onChange={(costOfPain) => set({ costOfPain })}
            placeholder="e.g. 40–60 minutes and ₹60–₹120 a day"
          />
        </Field>
        <Field
          label="What do they do about it today?"
          hint="Your real competition. Doing nothing counts."
        >
          <RowList
            items={s.alternatives}
            onChange={(alternatives) => set({ alternatives })}
            newItem={() => ({ id: newRowId(), name: "", kind: "service" as const })}
            addLabel="Add an alternative"
            max={6}
            renderItem={(a, patch) => (
              <div className="space-y-2">
                <TextField
                  label="Alternative"
                  value={a.name}
                  maxLength={60}
                  onChange={(name) => patch({ name })}
                  placeholder="e.g. The city bus"
                />
                <Segmented
                  label="Kind"
                  options={ALT_KINDS.map((k) => ({
                    value: k,
                    label:
                      k === "diy"
                        ? "DIY"
                        : k === "do-nothing"
                          ? "Do nothing"
                          : k[0]!.toUpperCase() + k.slice(1),
                  }))}
                  value={a.kind}
                  onChange={(kind) => kind && patch({ kind })}
                />
              </div>
            )}
          />
        </Field>
        <Field label="Why is now the right time?">
          <ChipSelect
            label="Why now"
            options={WHY_NOW_KINDS}
            value={s.whyNowKinds}
            onChange={(whyNowKinds) => set({ whyNowKinds })}
          />
          <TextField
            label="Why now, in a line"
            value={s.whyNow}
            maxLength={200}
            onChange={(whyNow) => set({ whyNow })}
            placeholder="e.g. E-bikes and app unlocking have become cheaper"
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={s.whyNowUnknown}
              onChange={(e) => set({ whyNowUnknown: e.target.checked })}
            />
            I don&apos;t know yet
          </label>
        </Field>
        <details className="rounded-lg border border-border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            You and this problem (optional)
          </summary>
          <div className="mt-3 space-y-3">
            <Field label="Have you faced it yourself?">
              <Segmented
                label="Experience"
                options={EXPERIENCE}
                value={s.experience}
                onChange={(experience) => set({ experience })}
              />
            </Field>
            <Field label="What do you have that helps?">
              <ChipSelect
                label="Advantages"
                options={ADVANTAGES}
                value={s.advantages}
                onChange={(advantages) => set({ advantages })}
              />
            </Field>
            <Field label="How much could you spend testing it?">
              <Segmented
                label="Budget"
                options={BUDGET_BANDS}
                value={s.budgetBand}
                onChange={(budgetBand) => set({ budgetBand })}
              />
            </Field>
            <Field
              label="Your solution idea (parked)"
              hint="Kept for Product Design. It stays out of the problem statement."
            >
              <TextField
                label="Parked solution"
                value={s.parkedSolution}
                maxLength={200}
                onChange={(parkedSolution) => set({ parkedSolution })}
              />
            </Field>
          </div>
        </details>

        <div
          className="rounded-xl border-2 border-dashed border-founder/40 bg-founder-soft/40 p-4"
          data-testid="problem-statement"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-founder">
              Your problem statement
            </span>
            {statement && <EvidenceBadge label="ASSUMED" />}
          </div>
          <p className={cn("text-base", !statement && "text-muted-foreground")}>
            {statement || "It builds itself as you answer."}
          </p>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {checks.map((c) => (
              <li
                key={c.id}
                className="flex items-start gap-1.5 text-sm"
                data-check={c.id}
                data-pass={c.pass}
              >
                <span
                  className={cn(
                    "mt-0.5 size-4 shrink-0 rounded-full text-center text-[10px] leading-4 text-white",
                    c.pass ? "bg-actual" : "bg-border",
                  )}
                >
                  {c.pass ? "✓" : ""}
                </span>
                <span>
                  {c.title}
                  {!c.pass && (
                    <span className="block text-xs text-muted-foreground">{c.message}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <AiPlaceholder
          title="Suggest a reframe"
          detail="For now, the checks above keep the statement clean."
        />
      </Section>

      <Section
        step={2}
        title="Compare ways to frame it"
        hint="Rate 2–5 framings. The score weighs severity most and uses the gap left by today's workaround."
      >
        <RowList
          items={s.opportunities}
          onChange={(opportunities) => set({ opportunities })}
          newItem={() => ({
            id: newRowId(),
            title: s.opportunities.length === 0 ? (s.who ? `${s.who}`.slice(0, 80) : "") : "",
            severity: null,
            frequency: null,
            urgency: null,
            workaroundStrength: null,
            feasibility: null,
          })}
          addLabel="Add a framing"
          max={5}
          empty="e.g. Daily commute · Late evenings after labs · Weekend trips"
          renderItem={(o, patch) => {
            const score = opportunityScore(o, s.weights);
            return (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <TextField
                      label="Framing"
                      value={o.title}
                      maxLength={80}
                      onChange={(title) => patch({ title })}
                      placeholder="Name this framing"
                    />
                  </div>
                  <span className="text-lg font-bold tabular-nums">
                    {score === null ? "—" : score.toFixed(1)}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant={focusId === o.id ? "default" : "outline"}
                    onClick={() => set({ focusId: o.id })}
                  >
                    {focusId === o.id ? "★ Focus" : "Make focus"}
                  </Button>
                </div>
                <div className="grid gap-2">
                  {CRITERIA.map((c) => (
                    <div key={c.key} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm">{c.label}</span>
                      <Dots
                        label={c.label}
                        value={o[c.key]}
                        onChange={(v) => patch({ [c.key]: v })}
                        low={c.low}
                        high={c.high}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          }}
        />
        {ranked.some((r) => r.score !== null) && (
          <Bars
            items={ranked.map((r) => ({
              id: r.o.id,
              label: r.o.title,
              value: r.score,
              highlight: r.o.id === focusId,
            }))}
            max={5}
            evidence="ESTIMATE"
          />
        )}
        <details className="rounded-lg border border-border p-3">
          <summary className="cursor-pointer text-sm font-medium">Weights (expert)</summary>
          <div className="mt-3 space-y-2">
            {CRITERIA.map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-2 text-sm">
                {c.label}
                <Dots
                  label={`${c.label} weight`}
                  value={s.weights[c.key] || null}
                  onChange={(v) => set({ weights: { ...s.weights, [c.key]: v } })}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => set({ weights: DEFAULT_WEIGHTS })}
            >
              Reset to recommended
            </Button>
          </div>
        </details>
        <AiPlaceholder
          title="Suggest ratings"
          detail="For now, rate what you believe. Ratings are guesses (ASSUMED) until tested."
        />
      </Section>

      <Section
        step={3}
        title="What has to be true?"
        hint="Beliefs that real people could prove wrong. Priority = risk × uncertainty."
      >
        {starters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {starters.map((st) => (
              <button
                key={st.statement}
                type="button"
                className="rounded-full border border-dashed border-founder/50 px-3 py-1 text-left text-sm text-founder hover:bg-founder-soft"
                onClick={() =>
                  set({
                    hypotheses: [
                      ...s.hypotheses,
                      {
                        id: newRowId(),
                        statement: st.statement,
                        kind: st.kind,
                        risk: 3,
                        uncertainty: 4,
                        testMethod: st.testMethod,
                        success: "",
                      },
                    ],
                  })
                }
              >
                + {st.statement}
              </button>
            ))}
          </div>
        )}
        <RowList
          items={s.hypotheses}
          onChange={(hypotheses) => set({ hypotheses })}
          newItem={() => ({
            id: newRowId(),
            statement: "",
            kind: "desirability" as const,
            risk: null,
            uncertainty: null,
            testMethod: "" as const,
            success: "",
          })}
          addLabel="Add a belief"
          max={12}
          renderItem={(h, patch, i) => (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold">H{i + 1}</span>
                {priority(h) !== null && (
                  <span className="rounded bg-muted px-1.5 py-0.5">priority {priority(h)}</span>
                )}
                {quadrant(h) && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5",
                      quadrant(h) === "Test first"
                        ? "bg-founder text-founder-foreground"
                        : "bg-muted",
                    )}
                  >
                    {quadrant(h)}
                  </span>
                )}
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5",
                    isTestable(h) ? "bg-actual-soft text-actual" : "bg-muted text-muted-foreground",
                  )}
                >
                  {isTestable(h) ? "✓ testable" : "not testable yet"}
                </span>
              </div>
              <TextField
                label="Belief"
                value={h.statement}
                maxLength={240}
                onChange={(statement) => patch({ statement })}
                placeholder="e.g. These students would pay ₹40 or more a day"
              />
              <Segmented
                label="Kind"
                options={HYP_KINDS}
                value={h.kind}
                onChange={(kind) => kind && patch({ kind })}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  If wrong, how bad?
                  <Dots label="Risk" value={h.risk} onChange={(risk) => patch({ risk })} />
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  How unsure?
                  <Dots
                    label="Uncertainty"
                    value={h.uncertainty}
                    onChange={(uncertainty) => patch({ uncertainty })}
                  />
                </div>
              </div>
              <Segmented
                label="Test method"
                options={TEST_METHODS}
                value={h.testMethod}
                onChange={(testMethod) => patch({ testMethod })}
              />
              <TextField
                label="We're right if"
                value={h.success}
                maxLength={160}
                onChange={(success) => patch({ success })}
                placeholder="We're right if… e.g. at least 5 of 10 already spend ₹40 a day"
              />
            </div>
          )}
        />
        {s.hypotheses.some((h) => quadrant(h)) && (
          <Quadrant
            xLabel="Uncertainty"
            yLabel="Risk"
            labels={["Confirm", "Test first", "Safe for now", "Explore later"]}
            points={s.hypotheses
              .map((h, i) => ({ h, i }))
              .filter(({ h }) => quadrant(h))
              .map(({ h, i }) => ({ id: h.id, x: h.uncertainty!, y: h.risk!, label: `H${i + 1}` }))}
          />
        )}
        <AiPlaceholder
          title="Suggest beliefs to test"
          detail="For now, use the starters built from your canvas."
        />
      </Section>

      <Section
        step={4}
        title="Next week"
        hint="Built from your beliefs: everything except “Safe for now”, grouped by how to test it."
      >
        {plan.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Rate your beliefs and pick a test method to see a plan.
          </p>
        ) : (
          <ol className="space-y-2">
            {plan.map((p, i) => (
              <li key={p.method} className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                <span className="font-semibold">
                  {i + 1}. {p.method[0]!.toUpperCase() + p.method.slice(1)}
                </span>{" "}
                → {p.pillar}
                <span className="block text-xs text-muted-foreground">
                  Tests {p.tests.join(", ")} · {p.time}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}
