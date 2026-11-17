import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/startups", "/api/", "/signin", "/admin", "/profile"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
