import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/** Public pages only; signed-in areas are excluded and disallowed in robots.ts. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-17");
  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/about"), lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/cookies"), lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
