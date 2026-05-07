#!/usr/bin/env node
// Run from repo root: node .audit/check.mjs
// Reads every .audit/<page>.txt file and reports:
//  - bare trademark uses (e.g., "Property Brain" without ™)
//  - banned words / phrases
//  - "infrastructure" without "data & digital " or "digital infrastructure" prefix
//  - missing reframing line / default closer
//  - "audit" outside the PPP Audit™ trademark context

import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SKIP = new Set(["_pages.txt", "_audit-report.txt"]);
const files = readdirSync(__dirname)
  .filter((f) => f.endsWith(".txt") && !SKIP.has(f))
  .sort();

const REFRAMING_LINE =
  "If you don't own your data & digital infrastructure, your vendors do";
const DEFAULT_CLOSER =
  "Own your data & digital infrastructure. Operate with strategic foresight. Build for the long game";

const BANNED = [
  /\bleverag\w*/gi,
  /\bsynergy\b/gi,
  /\bsynergies\b/gi,
  /\becosystem\b/gi,
  /\bholistic\b/gi,
  /\bcutting[- ]edge\b/gi,
  /\bESG\b/g,
  /\bPropTech\b/gi,
  /\bprop[- ]tech\b/gi,
  /\bREIT(s)?\b/g,
];

// Trademark patterns (find bare uses)
const MARKS = [
  { name: "Property Brain", re: /Property Brain(?!™)/g },
  { name: "Portfolio Brain", re: /Portfolio Brain(?!™)/g },
  { name: "BoT", re: /\bBoT(?!®)/g },
  { name: "Building of Things", re: /Building of Things(?!®)/g },
  { name: "ElasticISP", re: /ElasticISP(?!®)/g },
  { name: "Peak Property Performance", re: /Peak Property Performance(?!®)/g },
  { name: "PPP 5C", re: /PPP 5C(?!™)/g },
  { name: "PPP Audit", re: /PPP Audit(?!™)/g },
  { name: "5S", re: /\b5S(?!®)(?![a-zA-Z0-9])/g },
  { name: "SIC", re: /\bSIC\b(?!®)/g },
];

// "infrastructure" not preceded by "data & digital " or "digital "
const BARE_INFRA =
  /(?<!data & digital )(?<!digital )(?<!Digital )(?<!data & Digital )(?<!\bdata & digital )(?<!Data & Digital )(?<!Data & digital )(?<!\.\s)(?<!^)\binfrastructure\b/g;

const lines = (text) => text.split(/\n/);

function findOccurrences(text, re) {
  const out = [];
  const ls = lines(text);
  for (let i = 0; i < ls.length; i++) {
    const l = ls[i];
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(l)) !== null) {
      out.push({ line: i + 1, snippet: l, match: m[0], index: m.index });
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }
  return out;
}

function shortSnippet(line, idx, len) {
  const start = Math.max(0, idx - 40);
  const end = Math.min(line.length, idx + len + 40);
  return (start > 0 ? "…" : "") + line.slice(start, end) + (end < line.length ? "…" : "");
}

const report = [];
const summary = {};

for (const f of files) {
  const text = readFileSync(join(__dirname, f), "utf8");
  const pageId = f.replace(/\.txt$/, "");
  const pageReport = [];

  // Banned words
  for (const re of BANNED) {
    const occ = findOccurrences(text, new RegExp(re.source, re.flags));
    for (const o of occ) {
      pageReport.push(
        `  [BANNED] L${o.line} "${o.match}" — ${shortSnippet(o.snippet, o.index, o.match.length)}`
      );
    }
  }

  // Trademark coverage
  for (const m of MARKS) {
    const occ = findOccurrences(text, new RegExp(m.re.source, m.re.flags));
    // Skip occurrences that are part of the page title bar or nav listing the suite ("Property Brain™ Portfolio Brain™ PPP Audit™ ..." -- but those already have marks)
    for (const o of occ) {
      pageReport.push(
        `  [BARE TM] L${o.line} "${m.name}" missing mark — ${shortSnippet(o.snippet, o.index, o.match.length)}`
      );
    }
  }

  // "infrastructure" without "data & digital " prefix
  const infra = findOccurrences(text, new RegExp(BARE_INFRA.source, BARE_INFRA.flags));
  for (const o of infra) {
    pageReport.push(
      `  [BARE-INFRA] L${o.line} — ${shortSnippet(o.snippet, o.index, "infrastructure".length)}`
    );
  }

  // Reframing line / default closer presence
  const hasReframing = text.includes(REFRAMING_LINE);
  const hasCloser = text.includes(DEFAULT_CLOSER);

  summary[pageId] = {
    issues: pageReport.length,
    hasReframing,
    hasCloser,
  };

  if (pageReport.length || !hasReframing || !hasCloser) {
    report.push(`\n=== ${pageId} ===`);
    if (!hasReframing) report.push(`  [MISSING] Reframing line absent on page`);
    if (!hasCloser) report.push(`  [MISSING] Default closer absent on page`);
    report.push(...pageReport);
  } else {
    report.push(`\n=== ${pageId} === CLEAN`);
  }
}

console.log(report.join("\n"));
console.log("\n=== SUMMARY ===");
const rows = Object.entries(summary).map(([k, v]) => ({
  page: k,
  issues: v.issues,
  reframe: v.hasReframing ? "Y" : "—",
  closer: v.hasCloser ? "Y" : "—",
}));
const colW = {
  page: Math.max(4, ...rows.map((r) => r.page.length)),
};
console.log(
  `${"PAGE".padEnd(colW.page)}  ISSUES  REFRAME  CLOSER`
);
for (const r of rows) {
  console.log(
    `${r.page.padEnd(colW.page)}  ${String(r.issues).padStart(6)}  ${r.reframe.padStart(7)}  ${r.closer.padStart(6)}`
  );
}
