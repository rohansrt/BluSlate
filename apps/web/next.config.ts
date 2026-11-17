import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@bluslate/ui"],
  turbopack: { root: path.join(import.meta.dirname, "../..") },
  poweredByHeader: false,
};

export default nextConfig;
