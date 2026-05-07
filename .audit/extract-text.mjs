#!/usr/bin/env node
// One-off audit helper: strip <script>/<style>/tags from each page's index.html
// and write a flat text file to .audit/<page>.txt, one paragraph per line.
// Run from repo root: node .audit/extract-text.mjs

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = __dirname;

const TOP_LEVEL = [
  "index.html",
  "about/index.html",
  "advisory-services/index.html",
  "ai-ready-commercial-real-estate/index.html",
  "blog/index.html",
  "bot-building-of-things/index.html",
  "contact/index.html",
  "contact-cowork-dupe-please-delete/index.html",
  "control-cre-digital-visibility/index.html",
  "digital-infrastructure-noi-ai/index.html",
  "digital-infrastructure-noi-playbook/index.html",
  "digital-infrastructure-noi-strategy/index.html",
  "faq/index.html",
  "for-asset-managers/index.html",
  "for-it-executives/index.html",
  "for-lps-and-financiers/index.html",
  "for-property-managers-and-engineers/index.html",
  "for-tenants/index.html",
  "glossary/index.html",
  "how-we-operate/index.html",
  "own-vs-lease-cre-building-data/index.html",
  "portfolio-brain/index.html",
  "ppp-audit/index.html",
  "property-brain/index.html",
  "5s-user-experience-standard/index.html",
];

function extractText(html) {
  let s = html;
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<\/(p|div|section|article|header|footer|nav|main|li|h[1-6]|tr|br)>/gi, "\n");
  s = s.replace(/<br\s*\/?>(?!\n)/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&nbsp;/g, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#x27;|&apos;/g, "'");
  s = s.replace(/&[a-z]+;/gi, " ");
  s = s.replace(/[ \t]+/g, " ");
  s = s.split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
  return s;
}

mkdirSync(OUT, { recursive: true });
const summary = [];
for (const rel of TOP_LEVEL) {
  const src = join(ROOT, rel);
  try {
    const html = readFileSync(src, "utf8");
    const text = extractText(html);
    const slug = rel.replace(/\/index\.html$/, "").replace(/\//g, "_") || "home";
    const dest = join(OUT, `${slug}.txt`);
    writeFileSync(dest, text + "\n");
    summary.push(`${slug}: ${text.length} chars`);
  } catch (e) {
    summary.push(`${rel}: ERROR ${e.message}`);
  }
}
writeFileSync(join(OUT, "_pages.txt"), summary.join("\n") + "\n");
console.log(summary.join("\n"));
