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

  // Architecture rule 4: pillars never import each other. They meet only through
  // Twin entities and Proposals. Shared packages never depend on pillars either.
  {
    files: ["pillars/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@bluslate/pillar-*", "@bluslate/pillar-*/**"],
              message:
                "Pillars never import each other. Read Twin entities or send a Proposal instead.",
            },
            {
              group: ["**/pillars/**", "**/0[1-7]-*", "**/0[1-7]-*/**"],
              message:
                "Pillars never import each other. Read Twin entities or send a Proposal instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@bluslate/pillar-*", "@bluslate/pillar-*/**", "**/pillars/**"],
              message: "Shared packages must not depend on pillars.",
            },
          ],
        },
      ],
    },
  },

  // G5: the AI gateway can never publish, so it can't import the Twin.
  {
    files: ["packages/ai/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@bluslate/twin", "@bluslate/twin/**", "@bluslate/pillar-*", "**/pillars/**"],
              message:
                "The AI gateway must not touch the Twin or pillars: AI output is a draft the app saves.",
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
