import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "apps/web") },
  },
  test: {
    include: [
      "apps/**/*.test.ts",
      "packages/**/*.test.ts",
      "pillars/**/*.test.ts",
      "worker/**/*.test.ts",
      "tests/architecture/**/*.test.ts",
    ],
    exclude: ["**/node_modules/**", "tests/e2e/**", "**/.next/**"],
    environment: "node",
  },
});
