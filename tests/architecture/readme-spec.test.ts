import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** The README carries the full spec for new Claude sessions; it must never fall behind. */
const root = path.resolve(import.meta.dirname, "../..");

describe("README", () => {
  it("embeds the current docs/BLUSLATE_SPEC.md word for word (run `pnpm docs:readme` to refresh)", () => {
    const readme = readFileSync(path.join(root, "README.md"), "utf8");
    const spec = readFileSync(path.join(root, "docs/BLUSLATE_SPEC.md"), "utf8").trimEnd();
    const start = readme.indexOf("<!-- SPEC:START");
    const end = readme.indexOf("<!-- SPEC:END -->");
    expect(start, "SPEC:START marker").toBeGreaterThan(-1);
    expect(end, "SPEC:END marker").toBeGreaterThan(start);
    const embedded = readme.slice(readme.indexOf("-->", start) + 3, end).trim();
    expect(embedded).toBe(spec);
  });
});
