import type { SharedFacts } from "@bluslate/contracts";

/**
 * Shared facts between steps (decision 0012), the pure part: which facts a
 * save changed. lib/workspace.ts copies them into the other steps.
 */

/** JSON with sorted keys: Postgres jsonb doesn't keep key order. */
export function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v)
      .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

/** The facts whose value changed, with what they said before. */
export function changedFacts(before: SharedFacts, after: SharedFacts) {
  const next: SharedFacts = {};
  const prev: SharedFacts = {};
  for (const key of Object.keys(after) as (keyof SharedFacts)[]) {
    if (after[key] === undefined || stable(after[key]) === stable(before[key])) continue;
    (next as Record<string, unknown>)[key] = after[key];
    (prev as Record<string, unknown>)[key] = before[key];
  }
  return { next, prev };
}
