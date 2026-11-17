"use client";

import { currencySymbol, formatMoney, type PillarScreenProps } from "@bluslate/contracts";
import {
  AiPlaceholder,
  EvidenceBadge,
  Field,
  LineChart,
  NumberField,
  Section,
  Segmented,
  Stat,
  TextField,
} from "@bluslate/ui";
import {
  DIFFICULTY,
  HORIZONS,
  missingInputs,
  outcomes,
  simulate,
  type RunGrowState,
} from "../src/workspace";

/** Launch & Growth v1: scenario → starting numbers → levers → control room. */
export function RunGrowScreen({ state: s, update, ctx }: PillarScreenProps<RunGrowState>) {
  const set = (patch: Partial<RunGrowState>) => update((x) => ({ ...x, ...patch }));
  const cur = ctx.startup.currency;
  const sym = currencySymbol(cur);
  const months = simulate(s);
  const o = outcomes(months);
  const missing = missingInputs(s);
  const fromPlan = Boolean(
    ctx.upstream.PricePlan?.length ||
    ctx.upstream.CostItem?.length ||
    ctx.upstream.ChannelPlan?.length,
  );
  const money = (n: number) => formatMoney(n, cur);

  return (
    <div className="space-y-5">
      <Section
        step={1}
        title="Scenario"
        hint="A what-if, not a prediction. Every result is labelled SYNTHETIC."
        aside={<EvidenceBadge label="SYNTHETIC" />}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name">
            <TextField
              label="Scenario name"
              value={s.scenarioName}
              maxLength={80}
              onChange={(scenarioName) => set({ scenarioName })}
            />
          </Field>
          <Field label="Months">
            <Segmented
              label="Horizon"
              options={HORIZONS.map((h) => ({ value: h, label: `${h} months` }))}
              value={s.horizon}
              onChange={(horizon) => horizon && set({ horizon })}
            />
          </Field>
          <Field label="Market">
            <Segmented
              label="Difficulty"
              options={DIFFICULTY}
              value={s.difficulty}
              onChange={(difficulty) => difficulty && set({ difficulty })}
            />
          </Field>
        </div>
      </Section>

      <Section
        step={2}
        title="Starting numbers"
        hint={
          fromPlan
            ? "Pre-filled from your published plan where possible. Change them freely here."
            : "Used alone, enter rough numbers. They're assumptions."
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Starting cash">
            <NumberField
              label="Starting cash"
              prefix={sym}
              value={s.startingCash}
              onChange={(startingCash) => set({ startingCash })}
            />
          </Field>
          <Field label="Customers today">
            <NumberField
              label="Starting customers"
              value={s.startingCustomers}
              onChange={(startingCustomers) => set({ startingCustomers })}
            />
          </Field>
          <Field label="Price per unit">
            <NumberField
              label="Price"
              prefix={sym}
              value={s.price}
              onChange={(price) => set({ price })}
            />
          </Field>
          <Field label="Units per customer a month">
            <NumberField
              label="Purchases per month"
              value={s.purchasesPerMonth}
              onChange={(purchasesPerMonth) => set({ purchasesPerMonth })}
            />
          </Field>
          <Field label="Variable cost per unit">
            <NumberField
              label="Variable cost"
              prefix={sym}
              value={s.variableCost}
              onChange={(variableCost) => set({ variableCost })}
            />
          </Field>
          <Field label="Fixed costs a month">
            <NumberField
              label="Fixed monthly"
              prefix={sym}
              value={s.fixedMonthly}
              onChange={(fixedMonthly) => set({ fixedMonthly })}
            />
          </Field>
          <Field label="Marketing a month">
            <NumberField
              label="Marketing budget"
              prefix={sym}
              value={s.marketingBudget}
              onChange={(marketingBudget) => set({ marketingBudget })}
            />
          </Field>
          <Field label="Cost per new customer (CAC)">
            <NumberField label="CAC" prefix={sym} value={s.cac} onChange={(cac) => set({ cac })} />
          </Field>
          <Field label="Customers lost a month">
            <NumberField
              label="Churn"
              suffix="%"
              max={100}
              value={s.churnPct}
              onChange={(churnPct) => set({ churnPct })}
            />
          </Field>
          <Field label="Referrals a month">
            <NumberField
              label="Referral rate"
              suffix="% of customers"
              max={100}
              value={s.referralPct}
              onChange={(referralPct) => set({ referralPct })}
            />
          </Field>
          <Field label="Most customers possible" hint="From your SOM, if you know it.">
            <NumberField
              label="Market cap"
              value={s.marketCap}
              onChange={(marketCap) => set({ marketCap })}
            />
          </Field>
        </div>
      </Section>

      <Section
        step={3}
        title="Levers"
        hint="Change a decision from a given month. Earlier months stay as they were."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Change price from month">
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Price lever month"
                value={s.priceLeverMonth}
                min={1}
                max={24}
                step={1}
                onChange={(v) =>
                  set({ priceLeverMonth: v === null ? null : Math.max(1, Math.round(v)) })
                }
                placeholder="month"
              />
              <NumberField
                label="New price"
                prefix={sym}
                value={s.newPrice}
                onChange={(newPrice) => set({ newPrice })}
              />
            </div>
          </Field>
          <Field label="Change marketing from month">
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Budget lever month"
                value={s.budgetLeverMonth}
                min={1}
                max={24}
                step={1}
                onChange={(v) =>
                  set({ budgetLeverMonth: v === null ? null : Math.max(1, Math.round(v)) })
                }
                placeholder="month"
              />
              <NumberField
                label="New budget"
                prefix={sym}
                value={s.newBudget}
                onChange={(newBudget) => set({ newBudget })}
              />
            </div>
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          A price rise also loses some price-sensitive customers in the month it starts.
        </p>
      </Section>

      <Section step={4} title="Control room" aside={<EvidenceBadge label="SYNTHETIC" />}>
        {missing.length > 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            Add {missing.join(", ")} to run the months.
          </p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-4">
              <Stat
                label="Runway"
                value={o?.runOut ? `Month ${o.runOut}` : `${s.horizon}+ months`}
                tone={o?.runOut ? "danger" : "good"}
              />
              <Stat label="Break-even" value={o?.breakEven ? `Month ${o.breakEven}` : "Not yet"} />
              <Stat
                label="Lowest cash"
                value={o ? money(o.lowest.cash) : null}
                tone={o && o.lowest.cash < 0 ? "danger" : undefined}
              />
              <Stat
                label="Customers at end"
                value={o ? Math.round(o.last.customers).toLocaleString("en-IN") : null}
              />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium">Cash</h3>
              <LineChart
                series={[
                  { name: "Cash", values: months.map((m) => m.cash), className: "stroke-founder" },
                ]}
                format={money}
              />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium">Revenue vs costs a month</h3>
              <LineChart
                series={[
                  {
                    name: "Revenue",
                    values: months.map((m) => m.revenue),
                    className: "stroke-actual",
                  },
                  { name: "Costs", values: months.map((m) => m.costs), className: "stroke-danger" },
                ]}
                format={money}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-right text-xs tabular-nums">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="text-left">Month</th>
                    <th>Customers</th>
                    <th>New</th>
                    <th>Revenue</th>
                    <th>Costs</th>
                    <th>Cash</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m) => (
                    <tr key={m.month} className="border-t border-border">
                      <td className="py-1 text-left">{m.month}</td>
                      <td>{Math.round(m.customers)}</td>
                      <td>{Math.round(m.newCustomers)}</td>
                      <td>{money(m.revenue)}</td>
                      <td>{money(m.costs)}</td>
                      <td className={m.cash < 0 ? "text-danger" : ""}>{money(m.cash)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <AiPlaceholder
          title="Why did this move?"
          detail="Will explain each change from its drivers."
        />
        <AiPlaceholder
          title="Market events and competitor moves"
          detail="Random shocks and rival reactions, seeded and repeatable."
        />
      </Section>
    </div>
  );
}
