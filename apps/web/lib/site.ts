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
  legalUpdated: "18 November 2026",
  /**
   * The demo video on Home (docs/decisions/0009): a YouTube link, or a video
   * file such as /demo/bluslate-demo.mp4 in apps/web/public. Home hides the
   * section until this is set.
   */
  demoVideoUrl: process.env.NEXT_PUBLIC_DEMO_VIDEO_URL?.trim() || null,
} as const;

export function absoluteUrl(path = "/"): string {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
