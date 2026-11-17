/**
 * Number formatting shared by pillar goals and reports, so the same value
 * reads the same everywhere. Indian grouping (lakh, crore) for INR.
 */

const symbols: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  SGD: "S$",
};

export function currencySymbol(currency: string): string {
  return symbols[currency] ?? `${currency} `;
}

/** Compact money: ₹4.2 lakh, ₹1.3 crore, $12.5K, $3.1M. */
export function formatMoney(n: number, currency: string): string {
  const sign = n < 0 ? "−" : "";
  const a = Math.abs(n);
  const s = currencySymbol(currency);
  if (currency === "INR") {
    if (a >= 1e7) return `${sign}${s}${trim(a / 1e7)} crore`;
    if (a >= 1e5) return `${sign}${s}${trim(a / 1e5)} lakh`;
    return `${sign}${s}${Math.round(a).toLocaleString("en-IN")}`;
  }
  if (a >= 1e9) return `${sign}${s}${trim(a / 1e9)}B`;
  if (a >= 1e6) return `${sign}${s}${trim(a / 1e6)}M`;
  if (a >= 1e4) return `${sign}${s}${trim(a / 1e3)}K`;
  return `${sign}${s}${Math.round(a).toLocaleString("en-US")}`;
}

export function formatCount(n: number): string {
  if (Math.abs(n) >= 1e7) return `${trim(n / 1e7)} crore`;
  if (Math.abs(n) >= 1e5) return `${trim(n / 1e5)} lakh`;
  return Math.round(n).toLocaleString("en-IN");
}

export function formatPct(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

function trim(n: number): string {
  return n >= 100 ? Math.round(n).toString() : n.toFixed(1).replace(/\.0$/, "");
}

/** A number or null: treats NaN, Infinity and undefined as unknown. */
export function known(n: number | null | undefined): n is number {
  return typeof n === "number" && Number.isFinite(n);
}
