// Copies docs/BLUSLATE_SPEC.md into README.md between the SPEC markers, so the
// README alone carries the full, current spec (for new Claude sessions).
// Run: pnpm docs:readme. A unit test fails if the copy falls behind.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const readmePath = path.join(root, "README.md");
const spec = readFileSync(path.join(root, "docs/BLUSLATE_SPEC.md"), "utf8").trimEnd();
const readme = readFileSync(readmePath, "utf8");

const START =
  "<!-- SPEC:START (generated from docs/BLUSLATE_SPEC.md by `pnpm docs:readme`; do not edit here) -->";
const END = "<!-- SPEC:END -->";
const a = readme.indexOf(START);
const b = readme.indexOf(END);
if (a === -1 || b === -1 || b < a) {
  console.error("README.md is missing the SPEC:START / SPEC:END markers.");
  process.exit(1);
}
const next = `${readme.slice(0, a + START.length)}\n\n${spec}\n\n${readme.slice(b)}`;
if (next !== readme) {
  writeFileSync(readmePath, next);
  console.log("README.md: embedded spec updated.");
} else {
  console.log("README.md: embedded spec already current.");
}
