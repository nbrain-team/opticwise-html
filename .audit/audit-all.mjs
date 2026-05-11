#!/usr/bin/env node
// .audit/audit-all.mjs
// Walks every index.html in the static site (top-level + /insights/<slug>/)
// and audits BOTH dimensions:
//   1. SB7 BrandScript canon (banned words, bare trademarks, bare "infrastructure",
//      missing reframing line, missing default closer)
//   2. SEO hygiene (title presence/length/dup-OpticWise, meta description,
//      canonical, OG/Twitter tags, JSON-LD presence + Article.description null
//      detection, H1 presence, hero image alt presence on insights)
//
// Run from repo root:  node .audit/audit-all.mjs
// Outputs: .audit/AUDIT-ALL.json + a printed summary table.

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// -----------------------------------------------------------------------------
// 1. Collect every index.html in the site (skip node_modules, .git, .audit, api)
// -----------------------------------------------------------------------------
function walk(dir, out = []) {
  const entries = readdirSync(dir);
  for (const e of entries) {
    if (
      e.startsWith(".") ||
      e === "node_modules" ||
      e === "api" ||
      e === "images" ||
      e === "blog"
    )
      continue;
    const full = join(dir, e);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (e === "index.html" || e === "404.html") {
      out.push(full);
    }
  }
  return out;
}
const FILES = walk(ROOT).sort();

// -----------------------------------------------------------------------------
// 2. SB7 BrandScript checks
// -----------------------------------------------------------------------------
const REFRAMING_LINE =
  "If you don't own your data & digital infrastructure, your vendors do";
const DEFAULT_CLOSER =
  "Own your data & digital infrastructure. Operate with strategic foresight. Build for the long game";

const BANNED = [
  { name: "leverage", re: /\bleverag\w*/gi },
  { name: "synergy", re: /\bsynergy\b/gi },
  { name: "synergies", re: /\bsynergies\b/gi },
  { name: "ecosystem", re: /\becosystem\b/gi },
  { name: "holistic", re: /\bholistic\b/gi },
  { name: "cutting-edge", re: /\bcutting[- ]edge\b/gi },
  { name: "ESG", re: /\bESG\b/g },
  { name: "PropTech", re: /\bPropTech\b/gi },
  { name: "prop-tech", re: /\bprop[- ]tech\b/gi },
  { name: "REIT", re: /\bREIT(s)?\b/g },
];

// Trademark patterns — find bare uses
const MARKS = [
  { name: "Property Brain", re: /Property Brain(?!™)/g },
  { name: "Portfolio Brain", re: /Portfolio Brain(?!™)/g },
  { name: "BoT", re: /\bBoT(?!®)\b/g },
  { name: "Building of Things", re: /Building of Things(?!®)/g },
  { name: "ElasticISP", re: /ElasticISP(?!®)/g },
  { name: "Peak Property Performance", re: /Peak Property Performance(?!®)/g },
  { name: "PPP 5C", re: /PPP 5C(?!™)/g },
  { name: "PPP Audit", re: /PPP Audit(?!™)/g },
  { name: "5S", re: /\b5S(?!®)(?![a-zA-Z0-9])/g },
  { name: "SIC", re: /\bSIC(?!®)\b/g },
];

const BARE_INFRA =
  /(?<!data & digital )(?<!digital )(?<!Digital )(?<!\bdigital[- ])\binfrastructure\b/g;

// -----------------------------------------------------------------------------
// 3. HTML helpers
// -----------------------------------------------------------------------------
function relPath(full) {
  return full
    .replace(ROOT + "/", "")
    .replace(/\/index\.html$/, "/")
    .replace(/^index\.html$/, "/");
}

function stripTags(html) {
  let s = html;
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&nbsp;/g, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#x27;|&apos;/g, "'");
  s = s.replace(/&[a-z]+;/gi, " ");
  return s.replace(/\s+/g, " ").trim();
}

function bodyOnly(html) {
  const m = html.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i);
  return m ? m[1] : html;
}

function getTag(html, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function getMeta(html, attr, val) {
  // Try double-quoted content first, then single-quoted. We can't use [^"']*
  // because real meta descriptions often contain apostrophes (don't, owner's, etc.).
  const dq = new RegExp(
    `<meta[^>]*\\b${attr}=["']${val}["'][^>]*content="([^"]*)"`,
    "i"
  );
  const sq = new RegExp(
    `<meta[^>]*\\b${attr}=["']${val}["'][^>]*content='([^']*)'`,
    "i"
  );
  const m = html.match(dq) || html.match(sq);
  if (m) return m[1];
  // try reversed order
  const dq2 = new RegExp(
    `<meta[^>]*content="([^"]*)"[^>]*\\b${attr}=["']${val}["']`,
    "i"
  );
  const sq2 = new RegExp(
    `<meta[^>]*content='([^']*)'[^>]*\\b${attr}=["']${val}["']`,
    "i"
  );
  const m2 = html.match(dq2) || html.match(sq2);
  return m2 ? m2[1] : null;
}

function getCanonical(html) {
  const m = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  if (m) return m[1];
  const m2 = html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
  return m2 ? m2[1] : null;
}

function getJSONLD(html) {
  const out = [];
  const re = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(m[1]));
    } catch {
      out.push({ __PARSE_ERROR: true, raw: m[1].slice(0, 120) });
    }
  }
  return out;
}

function findAll(text, re) {
  const out = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(text))) {
    out.push({ match: m[0], index: m.index });
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return out;
}

// -----------------------------------------------------------------------------
// 4. Per-page audit
// -----------------------------------------------------------------------------
const SITE_HOST = "https://www.opticwise.com";

function auditPage(file) {
  const html = readFileSync(file, "utf8");
  const body = bodyOnly(html);
  const text = stripTags(body);
  const issues = [];

  const rel = relPath(file);
  // Per scope (.cursor/rules/OW_SB7_brandscript.mdc): SB7 is NOT compulsory on
  // /insights/** or /faq/**. We audit them for SEO only — not for banned words,
  // bare TMs, bare-infra, missing reframing line, or missing default closer.
  // Notes:
  //   • /insights/ tree includes the index hub plus all 126 long-form posts.
  //   • /faq/ is allowed to mention PropTech in third-party / comparative
  //     context (the rule preserves that for SEO discoverability) and is not
  //     subject to the data&digital-infrastructure prefix rule.
  const isInsight = rel.startsWith("insights/");
  const isFaq = rel.startsWith("faq/");
  const isHome = rel === "/" || rel === "index.html" || rel === "";
  const skipBrandAll = isInsight || isFaq;

  if (!skipBrandAll) {
    // ---- BrandScript checks (body text only, not <head>) ----
    // Allow PropTech inside third-party publication/award names (proper nouns).
    // These are locked, trademarked third-party labels and per Phase 1A audit P2
    // they are acceptable. Pattern: PropTech followed by Outlook | Visionary |
    // Solutions Company | Magazine | Awards.
    const PROPTECH_THIRD_PARTY = /PropTech\s+(Outlook|Visionary|Solutions Company|Magazine|Awards|Today)/gi;
    const propTechAllowedSpans = [];
    let pm;
    PROPTECH_THIRD_PARTY.lastIndex = 0;
    while ((pm = PROPTECH_THIRD_PARTY.exec(text))) {
      propTechAllowedSpans.push([pm.index, pm.index + pm[0].length]);
    }
    const inAllowed = (idx) =>
      propTechAllowedSpans.some(([a, b]) => idx >= a && idx < b);

    for (const { name, re } of BANNED) {
      const m = findAll(text, new RegExp(re.source, re.flags));
      for (const o of m) {
        if (name === "PropTech" && inAllowed(o.index)) continue;
        issues.push({ kind: "BANNED", word: name, snippet: snippetAround(text, o.index, o.match.length) });
      }
    }
    for (const { name, re } of MARKS) {
      const m = findAll(text, new RegExp(re.source, re.flags));
      for (const o of m) {
        // Skip awards/publication contexts (PropTech Visionary, PropTech Outlook)
        const around = text.slice(Math.max(0, o.index - 20), o.index + o.match.length + 30);
        if (/award|outlook|visionary|magazine/i.test(around)) continue;
        issues.push({ kind: "BARE_TM", mark: name, snippet: snippetAround(text, o.index, o.match.length) });
      }
    }
    // Bare-infra: skip occurrences inside dictionary/glossary <details><summary> definitions
    // for the glossary page only
    if (!rel.startsWith("glossary")) {
      const m = findAll(text, new RegExp(BARE_INFRA.source, BARE_INFRA.flags));
      for (const o of m) issues.push({ kind: "BARE_INFRA", snippet: snippetAround(text, o.index, "infrastructure".length) });
    }
    if (!text.includes(REFRAMING_LINE)) issues.push({ kind: "MISSING_REFRAMING" });
    if (!text.includes(DEFAULT_CLOSER)) issues.push({ kind: "MISSING_CLOSER" });
  }

  // ---- SEO hygiene ----
  const title = getTag(html, "title") || "";
  const descMeta = getMeta(html, "name", "description");
  const canonical = getCanonical(html);
  const ogTitle = getMeta(html, "property", "og:title");
  const ogDesc = getMeta(html, "property", "og:description");
  const ogImage = getMeta(html, "property", "og:image");
  const ogUrl = getMeta(html, "property", "og:url");
  const twTitle = getMeta(html, "name", "twitter:title");
  const twDesc = getMeta(html, "name", "twitter:description");
  const twCard = getMeta(html, "name", "twitter:card");

  if (!title) issues.push({ kind: "SEO_NO_TITLE" });
  if (title && title.length < 20) issues.push({ kind: "SEO_TITLE_SHORT", title });
  if (title && title.length > 70) issues.push({ kind: "SEO_TITLE_LONG", title, len: title.length });
  // Duplicate brand suffix: "... | OpticWise | OpticWise" or two "OpticWise" before " | OpticWise"
  const lower = title.toLowerCase();
  const opticCount = (lower.match(/opticwise/g) || []).length;
  if (opticCount >= 2) issues.push({ kind: "SEO_TITLE_DUP_BRAND", title });

  if (!descMeta) issues.push({ kind: "SEO_NO_DESC" });
  if (descMeta && descMeta.length < 50) issues.push({ kind: "SEO_DESC_SHORT", desc: descMeta, len: descMeta.length });
  if (descMeta && descMeta.length > 170) issues.push({ kind: "SEO_DESC_LONG", desc: descMeta, len: descMeta.length });

  if (!canonical) issues.push({ kind: "SEO_NO_CANONICAL" });

  if (!ogTitle) issues.push({ kind: "SEO_NO_OG_TITLE" });
  if (!ogDesc) issues.push({ kind: "SEO_NO_OG_DESC" });
  if (!ogImage) issues.push({ kind: "SEO_NO_OG_IMAGE" });
  if (!ogUrl) issues.push({ kind: "SEO_NO_OG_URL" });
  if (!twCard) issues.push({ kind: "SEO_NO_TW_CARD" });
  if (!twTitle) issues.push({ kind: "SEO_NO_TW_TITLE" });
  if (!twDesc) issues.push({ kind: "SEO_NO_TW_DESC" });

  // H1 in body
  const h1Count = (body.match(/<h1\b/gi) || []).length;
  if (h1Count === 0) issues.push({ kind: "SEO_NO_H1" });
  if (h1Count > 1) issues.push({ kind: "SEO_MULTIPLE_H1", n: h1Count });

  // JSON-LD checks
  const ld = getJSONLD(html);
  if (ld.length === 0) issues.push({ kind: "SEO_NO_JSONLD" });
  for (const node of ld) {
    if (node && node.__PARSE_ERROR) issues.push({ kind: "SEO_JSONLD_PARSE_ERR" });
    if (node && node["@type"] === "Article") {
      if (!node.description || node.description === "null") {
        issues.push({ kind: "SEO_ARTICLE_NULL_DESC" });
      }
      if (!node.author) issues.push({ kind: "SEO_ARTICLE_NO_AUTHOR" });
      if (!node.mainEntityOfPage) issues.push({ kind: "SEO_ARTICLE_NO_MEOP" });
    }
  }

  // Hero image alt for insights posts
  if (isInsight) {
    const heroImg = body.match(/<section[^>]*hero[\s\S]*?<img[^>]*alt=["']([^"']*)["']/i);
    if (heroImg && heroImg[1].trim() === "") {
      issues.push({ kind: "SEO_HERO_ALT_EMPTY" });
    } else if (!heroImg) {
      // not strictly required
    }
  }

  return {
    file: rel,
    isInsight,
    title,
    descLen: descMeta ? descMeta.length : 0,
    canonical,
    issues,
  };
}

function snippetAround(text, idx, len) {
  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + len + 30);
  return (
    (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "")
  );
}

// -----------------------------------------------------------------------------
// 5. Run + report
// -----------------------------------------------------------------------------
const results = FILES.map(auditPage);

// Aggregate by issue kind
const byKind = {};
const byFile = {};
for (const r of results) {
  byFile[r.file] = r.issues.length;
  for (const i of r.issues) {
    byKind[i.kind] = (byKind[i.kind] || 0) + 1;
  }
}

// Write JSON for downstream scripts
writeFileSync(
  join(__dirname, "AUDIT-ALL.json"),
  JSON.stringify(results, null, 2) + "\n"
);

// Print summary
console.log(`\nAudited ${FILES.length} HTML files.\n`);
console.log("=== ISSUE COUNTS BY KIND ===");
const kinds = Object.entries(byKind).sort((a, b) => b[1] - a[1]);
for (const [k, n] of kinds) console.log(`  ${k.padEnd(28)} ${String(n).padStart(5)}`);

console.log("\n=== TOP 25 PAGES WITH MOST ISSUES ===");
const sorted = Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 25);
for (const [f, n] of sorted) console.log(`  ${String(n).padStart(3)}  ${f}`);

console.log("\n=== INSIGHTS POSTS WITH SEO_ARTICLE_NULL_DESC ===");
const nullDesc = results.filter((r) => r.issues.some((i) => i.kind === "SEO_ARTICLE_NULL_DESC")).length;
console.log(`  ${nullDesc} posts`);

console.log("\nFull report at: .audit/AUDIT-ALL.json\n");
