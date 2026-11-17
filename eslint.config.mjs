import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "apps/web/lib/generated/**",
      "apps/web/next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
      "docs/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Next.js rules for the web app.
  ...nextVitals.map((config) => ({ ...config, files: ["apps/web/**/*.{ts,tsx}"] })),
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    settings: { next: { rootDir: "apps/web" } },
  },

  // Architecture rule 4: pillars never import each other (enforced per pillar from S2).
  {
    files: ["pillars/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@bluslate/pillar-*"],
              message: "Pillars never import each other. Read Twin entities instead.",
            },
            {
              group: ["**/pillars/**", "../0*"],
              message: "Pillars never import each other. Read Twin entities instead.",
            },
          ],
        },
      ],
    },
  },

  // Plain Node scripts.
  {
    files: ["**/*.mjs", "scripts/**"],
    languageOptions: { globals: { console: "readonly", process: "readonly" } },
  },

  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
