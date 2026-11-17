"use client";

import * as React from "react";
import { Check, Copy, Plus, Sparkles, Target, X } from "lucide-react";
import type { EvidenceLabel, Goal, ReportBlock } from "@bluslate/contracts";
import { cn } from "../cn";
import { Button } from "./button";
import { EvidenceBadge } from "./evidence-badge";
import { Input } from "./input";

/*
 * Building blocks for pillar workspaces (decision 0006). Pillars compose these
 * so every workspace feels like one product while each keeps its own layout.
 * Inputs are structured (chips, ratings, numbers, rows) rather than long text.
 */

/** A short id for rows in a workspace list. */
export function newRowId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function Section({
  title,
  hint,
  step,
  aside,
  children,
  className,
}: {
  title: string;
  hint?: string;
  step?: number | string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-4 sm:p-5", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            {step !== undefined && (
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-founder-soft text-xs font-bold text-founder">
                {step}
              </span>
            )}
            {title}
          </h2>
          {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
        </div>
        {aside}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <div className="text-sm font-medium">{label}</div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  maxLength = 160,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  label?: string;
}) {
  return (
    <Input
      value={value}
      aria-label={label}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

type Option<T extends string> = T | { value: T; label: string };
const optValue = <T extends string>(o: Option<T>) => (typeof o === "string" ? o : o.value);
const optLabel = <T extends string>(o: Option<T>) => (typeof o === "string" ? o : o.label);

/** Pick one. Tapping the selected option again clears it. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly Option<T>[];
  value: T | "" | null | undefined;
  onChange: (v: T | "") => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const v = optValue(o);
        const on = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(on ? "" : v)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              on
                ? "border-founder bg-founder text-founder-foreground"
                : "border-border bg-card hover:bg-accent",
            )}
          >
            {optLabel(o)}
          </button>
        );
      })}
    </div>
  );
}

/** Pick any number. */
export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly Option<T>[];
  value: readonly T[];
  onChange: (v: T[]) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const v = optValue(o);
        const on = value.includes(v);
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== v) : [...value, v])}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
              on
                ? "border-founder bg-founder-soft font-medium text-founder"
                : "border-border bg-card hover:bg-accent",
            )}
          >
            {on && <Check className="size-3.5" aria-hidden />}
            {optLabel(o)}
          </button>
        );
      })}
    </div>
  );
}

/** Free tags: type and press Enter. */
export function TagInput({
  value,
  onChange,
  placeholder,
  label,
  max = 8,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  label: string;
  max?: number;
}) {
  const [draft, setDraft] = React.useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t) && value.length < max) onChange([...value, t.slice(0, 60)]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((t) => (
            <li
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
            >
              {t}
              <button
                type="button"
                aria-label={`Remove ${t}`}
                onClick={() => onChange(value.filter((x) => x !== t))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {value.length < max && (
        <Input
          aria-label={label}
          value={draft}
          placeholder={placeholder ?? "Type and press Enter"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
        />
      )}
    </div>
  );
}

/** A 1–5 rating as tappable dots. */
export function Dots({
  value,
  onChange,
  label,
  max = 5,
  low,
  high,
}: {
  value: number | null | undefined;
  onChange: (v: number) => void;
  label: string;
  max?: number;
  low?: string;
  high?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {low && <span className="hidden text-xs text-muted-foreground sm:inline">{low}</span>}
      <div role="radiogroup" aria-label={label} className="flex gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${label}: ${n} of ${max}`}
            onClick={() => onChange(n)}
            className={cn(
              "size-6 rounded-full border-2 transition-colors",
              value != null && n <= value
                ? "border-founder bg-founder"
                : "border-border bg-card hover:border-founder/60",
            )}
          />
        ))}
      </div>
      {high && <span className="hidden text-xs text-muted-foreground sm:inline">{high}</span>}
    </div>
  );
}

/** A number with an optional prefix (₹) or suffix (%, days). Empty means unknown. */
export function NumberField({
  value,
  onChange,
  label,
  prefix,
  suffix,
  min = 0,
  max,
  step = "any",
  placeholder,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  label: string;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number | "any";
  placeholder?: string;
}) {
  return (
    <div className="flex h-11 w-full items-center rounded-lg border border-input bg-card px-3 shadow-sm focus-within:ring-2 focus-within:ring-ring">
      {prefix && <span className="mr-1.5 text-sm text-muted-foreground">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        aria-label={label}
        className="h-full w-full min-w-0 bg-transparent text-base outline-none"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder ?? "—"}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(null);
          const n = Number(raw);
          if (Number.isFinite(n)) onChange(max !== undefined ? Math.min(n, max) : n);
        }}
      />
      {suffix && <span className="ml-1.5 shrink-0 text-sm text-muted-foreground">{suffix}</span>}
    </div>
  );
}

/** A list of small cards the founder can add to and remove from. */
export function RowList<T extends { id: string }>({
  items,
  onChange,
  newItem,
  renderItem,
  addLabel,
  max = 12,
  empty,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  renderItem: (item: T, set: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  addLabel: string;
  max?: number;
  empty?: string;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 && empty && (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      )}
      {items.map((item, i) => (
        <div
          key={item.id}
          className="relative rounded-lg border border-border bg-background/60 p-3 pr-10"
        >
          <button
            type="button"
            aria-label="Remove"
            onClick={() => onChange(items.filter((x) => x.id !== item.id))}
            className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
          {renderItem(
            item,
            (patch) => onChange(items.map((x) => (x.id === item.id ? { ...x, ...patch } : x))),
            i,
          )}
        </div>
      ))}
      {items.length < max && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, newItem()])}
        >
          <Plus aria-hidden /> {addLabel}
        </Button>
      )}
    </div>
  );
}

/** The live goals column (right side of every pillar). */
export function GoalsPanel({ goals, title = "Goals" }: { goals: Goal[]; title?: string }) {
  const done = goals.filter((g) => g.value !== null).length;
  return (
    <section
      aria-label={title}
      className="rounded-xl border border-border bg-card p-4"
      data-testid="goals"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Target className="size-4" aria-hidden /> {title}
        </h2>
        <span className="text-xs text-muted-foreground">
          {done} of {goals.length}
        </span>
      </div>
      <ul className="space-y-3">
        {goals.map((g) => (
          <li key={g.id} data-goal={g.id} className="min-w-0">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-muted-foreground">{g.title}</span>
              {g.value !== null && g.evidence && <EvidenceBadge label={g.evidence} />}
            </div>
            <div
              className={cn(
                "mt-0.5 flex items-center gap-1.5 break-words text-lg font-bold leading-tight",
                g.value === null && "text-muted-foreground/60",
              )}
              data-testid={`goal-${g.id}`}
            >
              {g.done && <Check className="size-4 shrink-0 text-actual" aria-label="Target met" />}
              {g.value ?? "—"}
            </div>
            {g.detail && <p className="mt-0.5 text-xs text-muted-foreground">{g.detail}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** An AI slot that isn't switched on yet. Never shows fake output. */
export function AiPlaceholder({ title, detail }: { title: string; detail?: string }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-lg border border-dashed border-ai bg-ai-soft/60 px-3 py-2.5 text-sm"
      data-testid="ai-placeholder"
    >
      <Sparkles className="mt-0.5 size-4 shrink-0 text-ai" aria-hidden />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-ai">{title}</span>
          <span className="rounded bg-card px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ai">
            AI · coming soon
          </span>
        </div>
        {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
      </div>
      <button type="button" disabled aria-disabled className="sr-only">
        {title}
      </button>
    </div>
  );
}

/** Horizontal bars, best first is up to the caller. */
export function Bars({
  items,
  max,
  format = (n) => n.toFixed(1),
  evidence,
}: {
  items: { id: string; label: string; value: number | null; highlight?: boolean }[];
  max?: number;
  format?: (n: number) => string;
  evidence?: EvidenceLabel;
}) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value ?? 0));
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {items.map((i) => (
          <li
            key={i.id}
            className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2 text-sm"
          >
            <span className={cn("truncate", i.highlight && "font-semibold")} title={i.label}>
              {i.highlight ? "★ " : ""}
              {i.label || "Untitled"}
            </span>
            <span className="h-3 overflow-hidden rounded-full bg-muted">
              <span
                className={cn("block h-full rounded-full", i.highlight ? "bg-founder" : "bg-ai")}
                style={{ width: `${Math.max(0, Math.min(100, ((i.value ?? 0) / top) * 100))}%` }}
              />
            </span>
            <span className="w-12 text-right font-semibold tabular-nums">
              {i.value === null ? "—" : format(i.value)}
            </span>
          </li>
        ))}
      </ul>
      {evidence && (
        <div className="flex justify-end">
          <EvidenceBadge label={evidence} />
        </div>
      )}
    </div>
  );
}

/** A 1–5 × 1–5 map (assumption map, needs matrix, positioning map). */
export function Quadrant({
  points,
  xLabel,
  yLabel,
  labels,
  hot = "tr",
}: {
  points: { id: string; x: number; y: number; label: string; you?: boolean }[];
  xLabel: string;
  yLabel: string;
  /** Top-left, top-right, bottom-left, bottom-right. */
  labels: [string, string, string, string];
  hot?: "tr" | "tl" | "br" | "bl" | null;
}) {
  const S = 240;
  const pos = (v: number) => ((v - 0.5) / 5) * S;
  const hotRect = {
    tr: { x: S / 2, y: 0 },
    tl: { x: 0, y: 0 },
    br: { x: S / 2, y: S / 2 },
    bl: { x: 0, y: S / 2 },
  };
  return (
    <figure className="mx-auto w-full max-w-xs">
      <svg
        viewBox={`-28 -8 ${S + 36} ${S + 36}`}
        className="w-full"
        role="img"
        aria-label={`${yLabel} by ${xLabel}`}
      >
        {hot && (
          <rect {...hotRect[hot]} width={S / 2} height={S / 2} className="fill-founder-soft" />
        )}
        <rect x={0} y={0} width={S} height={S} className="fill-none stroke-border" />
        <line x1={S / 2} y1={0} x2={S / 2} y2={S} className="stroke-border" strokeDasharray="4 4" />
        <line x1={0} y1={S / 2} x2={S} y2={S / 2} className="stroke-border" strokeDasharray="4 4" />
        {(
          [
            [6, 14, "start", labels[0]],
            [S - 6, 14, "end", labels[1]],
            [6, S - 6, "start", labels[2]],
            [S - 6, S - 6, "end", labels[3]],
          ] as const
        ).map(([x, y, a, t]) => (
          <text key={t} x={x} y={y} textAnchor={a} className="fill-muted-foreground text-[10px]">
            {t}
          </text>
        ))}
        {points.map((p, i) => {
          const cx = pos(p.x) + ((i % 3) - 1) * 6;
          const cy = S - pos(p.y) + ((i % 2) - 0.5) * 6;
          return (
            <g key={p.id}>
              <circle
                cx={cx}
                cy={cy}
                r={p.you ? 9 : 8}
                className={p.you ? "fill-founder" : "fill-ai"}
              />
              <text
                x={cx}
                y={cy + 3}
                textAnchor="middle"
                className="fill-white text-[8px] font-bold"
              >
                {p.label}
              </text>
            </g>
          );
        })}
        <text
          x={S / 2}
          y={S + 22}
          textAnchor="middle"
          className="fill-muted-foreground text-[11px]"
        >
          {xLabel} →
        </text>
        <text
          x={-14}
          y={S / 2}
          textAnchor="middle"
          transform={`rotate(-90 -14 ${S / 2})`}
          className="fill-muted-foreground text-[11px]"
        >
          {yLabel} →
        </text>
      </svg>
    </figure>
  );
}

/** A small multi-line chart for monthly series. */
export function LineChart({
  series,
  height = 180,
  format = (n) => String(Math.round(n)),
}: {
  series: { name: string; values: number[]; className: string }[];
  height?: number;
  format?: (n: number) => string;
}) {
  const W = 480;
  const H = height;
  const all = series.flatMap((s) => s.values);
  if (all.length === 0) return null;
  const lo = Math.min(0, ...all);
  const hi = Math.max(1, ...all);
  const n = Math.max(...series.map((s) => s.values.length));
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => H - ((v - lo) / (hi - lo || 1)) * H;
  return (
    <figure className="space-y-2">
      <svg
        viewBox={`-4 -8 ${W + 8} ${H + 24}`}
        className="w-full"
        role="img"
        aria-label={series.map((s) => s.name).join(", ")}
      >
        {lo < 0 && (
          <line
            x1={0}
            x2={W}
            y1={y(0)}
            y2={y(0)}
            className="stroke-danger/60"
            strokeDasharray="4 4"
          />
        )}
        <line x1={0} x2={W} y1={H} y2={H} className="stroke-border" />
        {series.map((s) => (
          <polyline
            key={s.name}
            fill="none"
            strokeWidth={2.5}
            className={s.className}
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          />
        ))}
        <text x={0} y={H + 16} className="fill-muted-foreground text-[11px]">
          Month 1
        </text>
        <text x={W} y={H + 16} textAnchor="end" className="fill-muted-foreground text-[11px]">
          Month {n}
        </text>
        <text x={W} y={y(hi) + 10} textAnchor="end" className="fill-muted-foreground text-[11px]">
          {format(hi)}
        </text>
      </svg>
      <figcaption className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <svg width="14" height="4" aria-hidden>
              <line x1="0" y1="2" x2="14" y2="2" strokeWidth="3" className={s.className} />
            </svg>
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

/** A small stat used inside sections. */
export function Stat({
  label,
  value,
  evidence,
  tone,
}: {
  label: string;
  value: string | null;
  evidence?: EvidenceLabel;
  tone?: "danger" | "good";
}) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/60 px-3 py-2">
      <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground">
        {label}
        {evidence && value !== null && <EvidenceBadge label={evidence} />}
      </div>
      <div
        className={cn(
          "text-lg font-bold tabular-nums",
          tone === "danger" && "text-danger",
          tone === "good" && "text-actual",
          value === null && "text-muted-foreground/60",
        )}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

/** The "Report out" block at the end of every pillar, reused in the Founder Pack. */
export function ReportOut({
  title,
  block,
  copy = true,
}: {
  title: string;
  block: ReportBlock;
  copy?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const text = [
    title,
    block.headline ?? "",
    ...block.lines.map((l) => `- ${l.label}: ${l.value}${l.evidence ? ` [${l.evidence}]` : ""}`),
  ]
    .filter(Boolean)
    .join("\n");
  return (
    <section
      className="rounded-xl border-2 border-founder/30 bg-founder-soft/40 p-4 sm:p-5"
      data-testid="report-out"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Report out · {title}</h2>
        {copy && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard?.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
          >
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </Button>
        )}
      </div>
      <ReportBody block={block} />
    </section>
  );
}

export function ReportBody({ block }: { block: ReportBlock }) {
  return (
    <div className="space-y-3">
      <p className={cn("font-medium", !block.headline && "text-muted-foreground")}>
        {block.headline ?? "Nothing to report yet. Fill in the steps above."}
      </p>
      {block.lines.length > 0 && (
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {block.lines.map((l) => (
            <div key={l.label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{l.label}</dt>
              <dd className="flex flex-wrap items-center gap-1.5 break-words text-sm font-medium">
                {l.value}
                {l.evidence && <EvidenceBadge label={l.evidence} />}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/** A note that a value came from another pillar (standalone pillars ask instead). */
export function FromUpstream({ pillar, children }: { pillar: string; children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-founder-soft px-3 py-2 text-xs text-founder">
      <span className="font-semibold">From {pillar}:</span> {children}
    </p>
  );
}
