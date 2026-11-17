"use client";

import { currencySymbol, formatMoney, type PillarScreenProps } from "@bluslate/contracts";
import {
  AiPlaceholder,
  Dots,
  Field,
  FromUpstream,
  NumberField,
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
  ENABLER_CATEGORIES,
  OWNERS,
  capacity,
  leadTimeDays,
  unitEconomics,
  type SetupState,
} from "../src/workspace";

/** Operations Setup v1: process → team → costs → providers → risks. */
export function SetupScreen({ state: s, update, ctx }: PillarScreenProps<SetupState>) {
  const set = (patch: Partial<SetupState>) => update((x) => ({ ...x, ...patch }));
  const cur = ctx.startup.currency;
  const sym = currencySymbol(cur);
  const u = unitEconomics(s);
  const cap = capacity(s);
  const lead = leadTimeDays(s);
  const offering = ctx.upstream.Offering?.at(-1);

  return (
    <div className="space-y-5">
      <Section
        step={1}
        title="What you deliver, step by step"
        hint="Who does each step, and how many it can handle a day. The slowest step is your bottleneck."
      >
        {offering && (
          <FromUpstream pillar="Product Design">
            {String(offering.archetype ?? "").replace(/_/g, " ")} · {String(offering.mvpType ?? "")}
          </FromUpstream>
        )}
        <Field label="One unit of what you deliver is a…">
          <div className="max-w-60">
            <TextField
              label="Unit"
              value={s.unitName}
              maxLength={40}
              onChange={(unitName) => set({ unitName })}
              placeholder="e.g. ride, order, session"
            />
          </div>
        </Field>
        <RowList
          items={s.steps}
          onChange={(steps) => set({ steps })}
          newItem={() => ({ id: newRowId(), name: "", owner: "founder" as const, perDay: null })}
          addLabel="Add a step"
          max={12}
          empty="e.g. Take booking → Hand over bike → Charge and check → Repair"
          renderItem={(x, patch, i) => (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{i + 1}</span>
                <TextField
                  label="Step"
                  value={x.name}
                  maxLength={80}
                  onChange={(name) => patch({ name })}
                  placeholder="Step name"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Segmented
                  label="Who does it"
                  options={OWNERS}
                  value={x.owner}
                  onChange={(owner) => owner && patch({ owner })}
                />
                <NumberField
                  label="Per day"
                  suffix={`${s.unitName || "units"}/day`}
                  value={x.perDay}
                  onChange={(perDay) => patch({ perDay })}
                />
              </div>
              {cap?.bottleneck === x.name && (
                <p className="text-xs font-semibold text-review">
                  Bottleneck: this step sets your capacity.
                </p>
              )}
            </div>
          )}
        />
        <AiPlaceholder title="Map who does what" />
      </Section>

      <Section step={2} title="Team" hint="Including you. Pay can be zero for now.">
        <RowList
          items={s.team}
          onChange={(team) => set({ team })}
          newItem={() => ({
            id: newRowId(),
            title: "",
            monthlyPay: null,
            equityPct: null,
            hoursPerWeek: null,
          })}
          addLabel="Add a role"
          max={12}
          renderItem={(r, patch) => (
            <div className="grid gap-2 sm:grid-cols-4">
              <TextField
                label="Role"
                value={r.title}
                maxLength={80}
                onChange={(title) => patch({ title })}
                placeholder="e.g. Fleet technician"
              />
              <NumberField
                label="Monthly pay"
                prefix={sym}
                value={r.monthlyPay}
                onChange={(monthlyPay) => patch({ monthlyPay })}
              />
              <NumberField
                label="Equity"
                suffix="% equity"
                max={100}
                value={r.equityPct}
                onChange={(equityPct) => patch({ equityPct })}
              />
              <NumberField
                label="Hours per week"
                suffix="h/week"
                value={r.hoursPerWeek}
                onChange={(hoursPerWeek) => patch({ hoursPerWeek })}
              />
            </div>
          )}
        />
      </Section>

      <Section
        step={3}
        title="Costs"
        hint="Fixed costs happen every month; variable costs grow with each unit."
      >
        <RowList
          items={s.costs}
          onChange={(costs) => set({ costs })}
          newItem={() => ({
            id: newRowId(),
            name: "",
            behaviour: "fixed" as const,
            basis: "per_month" as const,
            amount: null,
          })}
          addLabel="Add a cost"
          max={20}
          renderItem={(c, patch) => (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <TextField
                  label="Cost"
                  value={c.name}
                  maxLength={80}
                  onChange={(name) => patch({ name })}
                  placeholder="e.g. Charging electricity"
                />
                <NumberField
                  label="Amount"
                  prefix={sym}
                  value={c.amount}
                  onChange={(amount) => patch({ amount })}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Segmented
                  label="Behaviour"
                  options={["fixed", "variable"] as const}
                  value={c.behaviour}
                  onChange={(behaviour) =>
                    behaviour &&
                    patch({ behaviour, basis: behaviour === "fixed" ? "per_month" : "per_unit" })
                  }
                />
                <Segmented
                  label="Basis"
                  options={[
                    { value: "per_unit", label: `per ${s.unitName || "unit"}` },
                    { value: "per_customer", label: "per customer" },
                    { value: "per_month", label: "per month" },
                  ]}
                  value={c.basis}
                  onChange={(basis) => basis && patch({ basis })}
                />
              </div>
            </div>
          )}
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <Stat
            label="Monthly fixed"
            value={u.monthlyFixed === null ? null : formatMoney(u.monthlyFixed, cur)}
            evidence="ESTIMATE"
          />
          <Stat
            label={`Variable per ${s.unitName || "unit"}`}
            value={u.variablePerUnit === null ? null : formatMoney(u.variablePerUnit, cur)}
            evidence="ESTIMATE"
          />
          <Stat
            label="Capacity a month"
            value={cap ? `${cap.perMonth}` : null}
            evidence="ASSUMED"
          />
        </div>
      </Section>

      <Section
        step={4}
        title="Providers"
        hint="Real suppliers and partners you've found. BluSlate never contacts or commits to anyone."
      >
        <RowList
          items={s.enablers}
          onChange={(enablers) => set({ enablers })}
          newItem={() => ({
            id: newRowId(),
            name: "",
            category: "supplier" as const,
            price: null,
            leadTimeDays: null,
            reliability: null,
            url: "",
          })}
          addLabel="Add a provider"
          max={12}
          renderItem={(e, patch) => (
            <div className="space-y-2 border-l-4 border-enabler pl-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <TextField
                    label="Provider"
                    value={e.name}
                    maxLength={80}
                    onChange={(name) => patch({ name })}
                    placeholder="Provider name"
                  />
                </div>
                <span className="rounded bg-enabler-soft px-2 py-0.5 text-xs font-semibold text-enabler">
                  Real provider
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Select
                  aria-label="Category"
                  value={e.category}
                  onChange={(ev) => patch({ category: ev.target.value as typeof e.category })}
                >
                  {ENABLER_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <NumberField
                  label="Quoted price"
                  prefix={sym}
                  value={e.price}
                  onChange={(price) => patch({ price })}
                />
                <NumberField
                  label="Lead time"
                  suffix="days"
                  value={e.leadTimeDays}
                  onChange={(leadTimeDays) => patch({ leadTimeDays })}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                Reliability
                <Dots
                  label="Reliability"
                  value={e.reliability}
                  onChange={(reliability) => patch({ reliability })}
                />
              </div>
              <TextField
                label="Website"
                value={e.url}
                maxLength={300}
                onChange={(url) => patch({ url })}
                placeholder="Website (optional)"
              />
            </div>
          )}
        />
        <Field label="Other set-up time (registration, fit-out…)">
          <div className="max-w-48">
            <NumberField
              label="Set-up weeks"
              suffix="weeks"
              value={s.setupWeeks}
              onChange={(setupWeeks) => set({ setupWeeks })}
            />
          </div>
        </Field>
        <Stat
          label="Ready to launch in"
          value={lead === null ? null : `${lead} days`}
          evidence="ESTIMATE"
        />
        <AiPlaceholder
          title="Get synthetic quotes"
          detail="Will be labelled “Synthetic quote”, beside real providers."
        />
      </Section>

      <Section
        step={5}
        title="What could go wrong?"
        hint="Likelihood × impact. Plan for the top ones."
      >
        <RowList
          items={s.risks}
          onChange={(risks) => set({ risks })}
          newItem={() => ({ id: newRowId(), risk: "", likelihood: null, impact: null, plan: "" })}
          addLabel="Add a risk"
          max={10}
          renderItem={(r, patch) => (
            <div className="space-y-2">
              <TextField
                label="Risk"
                value={r.risk}
                maxLength={120}
                onChange={(risk) => patch({ risk })}
                placeholder="e.g. Bikes get stolen"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  Likelihood
                  <Dots
                    label="Likelihood"
                    value={r.likelihood}
                    onChange={(likelihood) => patch({ likelihood })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  Impact
                  <Dots label="Impact" value={r.impact} onChange={(impact) => patch({ impact })} />
                </div>
              </div>
              <TextField
                label="Plan"
                value={r.plan}
                maxLength={160}
                onChange={(plan) => patch({ plan })}
                placeholder="What you'll do about it"
              />
              {r.likelihood !== null && r.impact !== null && (
                <span
                  className={cn(
                    "inline-block rounded px-2 py-0.5 text-xs font-semibold",
                    r.likelihood * r.impact >= 15 ? "bg-danger-soft text-danger" : "bg-muted",
                  )}
                >
                  score {r.likelihood * r.impact}
                </span>
              )}
            </div>
          )}
        />
      </Section>
    </div>
  );
}
