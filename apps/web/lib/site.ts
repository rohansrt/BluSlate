/** Site-wide constants used by pages, metadata, the sitemap and legal pages. */
export const site = {
  name: "BluSlate",
  tagline: "Test a business idea before you spend real money on it.",
  description:
    "BluSlate walks you through seven founder steps, runs your idea in a simulated market month by month, and hands you a Founder Pack. Every number is labelled real, sourced, assumed, estimated or simulated.",
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
      ? "https://bluslate.yoppi.in"
      : "http://localhost:3000")
  ).replace(/\/$/, ""),
  contactEmail: "founder@yoppi.in",
  ecosystem: { name: "YOPPI", url: "https://yoppi.in" },
  legalUpdated: "17 November 2026",
  /**
   * Email sign-in is switched off for now (docs/decisions/0002): onboarding
   * creates a private guest workspace in this browser instead. Set
   * NEXT_PUBLIC_REQUIRE_SIGN_IN=true to bring back step 4, "Save your startup".
   */
  signInRequired: process.env.NEXT_PUBLIC_REQUIRE_SIGN_IN === "true",
} as const;

export function absoluteUrl(path = "/"): string {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
