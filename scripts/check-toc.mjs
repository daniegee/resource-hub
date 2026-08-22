#!/usr/bin/env node
// Verifies the "## Contents" list in README.md matches the document's
// ## and ### headings, in order, with correct GitHub-style anchors.

import { readFileSync } from "node:fs";

const FILE = "README.md";
const lines = readFileSync(FILE, "utf8").split(/\r?\n/);

function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/[^\w\- ]/g, "")
    .replace(/ /g, "-");
}

const expected = [];
for (const line of lines) {
  const match = /^(##|###)\s+(.+?)\s*$/.exec(line);
  if (!match) continue;
  const [, hashes, text] = match;
  if (text === "Contents") continue;
  expected.push({ level: hashes.length === 2 ? 0 : 1, text, anchor: slugify(text) });
}

const contentsIdx = lines.findIndex((line) => line.trim() === "## Contents");
if (contentsIdx === -1) {
  console.error("Could not find a '## Contents' heading in README.md");
  process.exit(1);
}

const actual = [];
for (let i = contentsIdx + 1; i < lines.length; i++) {
  const match = /^(\s*)- \[(.+?)\]\(#(.+?)\)\s*$/.exec(lines[i]);
  if (!match) {
    if (actual.length === 0 && lines[i].trim() === "") continue;
    break;
  }
  const [, indent, text, anchor] = match;
  actual.push({ level: indent.length >= 2 ? 1 : 0, text, anchor });
}

let ok = true;
const max = Math.max(expected.length, actual.length);
for (let i = 0; i < max; i++) {
  const e = expected[i];
  const a = actual[i];
  if (!e || !a || e.text !== a.text || e.anchor !== a.anchor || e.level !== a.level) {
    ok = false;
    console.error(
      `Mismatch at TOC entry ${i + 1}:\n  expected: ${e ? JSON.stringify(e) : "(none)"}\n  actual:   ${a ? JSON.stringify(a) : "(none)"}`,
    );
  }
}

if (!ok) {
  console.error(
    "\nThe '## Contents' section is out of sync with the document's headings. Update the TOC to match.",
  );
  process.exit(1);
}

console.log(`TOC check passed (${actual.length} entries).`);
