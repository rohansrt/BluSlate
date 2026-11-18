// Copies docs/BLUSLATE_SPEC.md into docs/HANDOVER.md between the SPEC markers, so
// that one file carries the full, current spec (for new Claude sessions).
// Run: pnpm docs:handover. A unit test fails if the copy falls behind.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const readmePath = path.join(root, "docs/HANDOVER.md");
const spec = readFileSync(path.join(root, "docs/BLUSLATE_SPEC.md"), "utf8").trimEnd();
const readme = readFileSync(readmePath, "utf8");

const START =
  "<!-- SPEC:START (generated from docs/BLUSLATE_SPEC.md by `pnpm docs:handover`; do not edit here) -->";
const END = "<!-- SPEC:END -->";
const a = readme.indexOf(START);
const b = readme.indexOf(END);
if (a === -1 || b === -1 || b < a) {
  console.error("docs/HANDOVER.md is missing the SPEC:START / SPEC:END markers.");
  process.exit(1);
}
const next = `${readme.slice(0, a + START.length)}\n\n${spec}\n\n${readme.slice(b)}`;
if (next !== readme) {
  writeFileSync(readmePath, next);
  console.log("docs/HANDOVER.md: embedded spec updated.");
} else {
  console.log("docs/HANDOVER.md: embedded spec already current.");
}
