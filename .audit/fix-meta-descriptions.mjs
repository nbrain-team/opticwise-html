#!/usr/bin/env node
// .audit/fix-meta-descriptions.mjs
// Rewrite the 7 top-level pages with shared boilerplate meta descriptions
// and the 4 top-level pages whose unique descriptions exceed 170 chars.
// Also fix the contact title (too short).
//
// Run from repo root: node .audit/fix-meta-descriptions.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Each entry: file → { description (≤170 chars), title? (optional title rewrite) }
const FIXES = {
  "advisory-services/index.html": {
    description:
      "Independent CRE advisory from OpticWise — evaluate vendor proposals, quantify AI readiness, and architect data & digital infrastructure without a product agenda.",
  },
  "bot-building-of-things/index.html": {
    description:
      "BoT® — Building of Things® consolidates CRE building connectivity onto a single, secure, segmented data & digital infrastructure the owner controls.",
  },
  "digital-infrastructure-noi-ai/index.html": {
    description:
      "OpticWise's category hub for CRE data & digital infrastructure — the foundation that turns NOI from a result into a lever and makes AI readiness real.",
  },
  "digital-infrastructure-noi-strategy/index.html": {
    description:
      "NOI is a result, not a lever. See how owner-controlled data & digital infrastructure moves the operating causes that drive CRE Net Operating Income.",
  },
  "how-we-operate/index.html": {
    description:
      "How OpticWise operates: design, implement, and run managed data & digital infrastructure plus the owner-controlled intelligence layer — without taxing on-site teams.",
  },
  "own-vs-lease-cre-building-data/index.html": {
    description:
      "Most CRE owners are leasing their building data without knowing it. See the economics of owner-controlled data & digital infrastructure vs. vendor lock-in.",
  },
  "property-brain/index.html": {
    description:
      "Property Brain™ — OpticWise's vendor- and LLM-agnostic data plane + trust plane that turns each CRE building into a portable, owner-controlled intelligence asset.",
  },
  "portfolio-brain/index.html": {
    description:
      "Portfolio Brain™ — owner-controlled intelligence at CRE portfolio scale. Compounding cross-asset analytics, governed by the owner, agnostic of any vendor or LLM.",
  },
  "5s-user-experience-standard/index.html": {
    description:
      "5S® — OpticWise's non-negotiable CRE user experience: Seamless Mobility, Security, Stability, Speed, Service. Owner-controlled, measurable, repeatable.",
  },
  "for-property-managers-and-engineers/index.html": {
    description:
      "For CRE property managers and building engineers: OpticWise runs the owner standard on data & digital infrastructure — so your shop isn't the accidental NOC.",
  },
  "for-tenants/index.html": {
    description:
      "For business tenants and CRE advisors: what OpticWise signals in multi-tenant office — 5S® user experience, owner-held data & digital infrastructure, PPP 5C™ discipline.",
  },
  "contact/index.html": {
    title: "Contact OpticWise — Schedule a CRE Data & Digital Review",
    description:
      "Talk to OpticWise about your CRE portfolio. Schedule a complimentary data & digital infrastructure review on one asset — no software pitch, no rip-and-replace.",
  },
};

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function setMeta(html, attr, val, newContent) {
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

let written = 0;
for (const [rel, fix] of Object.entries(FIXES)) {
  const file = join(ROOT, rel);
  let html = readFileSync(file, "utf8");
  const orig = html;

  if (fix.description) {
    html = setMeta(html, "name", "description", fix.description);
    html = setMeta(html, "property", "og:description", fix.description);
    html = setMeta(html, "name", "twitter:description", fix.description);
  }
  if (fix.title) {
    html = html.replace(
      /<title[^>]*>([\s\S]*?)<\/title>/i,
      `<title>${escapeAttr(fix.title).replace(/&quot;/g, '"')}</title>`
    );
    html = setMeta(html, "property", "og:title", fix.title);
    html = setMeta(html, "name", "twitter:title", fix.title);
  }
  if (html !== orig) {
    writeFileSync(file, html);
    written++;
    console.log(`updated ${rel}`);
  } else {
    console.log(`no-op  ${rel}`);
  }
}
console.log(`\nwrote ${written}/${Object.keys(FIXES).length} files`);
