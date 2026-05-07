#!/usr/bin/env node
// Phase 3A — insert canonical reframing line as a dark pull-quote
// just before each page's closing CTA section.
// Touches BOTH visible HTML and the SSR-hydration JSON layout to stay in sync.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// One unique CTA heading per page (used as the anchor).
const PAGES = [
  { file: "ai-ready-commercial-real-estate/index.html", cta: "Find Out If Your Building Is AI-Ready" },
  { file: "for-asset-managers/index.html",              cta: "Run the Big Three Plays Diagnostic on One Asset." },
  { file: "for-it-executives/index.html",               cta: "Let&#x27;s Map Your OT Posture", ctaJson: "Let's Map Your OT Posture" },
  { file: "for-lps-and-financiers/index.html",          cta: "Get the Diligence Frame" },
  { file: "for-property-managers-and-engineers/index.html", cta: "See What Comes Off Your Plate" },
  { file: "for-tenants/index.html",                     cta: "Evaluating a Building with OpticWise Inside?" },
  { file: "portfolio-brain/index.html",                 cta: "Run the Big Three Plays Diagnostic Across Three Assets." },
  { file: "glossary/index.html",                        cta: "Ready to apply these to your portfolio?" },
];

const REFRAMING_HTML =
  '<section class="quote quote--dark"><div class="container-narrow"><div class="quote__inner"><blockquote class="quote__text">\u201C<!-- -->If you don&#x27;t own your data &amp; digital infrastructure, your vendors do.<!-- -->\u201D</blockquote></div></div></section>';

// JSON-layout block for the SSR-hydration tree.
// Note: the layout JSON is embedded inside a JS string literal in
// `self.__next_f.push([1, "..."])`, so " becomes \" and & becomes \u0026.
// We construct the JS-escaped form directly.
function reframeJsonBlock(pageId) {
  // Inside the JS string literal in the page, JSON quotes are written as \"
  // and ampersands as \u0026.
  const id = `reframe-banner-${pageId}`;
  return (
    `{\\"id\\":\\"${id}\\",` +
    `\\"eyebrow\\":\\"\\",` +
    `\\"quote\\":\\"If you don't own your data \\u0026 digital infrastructure, your vendors do.\\",` +
    `\\"attribution\\":\\"\\",` +
    `\\"style\\":\\"dark\\",` +
    `\\"blockName\\":null,` +
    `\\"blockType\\":\\"pullQuote\\"}`
  );
}

const ALREADY = "If you don&#x27;t own your data &amp; digital infrastructure, your vendors do.";

let report = [];

for (const { file, cta, ctaJson } of PAGES) {
  const path = join(ROOT, file);
  let html = readFileSync(path, "utf8");
  const original = html;
  const pageId = file.replace(/\/index\.html$/, "").replace(/\//g, "-");

  // Skip if our exact reframing line already lives in the visible HTML inside
  // a quote section (idempotency).
  if (html.includes(`<blockquote class="quote__text">\u201C<!-- -->${ALREADY}<!-- -->\u201D</blockquote>`)) {
    report.push(`${file}: SKIP already inserted`);
    continue;
  }

  // 1) Visible HTML: insert before <section class="cta cta--blue" id="cta">
  //    that contains the unique CTA heading.
  const ctaOpenIdx = html.indexOf(`<section class="cta cta--blue" id="cta">`);
  if (ctaOpenIdx === -1) { report.push(`${file}: NO visible CTA section found`); continue; }
  // Sanity: the heading must appear shortly after the section opener.
  const headingAfter = html.indexOf(cta, ctaOpenIdx);
  if (headingAfter === -1 || headingAfter - ctaOpenIdx > 800) {
    report.push(`${file}: visible CTA heading "${cta.slice(0,40)}…" not found near section opener`);
    continue;
  }
  html = html.slice(0, ctaOpenIdx) + REFRAMING_HTML + html.slice(ctaOpenIdx);

  // 2) JSON layout: find the callToAction block and insert the pullQuote block before it.
  //    We anchor on the JS-escaped CTA heading inside the JSON string.
  const jsonHeadingNeedle = `\\"heading\\":\\"${(ctaJson ?? cta).replace(/"/g, '\\\\"')}\\"`;
  const headingJsonIdx = html.indexOf(jsonHeadingNeedle);
  if (headingJsonIdx === -1) {
    report.push(`${file}: JSON heading anchor not found (needle=${jsonHeadingNeedle.slice(0,80)}…)`);
    // Roll back the HTML edit — we don't want HTML changes that hydration will strip.
    writeFileSync(path, original, "utf8");
    continue;
  }
  // Walk backwards from the heading to the opening { of the enclosing JSON block.
  // The block opens with `{\"id\":\"<hash>\",...`, preceded by either `,` or `[`.
  let depth = 0;
  let i = headingJsonIdx;
  while (i > 0) {
    i--;
    const ch = html[i];
    if (ch === '}') depth++;
    else if (ch === '{') {
      if (depth === 0) break;
      depth--;
    }
  }
  // At this point html[i] === '{' — the opening brace of the callToAction block.
  // Insert our pullQuote block right before this brace, with a comma separator.
  const block = reframeJsonBlock(pageId);
  html = html.slice(0, i) + block + "," + html.slice(i);

  if (html === original) {
    report.push(`${file}: NO CHANGE (unexpected)`);
    continue;
  }
  writeFileSync(path, html, "utf8");
  report.push(`${file}: inserted reframe pullQuote (HTML + JSON)`);
}

console.log(report.join("\n"));
