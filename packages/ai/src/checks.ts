/**
 * Post-output checks the gateway runs before anything reaches the UI
 * (Appendix A.0, guardrails G2 and G3).
 */

/** Numbers that appear in prose: integers and decimals, with or without thousands separators. */
const NUMBER = /(?<![\w.])[-+]?\d[\d,]*(?:\.\d+)?/g;

function normalise(n: string) {
  return n.replace(/,/g, "").replace(/^\+/, "").replace(/\.0+$/, "");
}

/** Every string inside a value, recursively. */
export function stringsIn(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === "object") return Object.values(value).flatMap(stringsIn);
  return [];
}

/** Numbers in `output` text that don't appear anywhere in `input` (G3). */
export function inventedNumbers(output: unknown, input: unknown): string[] {
  const allowed = new Set(
    [...JSON.stringify(input ?? null).matchAll(NUMBER)].map((m) => normalise(m[0])),
  );
  const found = stringsIn(output).flatMap((s) =>
    [...s.matchAll(NUMBER)].map((m) => normalise(m[0])),
  );
  return [...new Set(found.filter((n) => !allowed.has(n)))];
}
