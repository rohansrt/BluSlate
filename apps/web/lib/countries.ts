/**
 * Countries offered during onboarding, with their ISO 4217 currency.
 * The currency is a default the founder can change later; it is not a claim
 * about where the business will trade.
 */
export const COUNTRIES = [
  { code: "IN", name: "India", currency: "INR" },
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "BD", name: "Bangladesh", currency: "BDT" },
  { code: "BR", name: "Brazil", currency: "BRL" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "EG", name: "Egypt", currency: "EGP" },
  { code: "ES", name: "Spain", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "GH", name: "Ghana", currency: "GHS" },
  { code: "ID", name: "Indonesia", currency: "IDR" },
  { code: "IE", name: "Ireland", currency: "EUR" },
  { code: "IT", name: "Italy", currency: "EUR" },
  { code: "JP", name: "Japan", currency: "JPY" },
  { code: "KE", name: "Kenya", currency: "KES" },
  { code: "LK", name: "Sri Lanka", currency: "LKR" },
  { code: "MX", name: "Mexico", currency: "MXN" },
  { code: "MY", name: "Malaysia", currency: "MYR" },
  { code: "NG", name: "Nigeria", currency: "NGN" },
  { code: "NL", name: "Netherlands", currency: "EUR" },
  { code: "NP", name: "Nepal", currency: "NPR" },
  { code: "NZ", name: "New Zealand", currency: "NZD" },
  { code: "PH", name: "Philippines", currency: "PHP" },
  { code: "PK", name: "Pakistan", currency: "PKR" },
  { code: "QA", name: "Qatar", currency: "QAR" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR" },
  { code: "SG", name: "Singapore", currency: "SGD" },
  { code: "TH", name: "Thailand", currency: "THB" },
  { code: "US", name: "United States", currency: "USD" },
  { code: "VN", name: "Vietnam", currency: "VND" },
  { code: "ZA", name: "South Africa", currency: "ZAR" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]];

export function countryByCode(code: string) {
  return COUNTRIES.find((c) => c.code === code);
}

/** India first (BluSlate's home market), then alphabetical by name. */
export const COUNTRY_OPTIONS = [
  ...COUNTRIES.filter((c) => c.code === "IN"),
  ...COUNTRIES.filter((c) => c.code !== "IN").sort((a, b) => a.name.localeCompare(b.name)),
];
