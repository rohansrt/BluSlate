import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8fe",
    theme_color: "#004bfc",
    icons: [{ src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" }],
  };
}
