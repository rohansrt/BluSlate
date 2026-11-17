import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: [
    "@bluslate/ai",
    "@bluslate/contracts",
    "@bluslate/twin",
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
  // The floating dev-tools bubble covers bottom-left buttons on phones (and in tests).
  devIndicators: false,
};

export default nextConfig;
