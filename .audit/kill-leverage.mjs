#!/usr/bin/env node
// Phase 3B — replace banned word "leverage" across 5 marketing pages.
// Each entry: { file, find, replaceWith, expectedHits }.
// We replace globally per-page so visible HTML + SSR-hydration JSON stay in sync.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const EDITS = [
  // ppp-audit
  {
    file: "ppp-audit/index.html",
    find: "the real leverage points.",
    replace: "the real decision points.",
    expect: 2, // visible HTML + JSON
  },
  // portfolio-brain
  {
    file: "portfolio-brain/index.html",
    find: "operating data leverage doesn't exist",
    replace: "operating-data advantage doesn't exist",
    expect: 2,
  },
  {
    file: "portfolio-brain/index.html",
    find: "highest-leverage play across the portfolio",
    replace: "highest-impact play across the portfolio",
    expect: 2,
  },
  // for-asset-managers — heading "Vendor Leverage You Didn't Have"
  {
    file: "for-asset-managers/index.html",
    find: "Vendor Leverage You Didn't Have",
    replace: "Negotiating Power You Didn't Have",
    expect: 2,
  },
  {
    file: "for-asset-managers/index.html",
    find: "the play with the highest leverage",
    replace: "the highest-impact play",
    expect: 2,
  },
  // glossary
  {
    file: "glossary/index.html",
    find: "control the leverage; owners who don",
    replace: "control the upside; owners who don",
    expect: 2,
  },
  {
    file: "glossary/index.html",
    find: "three highest-leverage moves",
    replace: "three highest-impact moves",
    expect: 2,
  },
  // contact
  {
    file: "contact/index.html",
    find: "where the leverage is",
    replace: "where the recoverable NOI sits",
    expect: 2,
  },
];

const report = [];
for (const e of EDITS) {
  const path = join(ROOT, e.file);
  let s = readFileSync(path, "utf8");
  // Count and replace globally.
  const re = new RegExp(e.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  const matches = (s.match(re) || []).length;
  if (matches === 0) { report.push(`${e.file}: NO MATCH for "${e.find.slice(0,50)}…"`); continue; }
  s = s.replace(re, e.replace);
  writeFileSync(path, s, "utf8");
  report.push(`${e.file}: replaced ${matches}× "${e.find.slice(0,40)}…" (expected ${e.expect})`);
}
console.log(report.join("\n"));
