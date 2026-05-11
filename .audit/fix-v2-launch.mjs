#!/usr/bin/env node
// .audit/fix-v2-launch.mjs
// Pre-launch SEO repair pass after the v2 marketing site refresh.
//
// Fixes:
//   1. Any remaining generic twitter:title — set it to (title minus " | OpticWise")
//   2. Any remaining generic twitter:description — set it to the page's meta description
//   3. canonical / og:url pointing to opticwise-html.onrender.com → www.opticwise.com
//   4. Surgical brand fixes:
//        about/        — Peak Property Performance (book title) → Peak Property Performance®
//        customer-outcomes/ — same; plus "infrastructure" → "data & digital infrastructure";
//                             also drop duplicate "| OpticWise | OpticWise" from title/og
//   5. Insights titles >70 chars that end in " | OpticWise" — drop the trailing suffix
//
// Run: node .audit/fix-v2-launch.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e.startsWith(".") || e === "node_modules" || e === "api" || e === "images" || e === "blog" || e === "opticwise-mcp-bundle" || e === "scripts") continue;
    const full = join(dir, e);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (e === "index.html" || e === "404.html") out.push(full);
  }
  return out;
}

const GENERIC_TITLE = "OpticWise | Own Your Data &amp; Digital Infrastructure";
const GENERIC_TITLE_DECODED = "OpticWise | Own Your Data & Digital Infrastructure";
const GENERIC_DESC = "How OpticWise operates: design, implement, and run managed data &amp; digital infrastructure plus the owner-controlled intelligence layer — without taxing on-site teams.";
const GENERIC_DESC_2 = "How OpticWise operates: design, implement, and run managed data & digital infrastructure plus the owner-controlled intelligence layer — without taxing on-site teams.";

const summary = [];

for (const file of walk(ROOT).sort()) {
  let h = readFileSync(file, "utf8");
  const orig = h;
  const rel = file.replace(ROOT + "/", "");
  const isInsight = rel.startsWith("insights/");

  // 1. canonical / og:url staging → production
  h = h.replace(/https:\/\/opticwise-html\.onrender\.com/g, "https://www.opticwise.com");

  // 2. Extract current title and description for use in social cards
  const titleMatch = h.match(/<title>([^<]*)<\/title>/);
  const title = titleMatch ? titleMatch[1] : "";
  const descMatch = h.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/);
  const desc = descMatch ? descMatch[1] : "";

  // 3. Replace generic twitter:title — set to title minus " | OpticWise" suffix
  if (title) {
    const ogTitleVal = title.replace(/\s*\|\s*OpticWise\s*$/, "");
    // Generic twitter:title detection (matches the generic content from v2 polish)
    h = h.replace(
      /(<meta[^>]*name=["']twitter:title["'][^>]*content=["'])OpticWise \| Own Your Data &amp; Digital Infrastructure(["'])/,
      `$1${ogTitleVal}$2`
    );
    h = h.replace(
      /(<meta[^>]*name=["']twitter:title["'][^>]*content=["'])OpticWise \| Own Your Data & Digital Infrastructure(["'])/,
      `$1${ogTitleVal}$2`
    );
    // Also fix any generic og:title (twin pattern)
    h = h.replace(
      /(<meta[^>]*property=["']og:title["'][^>]*content=["'])OpticWise \| Own Your Data &amp; Digital Infrastructure(["'])/,
      `$1${ogTitleVal}$2`
    );
  }

  // 4. Replace generic twitter:description — set to page description
  if (desc) {
    h = h.replace(
      new RegExp(
        `(<meta[^>]*name=["']twitter:description["'][^>]*content=["'])${escapeRe(GENERIC_DESC)}(["'])`,
        "g"
      ),
      `$1${desc}$2`
    );
    h = h.replace(
      new RegExp(
        `(<meta[^>]*name=["']twitter:description["'][^>]*content=["'])${escapeRe(GENERIC_DESC_2)}(["'])`,
        "g"
      ),
      `$1${desc}$2`
    );
    // Same for og:description if it's generic
    h = h.replace(
      new RegExp(
        `(<meta[^>]*property=["']og:description["'][^>]*content=["'])${escapeRe(GENERIC_DESC)}(["'])`,
        "g"
      ),
      `$1${desc}$2`
    );
    h = h.replace(
      new RegExp(
        `(<meta[^>]*property=["']og:description["'][^>]*content=["'])${escapeRe(GENERIC_DESC_2)}(["'])`,
        "g"
      ),
      `$1${desc}$2`
    );
  }

  // 5. Insights titles >70 chars ending in " | OpticWise" — drop the suffix
  if (isInsight && title.length > 70 && / \| OpticWise$/.test(title)) {
    const trimmed = title.replace(/ \| OpticWise$/, "");
    if (trimmed.length <= 70) {
      h = h.replace(`<title>${title}</title>`, `<title>${trimmed}</title>`);
      // Also strip from og:title / twitter:title if present with the suffix
      h = h.replace(
        new RegExp(`(<meta[^>]*property=["']og:title["'][^>]*content=["'])${escapeRe(title)}(["'])`),
        `$1${trimmed}$2`
      );
      h = h.replace(
        new RegExp(`(<meta[^>]*name=["']twitter:title["'][^>]*content=["'])${escapeRe(title)}(["'])`),
        `$1${trimmed}$2`
      );
    }
  }

  // 6. Surgical brand fixes on specific top-level pages
  if (/\/about\/index\.html$/.test(file)) {
    // Two body refs: book title and podcast name — both need Peak Property Performance®
    h = h.replace(
      /co-authored Peak Property Performance: Game-Changing/g,
      "co-authored Peak Property Performance®: Game-Changing"
    );
    h = h.replace(
      /the Peak Property Performance podcast/g,
      "the Peak Property Performance® podcast"
    );
  }
  if (/\/customer-outcomes\/index\.html$/.test(file)) {
    h = h.replace(
      /documented in Peak Property Performance: Game-Changing/g,
      "documented in Peak Property Performance®: Game-Changing"
    );
    // Drop duplicate " | OpticWise" in title/og where the v2 script may have appended
    h = h.replace(
      /<title>Customer Outcomes — What OpticWise Earns the Owner \| OpticWise<\/title>/,
      "<title>Customer Outcomes — What OpticWise Earns the Owner | OpticWise</title>"
    );
    // Both end with " | OpticWise" — make sure not doubled
    h = h.replace(
      /Customer Outcomes — What OpticWise Earns the Owner \| OpticWise \| OpticWise/g,
      "Customer Outcomes — What OpticWise Earns the Owner | OpticWise"
    );
    // BARE_INFRA: "both on infrastructure the owner controls" → "both on data & digital infrastructure the owner controls"
    h = h.replace(
      /both on infrastructure the owner controls/g,
      "both on data &amp; digital infrastructure the owner controls"
    );
  }

  if (h !== orig) {
    writeFileSync(file, h);
    summary.push(`updated ${rel}`);
  }
}

console.log(`Updated ${summary.length} files:`);
for (const s of summary) console.log("  " + s);

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
