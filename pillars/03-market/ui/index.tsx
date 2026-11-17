"use client";

import { currencySymbol, formatMoney, type PillarScreenProps } from "@bluslate/contracts";
import {
  AiPlaceholder,
  Dots,
  EvidenceBadge,
  Field,
  NumberField,
  Quadrant,
  RowList,
  Section,
  Segmented,
  Stat,
  TextField,
  newRowId,
} from "@bluslate/ui";
import {
  BANDS,
  COMPETITOR_KINDS,
  PRICE_PERIODS,
  TRENDS,
  sizing,
  topDown,
  type MarketState,
} from "../src/workspace";

/** Market Research v1: boundary → bottom-up funnel → top-down check → competitors and positioning. */
export function MarketScreen({ state: s, update, ctx }: PillarScreenProps<MarketState>) {
  const set = (patch: Partial<MarketState>) => update((x) => ({ ...x, ...patch }));
  const cur = ctx.startup.currency;
  const sym = currencySymbol(cur);
  const z = sizing(s);
  const td = topDown(s);
  const funnel = [
    { id: "TAM", label: "TAM · everyone who could buy", v: z.tam?.base ?? null, w: 100 },
    { id: "SAM", label: "SAM · you can reach", v: z.sam?.base ?? null, w: 72 },
    { id: "SOM", label: "SOM · you could win", v: z.som?.base ?? null, w: 44 },
  ];

  return (
    <div className="space-y-5">
      <Section
        step={1}
        title="Draw the boundary"
        hint="A market size only means something for a place, a group and a period."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Where">
            <TextField
              label="Geography"
              value={s.geography}
              maxLength={80}
              onChange={(geography) => set({ geography })}
            />
          </Field>
          <Field label="Who">
            <TextField
              label="Segment"
              value={s.segment}
              maxLength={140}
              onChange={(segment) => set({ segment })}
              placeholder="e.g. College students in Pune"
            />
          </Field>
        </div>
      </Section>

      <Section
        step={2}
        title="Size it from the bottom up"
        hint="Count real customers and what each is worth a year. Add a source where you have one."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Potential customers in the boundary">
            <NumberField
              label="Potential customers"
              suffix="people"
              value={s.customers}
              onChange={(customers) => set({ customers })}
            />
            <TextField
              label="Source for customers"
              value={s.customersSource}
              maxLength={300}
              onChange={(customersSource) => set({ customersSource })}
              placeholder="Source link or note (optional)"
            />
          </Field>
          <Field label="What one customer spends a year">
            <NumberField
              label="Yearly value per customer"
              prefix={sym}
              value={s.valuePerCustomer}
              onChange={(valuePerCustomer) => set({ valuePerCustomer })}
            />
            <TextField
              label="Source for value"
              value={s.valueSource}
              maxLength={300}
              onChange={(valueSource) => set({ valueSource })}
              placeholder="Source link or note (optional)"
            />
          </Field>
          <Field label="Share you can reach (SAM)" hint="With your channels, location and offer.">
            <NumberField
              label="Reach"
              suffix="%"
              max={100}
              value={s.reachPct}
              onChange={(reachPct) => set({ reachPct })}
            />
          </Field>
          <Field
            label="Share you could win in 3 years (SOM)"
            hint="Most new ventures win a few percent."
          >
            <NumberField
              label="Win share"
              suffix="%"
              max={100}
              value={s.winPct}
              onChange={(winPct) => set({ winPct })}
            />
          </Field>
        </div>
        <Field label="How sure are you?">
          <Segmented
            label="Uncertainty"
            options={BANDS}
            value={s.band}
            onChange={(band) => band && set({ band })}
          />
        </Field>

        <div className="space-y-2 pt-2" data-testid="funnel">
          {funnel.map((f) => (
            <div
              key={f.id}
              className="mx-auto rounded-lg bg-founder px-3 py-2 text-center text-founder-foreground"
              style={{ width: `${f.w}%`, opacity: f.v === null ? 0.35 : 1 }}
            >
              <div className="text-xs opacity-90">{f.label}</div>
              <div className="text-lg font-bold">{f.v === null ? "—" : formatMoney(f.v, cur)}</div>
            </div>
          ))}
          <div className="flex justify-center">
            <EvidenceBadge label="ESTIMATE" />
          </div>
        </div>
      </Section>

      <Section
        step={3}
        title="Cross-check from the top down"
        hint="A published market value × your segment's share. Big gaps usually mean different definitions."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Total market value a year">
            <NumberField
              label="Market value"
              prefix={sym}
              value={s.marketValue}
              onChange={(marketValue) => set({ marketValue })}
            />
          </Field>
          <Field label="Your segment's share">
            <NumberField
              label="Segment share"
              suffix="%"
              max={100}
              value={s.segmentSharePct}
              onChange={(segmentSharePct) => set({ segmentSharePct })}
            />
          </Field>
          <Stat
            label="Top-down estimate"
            value={td.value === null ? null : formatMoney(td.value, cur)}
            evidence="ESTIMATE"
          />
        </div>
        <TextField
          label="Source for market value"
          value={s.marketSource}
          maxLength={300}
          onChange={(marketSource) => set({ marketSource })}
          placeholder="Report, statistic or link (optional)"
        />
        <AiPlaceholder
          title="Research market data with sources"
          detail="Every number it finds will carry its source and retrieval date."
        />
      </Section>

      <Section
        step={4}
        title="Who else is there?"
        hint="Direct rivals, indirect options, substitutes, and doing nothing."
      >
        <RowList
          items={s.competitors}
          onChange={(competitors) => set({ competitors })}
          newItem={() => ({
            id: newRowId(),
            name: "",
            kind: "direct" as const,
            price: null,
            pricePeriod: "per month" as const,
            priceLevel: null,
            quality: null,
            url: "",
          })}
          addLabel="Add a competitor"
          max={12}
          renderItem={(c, patch) => (
            <div className="space-y-2">
              <TextField
                label="Competitor"
                value={c.name}
                maxLength={80}
                onChange={(name) => patch({ name })}
                placeholder="Name"
              />
              <Segmented
                label="Kind"
                options={COMPETITOR_KINDS}
                value={c.kind}
                onChange={(kind) => kind && patch({ kind })}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <NumberField
                  label="Price"
                  prefix={sym}
                  value={c.price}
                  onChange={(price) => patch({ price })}
                />
                <Segmented
                  label="Price period"
                  options={PRICE_PERIODS}
                  value={c.pricePeriod}
                  onChange={(pricePeriod) => pricePeriod && patch({ pricePeriod })}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  Price level
                  <Dots
                    label="Price level"
                    value={c.priceLevel}
                    onChange={(priceLevel) => patch({ priceLevel })}
                    low="Cheap"
                    high="Premium"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  Quality / fit
                  <Dots
                    label="Quality"
                    value={c.quality}
                    onChange={(quality) => patch({ quality })}
                    low="Poor"
                    high="Great"
                  />
                </div>
              </div>
              <TextField
                label="Website"
                value={c.url}
                maxLength={300}
                onChange={(url) => patch({ url })}
                placeholder="Website (optional)"
              />
            </div>
          )}
        />
        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-sm font-medium">Where you want to be</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              Your price level
              <Dots
                label="Your price level"
                value={s.youPrice}
                onChange={(youPrice) => set({ youPrice })}
              />
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              Your quality / fit
              <Dots
                label="Your quality"
                value={s.youQuality}
                onChange={(youQuality) => set({ youQuality })}
              />
            </div>
          </div>
        </div>
        <Quadrant
          xLabel="Price"
          yLabel="Quality"
          hot="tl"
          labels={["Great value", "Premium", "Budget", "Overpriced"]}
          points={[
            ...s.competitors
              .map((c, i) => ({ c, i }))
              .filter(({ c }) => c.priceLevel !== null && c.quality !== null)
              .map(({ c, i }) => ({
                id: c.id,
                x: c.priceLevel!,
                y: c.quality!,
                label: c.name.slice(0, 2).toUpperCase() || `C${i + 1}`,
              })),
            ...(s.youPrice !== null && s.youQuality !== null
              ? [{ id: "you", x: s.youPrice, y: s.youQuality, label: "You", you: true }]
              : []),
          ]}
        />
        <AiPlaceholder
          title="Find competitors"
          detail="Will list real companies with dated prices and links."
        />
      </Section>

      <Section step={5} title="Which way is the market moving?">
        <Segmented
          label="Trend"
          options={TRENDS}
          value={s.trend}
          onChange={(trend) => set({ trend })}
        />
        <TextField
          label="Trend note"
          value={s.trendNote}
          maxLength={200}
          onChange={(trendNote) => set({ trendNote })}
          placeholder="What you've seen (optional)"
        />
      </Section>
    </div>
  );
}
