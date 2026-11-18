/** Pure helpers for the admin analytics (docs/decisions/0011). */

export interface Row {
  label: string;
  value: number;
}

export interface FunnelStage extends Row {
  /** % of the first stage. */
  ofStart: number;
  /** % lost since the previous stage. */
  dropFromPrev: number | null;
}

export function funnel(stages: { label: string; visitors: Set<string> }[]): FunnelStage[] {
  const first = stages[0]?.visitors.size ?? 0;
  return stages.map((s, i) => {
    const prev = i > 0 ? stages[i - 1]!.visitors.size : null;
    return {
      label: s.label,
      value: s.visitors.size,
      ofStart: first ? Math.round((s.visitors.size / first) * 100) : 0,
      dropFromPrev: prev ? Math.round(((prev - s.visitors.size) / prev) * 100) : null,
    };
  });
}
