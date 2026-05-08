#!/usr/bin/env node
// .audit/fix-seo.mjs
// Mechanical SEO fixes across every index.html in the site.
// Per scope: this script does NOT touch SB7 body copy. SEO only.
//
// Fixes applied:
//   1. Strip duplicate "| OpticWise | OpticWise" suffix from <title>, og:title, twitter:title.
//   2. If <title> still > 70 chars after dedup, drop the trailing " | OpticWise" suffix.
//   3. In <script type="application/ld+json">, for nodes of @type Article:
//        - Replace "description":null with the page's <meta name="description"> content
//        - Add "author" if missing (Organization: OpticWise)
//        - Add "mainEntityOfPage" if missing (using canonical URL)
//   4. Demote any second/third <h1> inside <main> or <section> to <h2>.
//      (Keeps the FIRST <h1> intact; converts subsequent ones.)
//   5. Mirror title fixes into og:title and twitter:title where they currently
//      duplicate the title's old value.
//
// Run from repo root: node .audit/fix-seo.mjs
// Side-effects: rewrites HTML files in place.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
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
    if (st.isDirectory()) walk(full, out);
    else if (e === "index.html" || e === "404.html") out.push(full);
  }
  return out;
}
const FILES = walk(ROOT).sort();

let stats = {
  filesScanned: 0,
  titlesDeduped: 0,
  titlesShortened: 0,
  ogTitleSynced: 0,
  twTitleSynced: 0,
  articleDescFilled: 0,
  articleAuthorAdded: 0,
  articleMainEntityAdded: 0,
  h1Demoted: 0,
  filesWritten: 0,
};

const reportLong = []; // descriptions still too long
const reportTooShort = [];

function getMetaContent(html, attr, val) {
  const re = new RegExp(
    `<meta[^>]*\\b${attr}=["']${val}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*\\b${attr}=["']${val}["']`,
    "i"
  );
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}
function getCanonical(html) {
  const m = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  if (m) return m[1];
  const m2 = html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
  return m2 ? m2[1] : null;
}

function setMetaContent(html, attr, val, newContent) {
  // Replace content=... preserving order. Try both attribute orders.
  const re = new RegExp(
    `(<meta[^>]*\\b${attr}=["']${val}["'][^>]*content=["'])([^"']*)(["'])`,
    "i"
  );
  if (re.test(html)) return html.replace(re, `$1${escapeAttr(newContent)}$3`);
  const re2 = new RegExp(
    `(<meta[^>]*content=["'])([^"']*)(["'][^>]*\\b${attr}=["']${val}["'])`,
    "i"
  );
  return html.replace(re2, `$1${escapeAttr(newContent)}$3`);
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

// Decode common HTML entities (just enough to detect duplicates)
function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function dedupTitle(title) {
  // Common patterns:
  //   "X | OpticWise | OpticWise"      → "X | OpticWise"
  //   "X | OpticWise Y | OpticWise"    → "X | OpticWise Y"
  //   "OpticWise — X | OpticWise"      → "OpticWise — X"
  let t = title;
  // Trailing duplicate suffix
  t = t.replace(/\s*\|\s*OpticWise\s*\|\s*OpticWise\s*$/i, " | OpticWise");
  // If the title text body already contains "OpticWise" earlier and it ends with "| OpticWise", drop the trailing one.
  // Match "X ... OpticWise ... | OpticWise" where the body has OpticWise.
  const decoded = decode(t);
  const occurrences = (decoded.match(/OpticWise/gi) || []).length;
  if (occurrences >= 2 && /\|\s*OpticWise\s*$/i.test(t)) {
    t = t.replace(/\s*\|\s*OpticWise\s*$/i, "");
  }
  return t.trim();
}

function shortenTitle(title) {
  // If still > 70 chars, drop the trailing " | OpticWise" suffix entirely.
  const decoded = decode(title);
  if (decoded.length <= 70) return title;
  const stripped = title.replace(/\s*\|\s*OpticWise\s*$/i, "").trim();
  if (decode(stripped).length < decode(title).length) return stripped;
  return title;
}

function demoteExtraH1(html) {
  // Find all H1 tags with their byte offsets, keeping the first, demoting the rest to H2.
  let count = 0;
  let result = "";
  let lastIdx = 0;
  const re = /<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi;
  let m;
  let firstSeen = false;
  while ((m = re.exec(html)) !== null) {
    if (!firstSeen) {
      firstSeen = true;
      continue; // keep first H1 intact
    }
    // Append everything up to this match
    result += html.slice(lastIdx, m.index);
    // Build H2 replacement, preserving attributes
    const h2 = `<h2${m[1]}>${m[2]}</h2>`;
    result += h2;
    lastIdx = m.index + m[0].length;
    count++;
  }
  result += html.slice(lastIdx);
  return { html: result, count };
}

function patchJSONLD(html, canonical, descMeta) {
  // Walk every <script type="application/ld+json"> block, parse, mutate, re-serialize.
  let out = html;
  let articleDescAdded = 0;
  let authorAdded = 0;
  let meopAdded = 0;
  out = out.replace(
    /(<script\s+type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
    (full, openTag, body, closeTag) => {
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        return full;
      }
      let touched = false;
      const visit = (node) => {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) {
          for (const x of node) visit(x);
          return;
        }
        if (node["@type"] === "Article") {
          // description: null → meta description
          if ((node.description === null || node.description === undefined || node.description === "null") && descMeta) {
            node.description = descMeta;
            articleDescAdded++;
            touched = true;
          }
          if (!node.author) {
            node.author = {
              "@type": "Organization",
              name: "OpticWise",
              url: "https://www.opticwise.com",
            };
            authorAdded++;
            touched = true;
          }
          if (!node.mainEntityOfPage && canonical) {
            node.mainEntityOfPage = {
              "@type": "WebPage",
              "@id": canonical,
            };
            meopAdded++;
            touched = true;
          }
        }
        for (const k of Object.keys(node)) {
          if (typeof node[k] === "object") visit(node[k]);
        }
      };
      visit(parsed);
      if (!touched) return full;
      const newBody = JSON.stringify(parsed);
      return `${openTag}${newBody}${closeTag}`;
    }
  );
  stats.articleDescFilled += articleDescAdded;
  stats.articleAuthorAdded += authorAdded;
  stats.articleMainEntityAdded += meopAdded;
  return out;
}

for (const file of FILES) {
  stats.filesScanned++;
  const orig = readFileSync(file, "utf8");
  let html = orig;
  const rel = file.replace(ROOT + "/", "");

  // ----- TITLE -----
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  let oldTitle = titleMatch ? titleMatch[1].trim() : null;
  let newTitle = oldTitle;
  if (oldTitle) {
    newTitle = dedupTitle(oldTitle);
    newTitle = shortenTitle(newTitle);
    if (newTitle !== oldTitle) {
      html = html.replace(/<title[^>]*>([\s\S]*?)<\/title>/i, `<title>${newTitle}</title>`);
      if (decode(newTitle).length < decode(oldTitle).length) {
        if ((decode(oldTitle).match(/OpticWise/gi) || []).length >= 2) stats.titlesDeduped++;
        else stats.titlesShortened++;
      }
    }
  }

  // ----- OG title / Twitter title sync (only when they previously equaled the OLD title) -----
  if (oldTitle && newTitle && oldTitle !== newTitle) {
    const ogt = getMetaContent(html, "property", "og:title");
    if (ogt && (ogt === oldTitle || ogt === decode(oldTitle))) {
      // Mirror OG to use the new (still keyword-rich) title body but without the "| OpticWise" tail
      const ogNew = newTitle.replace(/\s*\|\s*OpticWise\s*$/i, "").trim();
      html = setMetaContent(html, "property", "og:title", ogNew);
      stats.ogTitleSynced++;
    }
    const twt = getMetaContent(html, "name", "twitter:title");
    if (twt && (twt === oldTitle || twt === decode(oldTitle))) {
      const twNew = newTitle.replace(/\s*\|\s*OpticWise\s*$/i, "").trim();
      html = setMetaContent(html, "name", "twitter:title", twNew);
      stats.twTitleSynced++;
    }
  }

  // ----- JSON-LD Article patches -----
  const canonical = getCanonical(html);
  const descMeta = getMetaContent(html, "name", "description");
  html = patchJSONLD(html, canonical, descMeta);

  // Track over-long descriptions for the report (don't auto-truncate)
  if (descMeta && descMeta.length > 170) reportLong.push({ file: rel, len: descMeta.length, desc: descMeta });
  if (descMeta && descMeta.length < 50) reportTooShort.push({ file: rel, len: descMeta.length, desc: descMeta });

  // ----- Demote stray <h1> -----
  const { html: htmlAfterH1, count: demoteCount } = demoteExtraH1(html);
  if (demoteCount > 0) {
    html = htmlAfterH1;
    stats.h1Demoted += demoteCount;
  }

  if (html !== orig) {
    writeFileSync(file, html);
    stats.filesWritten++;
  }
}

console.log("=== SEO FIX RESULTS ===");
for (const [k, v] of Object.entries(stats)) console.log(`  ${k.padEnd(28)} ${String(v).padStart(5)}`);

console.log(`\n=== META DESCRIPTIONS > 170 chars (manual revision needed): ${reportLong.length} ===`);
for (const r of reportLong) {
  console.log(`  [${r.len}] ${r.file}`);
  console.log(`         ${r.desc.slice(0, 120)}…`);
}

if (reportTooShort.length) {
  console.log(`\n=== META DESCRIPTIONS < 50 chars: ${reportTooShort.length} ===`);
  for (const r of reportTooShort) {
    console.log(`  [${r.len}] ${r.file} :: ${r.desc}`);
  }
}
