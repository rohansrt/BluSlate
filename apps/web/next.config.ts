import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: [
    "@bluslate/contracts",
    "@bluslate/ui",
    "@bluslate/pillar-discover",
    "@bluslate/pillar-customers",
    "@bluslate/pillar-market",
    "@bluslate/pillar-build",
    "@bluslate/pillar-setup",
    "@bluslate/pillar-gtm",
    "@bluslate/pillar-run-grow",
  ],
  turbopack: { root: path.join(import.meta.dirname, "../..") },
  poweredByHeader: false,
};

export default nextConfig;
