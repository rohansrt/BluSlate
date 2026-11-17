"use client";

import { currencySymbol, formatMoney, type PillarScreenProps } from "@bluslate/contracts";
import {
  AiPlaceholder,
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
  CHANNELS,
  PERIODS,
  PRICE_METHODS,
  RINGS,
  breakEven,
  funnel,
  positioning,
  waterfall,
  type GtmState,
} from "../src/workspace";

/** Go-to-Market Plan v1: positioning → Pricing Lab → Bullseye channels → launch. */
export function GtmScreen({ state: s, update, ctx }: PillarScreenProps<GtmState>) {
  const set = (patch: Partial<GtmState>) => update((x) => ({ ...x, ...patch }));
  const cur = ctx.startup.currency;
  const sym = currencySymbol(cur);
  const w = waterfall(s);
  const f = funnel(s);
  const b = breakEven(s);
  const pos = positioning(s);
  const rivals = (ctx.upstream.Competitor ?? []).filter(
    (c) => c.pricing && typeof (c.pricing as { amount?: number }).amount === "number",
  );
  const max = w ? Math.max(1, w.steps[0]!.amount) : 1;

  return (
    <div className="space-y-5">
      <Section
        step={1}
        title="Who buys first, and why you"
        hint="Pick one beachhead group you can win completely."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First customers">
            <TextField
              label="Beachhead"
              value={s.beachhead}
              maxLength={140}
              onChange={(beachhead) => set({ beachhead })}
              placeholder="e.g. First-year students in hostels 3–8 km away"
            />
          </Field>
          <Field label="Who need to…">
            <TextField
              label="Need"
              value={s.need}
              maxLength={160}
              onChange={(need) => set({ need })}
              placeholder="e.g. reach 8 am lectures on time"
            />
          </Field>
          <Field label="We are a…">
            <TextField
              label="Category"
              value={s.category}
              maxLength={80}
              onChange={(category) => set({ category })}
              placeholder="e.g. campus e-bike rental"
            />
          </Field>
          <Field label="That…">
            <TextField
              label="Benefit"
              value={s.benefit}
              maxLength={160}
              onChange={(benefit) => set({ benefit })}
              placeholder="e.g. costs less than an auto and never runs late"
            />
          </Field>
          <Field label="Unlike…">
            <TextField
              label="Alternative"
              value={s.alternative}
              maxLength={80}
              onChange={(alternative) => set({ alternative })}
              placeholder="e.g. ride-hailing"
            />
          </Field>
          <Field label="We…">
            <TextField
              label="Differentiation"
              value={s.differentiation}
              maxLength={160}
              onChange={(differentiation) => set({ differentiation })}
              placeholder="e.g. park at the hostel gate"
            />
          </Field>
        </div>
        <p
          className={cn(
            "rounded-lg border-2 border-dashed border-founder/40 bg-founder-soft/40 p-3",
            !pos && "text-muted-foreground",
          )}
          data-testid="positioning"
        >
          {pos || "Your positioning statement builds itself as you fill this in."}
        </p>
        <AiPlaceholder title="Test messages with personas" />
      </Section>

      <Section step={2} title="Pricing Lab" hint="From list price to what you keep on each sale.">
        <Field label="How you set the price">
          <Segmented
            label="Method"
            options={PRICE_METHODS}
            value={s.method}
            onChange={(method) => set({ method })}
          />
        </Field>
        {rivals.length > 0 && (
          <FromUpstream pillar="Market Research">
            {rivals
              .map((c) => {
                const p = c.pricing as { amount: number; period?: string };
                return `${String(c.name)} ${formatMoney(p.amount, cur)} ${p.period ?? ""}`;
              })
              .join(" · ")}
          </FromUpstream>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="List price">
            <NumberField
              label="Price"
              prefix={sym}
              value={s.price}
              onChange={(price) => set({ price })}
            />
          </Field>
          <Field label="Charged">
            <Segmented
              label="Period"
              options={PERIODS}
              value={s.period}
              onChange={(period) => period && set({ period })}
            />
          </Field>
          <Field label="Launch discount">
            <NumberField
              label="Discount"
              suffix="%"
              max={100}
              value={s.discountPct}
              onChange={(discountPct) => set({ discountPct })}
            />
          </Field>
          <Field label="Payment and channel fees">
            <NumberField
              label="Fees"
              suffix="%"
              max={100}
              value={s.feesPct}
              onChange={(feesPct) => set({ feesPct })}
            />
          </Field>
          <Field
            label="Variable cost per unit"
            hint={ctx.upstream.CostItem?.length ? "From Operations Setup" : undefined}
          >
            <NumberField
              label="Variable cost"
              prefix={sym}
              value={s.variableCost}
              onChange={(variableCost) => set({ variableCost })}
            />
          </Field>
          <Field
            label="Fixed costs a month"
            hint={ctx.upstream.CostItem?.length ? "From Operations Setup" : undefined}
          >
            <NumberField
              label="Fixed monthly"
              prefix={sym}
              value={s.fixedMonthly}
              onChange={(fixedMonthly) => set({ fixedMonthly })}
            />
          </Field>
        </div>
        {w && (
          <div className="space-y-1.5 rounded-lg bg-muted/50 p-3" data-testid="waterfall">
            {[...w.steps, { label: "You keep", amount: w.contribution }].map((x, i) => (
              <div
                key={x.label}
                className="grid grid-cols-[8rem_1fr_6rem] items-center gap-2 text-sm"
              >
                <span className={cn(i === 4 && "font-semibold")}>{x.label}</span>
                <span className="h-3 overflow-hidden rounded bg-card">
                  <span
                    className={cn(
                      "block h-full rounded",
                      i === 0
                        ? "bg-founder"
                        : i === 4
                          ? x.amount >= 0
                            ? "bg-actual"
                            : "bg-danger"
                          : "bg-review",
                    )}
                    style={{ width: `${Math.min(100, (Math.abs(x.amount) / max) * 100)}%` }}
                  />
                </span>
                <span className="text-right tabular-nums">{formatMoney(x.amount, cur)}</span>
              </div>
            ))}
          </div>
        )}
        <AiPlaceholder
          title="Suggest a price range"
          detail="From competitor prices and what segments said they'd pay."
        />
      </Section>

      <Section
        step={3}
        title="Channels (Bullseye)"
        hint="Brainstorm widely, then test 1–3 in the inner ring. CAC is a guess until you test."
      >
        <RowList
          items={s.channels}
          onChange={(channels) => set({ channels })}
          newItem={() => ({
            id: newRowId(),
            channel: "Referrals" as const,
            ring: "inner" as const,
            monthlyBudget: null,
            cac: null,
          })}
          addLabel="Add a channel"
          max={10}
          renderItem={(c, patch) => (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <Select
                  aria-label="Channel"
                  value={c.channel}
                  onChange={(e) => patch({ channel: e.target.value as typeof c.channel })}
                >
                  {CHANNELS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </Select>
                <Segmented
                  label="Ring"
                  options={RINGS}
                  value={c.ring}
                  onChange={(ring) => ring && patch({ ring })}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <NumberField
                  label="Monthly budget"
                  prefix={sym}
                  value={c.monthlyBudget}
                  onChange={(monthlyBudget) => patch({ monthlyBudget })}
                />
                <NumberField
                  label="Cost per customer (CAC)"
                  prefix={sym}
                  value={c.cac}
                  onChange={(cac) => patch({ cac })}
                  placeholder="CAC"
                />
                <Stat
                  label="Customers a month"
                  value={
                    c.monthlyBudget && c.cac ? String(Math.round(c.monthlyBudget / c.cac)) : null
                  }
                  evidence="ESTIMATE"
                />
              </div>
            </div>
          )}
        />
        <div className="flex justify-center py-2" aria-hidden>
          <svg viewBox="0 0 200 200" className="size-44">
            {[90, 60, 30].map((r, i) => (
              <circle
                key={r}
                cx="100"
                cy="100"
                r={r}
                className={
                  i === 2 ? "fill-founder/80" : i === 1 ? "fill-founder/40" : "fill-founder/15"
                }
              />
            ))}
            {(["outer", "middle", "inner"] as const).map((ring, i) => (
              <text
                key={ring}
                x="100"
                y={[22, 52, 104][i]}
                textAnchor="middle"
                className={cn(
                  "text-[10px] font-semibold",
                  ring === "inner" ? "fill-white" : "fill-foreground",
                )}
              >
                {s.channels.filter((c) => c.ring === ring).length} {ring}
              </text>
            ))}
          </svg>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Stat
            label="Marketing a month"
            value={f.budget ? formatMoney(f.budget, cur) : null}
            evidence="ASSUMED"
          />
          <Stat
            label="Blended CAC"
            value={f.blendedCac === null ? null : formatMoney(f.blendedCac, cur)}
            evidence="ESTIMATE"
          />
          <Stat
            label="Break-even units a month"
            value={b.units === null ? null : String(b.units)}
            evidence="ESTIMATE"
          />
        </div>
        <AiPlaceholder title="Find channels for this segment" />
      </Section>

      <Section step={4} title="Launch" hint="A date and the things that must be true before it.">
        <Field label="Launch date">
          <input
            type="date"
            aria-label="Launch date"
            value={s.launchDate}
            onChange={(e) => set({ launchDate: e.target.value })}
            className="h-11 rounded-lg border border-input bg-card px-3"
          />
        </Field>
        <ul className="space-y-1.5">
          {s.checklist.map((c) => (
            <li key={c.id}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={c.done}
                  onChange={(e) =>
                    set({
                      checklist: s.checklist.map((x) =>
                        x.id === c.id ? { ...x, done: e.target.checked } : x,
                      ),
                    })
                  }
                />
                <span className={cn(c.done && "text-muted-foreground line-through")}>{c.item}</span>
              </label>
            </li>
          ))}
        </ul>
        <AiPlaceholder
          title="Draft a campaign"
          detail="Nothing is posted or spent without your approval."
        />
      </Section>
    </div>
  );
}
