import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

/**
 * CLAUDE.md architecture rule 4: pillars never import each other, and shared
 * packages never depend on pillars. These run the repo's real ESLint config
 * against sample code placed in pillar and package folders.
 */
const root = path.resolve(import.meta.dirname, "../..");
const eslint = new ESLint({ cwd: root });

async function restrictedImportErrors(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath: path.join(root, filePath) });
  return (result?.messages ?? []).filter((m) => m.ruleId === "no-restricted-imports");
}

describe("import boundaries", () => {
  it("stops a pillar importing another pillar's package", async () => {
    const errors = await restrictedImportErrors(
      'import { customersModule } from "@bluslate/pillar-customers";\nexport const x = customersModule;\n',
      "pillars/01-discover/src/sample.ts",
    );
    expect(errors).toHaveLength(1);
  });

  it("stops a pillar importing another pillar's UI entry", async () => {
    const errors = await restrictedImportErrors(
      'import { MarketScreen } from "@bluslate/pillar-market/ui";\nexport const x = MarketScreen;\n',
      "pillars/04-build/ui/sample.tsx",
    );
    expect(errors).toHaveLength(1);
  });

  it("stops a pillar reaching into another pillar's folder by path", async () => {
    const errors = await restrictedImportErrors(
      'import { gtmModule } from "../../06-gtm/src/module";\nexport const x = gtmModule;\n',
      "pillars/07-run-grow/src/sample.ts",
    );
    expect(errors).toHaveLength(1);
  });

  it("allows a pillar to use shared packages and its own files", async () => {
    const errors = await restrictedImportErrors(
      [
        'import { PILLARS } from "@bluslate/contracts";',
        'import { Badge } from "@bluslate/ui";',
        'import { discoverModule } from "../src/module";',
        "export const x = [PILLARS, Badge, discoverModule];",
        "",
      ].join("\n"),
      "pillars/01-discover/ui/sample.tsx",
    );
    expect(errors).toHaveLength(0);
  });

  it("stops shared packages depending on pillars", async () => {
    const errors = await restrictedImportErrors(
      'import { discoverModule } from "@bluslate/pillar-discover";\nexport const x = discoverModule;\n',
      "packages/twin/src/sample.ts",
    );
    expect(errors).toHaveLength(1);
  });

  it("lets the app wire pillars together", async () => {
    const errors = await restrictedImportErrors(
      'import { discoverModule } from "@bluslate/pillar-discover";\nexport const x = discoverModule;\n',
      "apps/web/lib/sample.ts",
    );
    expect(errors).toHaveLength(0);
  });

  it("stops the AI gateway importing the Twin, so AI can never publish (G5)", async () => {
    const errors = await restrictedImportErrors(
      'import { createTwin } from "@bluslate/twin";\nexport const x = createTwin;\n',
      "packages/ai/src/sample.ts",
    );
    expect(errors).toHaveLength(1);
  });
});
