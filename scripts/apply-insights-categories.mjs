#!/usr/bin/env node
/*
 * scripts/apply-insights-categories.mjs
 *
 * Applies a fresh, post-by-post categorization plan to every
 * /insights/<slug>/index.html:
 *
 *   1. Replaces the inner text of the hero category pill
 *      (<span class="block text-xs font-bold text-blue-300 bg-blue-400/10..."> … </span>)
 *      with the new primary category. The build script's category
 *      extractor reads from the same element, so this single edit
 *      drives the listing card pill, the listing filter buttons, and
 *      the runtime client-side filter.
 *
 *   2. Inserts (or updates) a sibling hidden metadata element
 *      <span hidden data-ow-secondary-cats="Sec1, Sec2"></span>
 *      immediately after the pill close, carrying up to 2 secondary
 *      categories. Currently inert at runtime — kept as semantic
 *      metadata that the build script captures into search-index.json.
 *      If a post has no secondaries, an existing element is removed.
 *
 * After running this, re-run scripts/build-insights-index.mjs to
 * regenerate the listing grid + filter buttons + search index.
 *
 * Pure Node (>= 18). No external dependencies. Idempotent: running
 * twice produces the same files.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const INSIGHTS_DIR = join(ROOT, 'insights');

// ---------- canonical category list ----------

const ALLOWED = [
  'AI Readiness',
  'Building Intelligence',
  'Case Studies & Proof',
  'CRE Strategy',
  'Data Ownership',
  'Digital Infrastructure',
  'NOI & Revenue',
  'Operational Control',
  'Smart Buildings',
  'Tenant Experience',
  'The 5C\u2122 Plan',
  'Vendor Control & Governance',
];
const ALLOWED_SET = new Set(ALLOWED);

// ---------- the plan ----------
//
// One entry per post. `primary` is the single category the listing
// filter keys off of. `secondaries` is up to 2 additional categories
// captured as hidden metadata for future use (search/related-posts).

const PLAN = [
  { slug: 'ai-agents-permissions-cre-orchestration', primary: 'Vendor Control & Governance', secondaries: ['AI Readiness', 'Building Intelligence'] },
  { slug: 'owner-controlled-ai-orchestration-cre', primary: 'AI Readiness', secondaries: ['Data Ownership', 'CRE Strategy'] },
  { slug: 'avb-eqr-merger-operating-standard-portfolio-intelligence', primary: 'CRE Strategy', secondaries: ['Data Ownership', 'Operational Control'] },
  { slug: 'your-pms-has-an-api-thats-not-the-same-as-a-data-strategy', primary: 'Data Ownership', secondaries: ['Vendor Control & Governance', 'AI Readiness'] },
  { slug: 'the-ai-model-is-commoditizing-your-owner-data-is-the-real-moat', primary: 'Data Ownership', secondaries: ['AI Readiness', 'CRE Strategy'] },
  { slug: 'why-cre-tech-is-shifting-from-point-solutions-to-platforms-and-what-to-do-about', primary: 'Vendor Control & Governance', secondaries: ['CRE Strategy', 'Data Ownership'] },
  { slug: 'the-winners-in-cre-will-own-the-stacknot-just-the-asset', primary: 'CRE Strategy', secondaries: ['Digital Infrastructure', 'Data Ownership'] },
  { slug: 'the-most-valuable-asset-in-cre-isnt-the-buildingits-the-data', primary: 'Data Ownership', secondaries: ['CRE Strategy', 'NOI & Revenue'] },
  { slug: 'the-hidden-cost-killing-your-noi-and-you-dont-see-it', primary: 'NOI & Revenue', secondaries: ['Operational Control', 'Data Ownership'] },
  { slug: 'operational-efficiency-is-the-new-alpha-in-commercial-real-estate', primary: 'Operational Control', secondaries: ['NOI & Revenue', 'CRE Strategy'] },
  { slug: 'data-centers-are-the-new-cre-gravity-well', primary: 'CRE Strategy', secondaries: ['Digital Infrastructure'] },
  { slug: 'owners-are-overwhelmednot-under-informed', primary: 'CRE Strategy', secondaries: ['Operational Control'] },
  { slug: 'capex-is-tightening-roi-scrutiny-is-brutal-and-cool-tech-is-dead', primary: 'NOI & Revenue', secondaries: ['CRE Strategy'] },
  { slug: 'ai-wont-fix-your-propertyit-will-expose-whats-broken', primary: 'AI Readiness', secondaries: ['Operational Control', 'Data Ownership'] },
  { slug: 'ai-wont-fix-your-propertybut-this-will', primary: 'AI Readiness', secondaries: ['Digital Infrastructure', 'Data Ownership'] },
  { slug: 'ai-will-commoditize-creunless-you-own-something-it-cant-replicate', primary: 'AI Readiness', secondaries: ['Data Ownership', 'CRE Strategy'] },
  { slug: 'if-your-building-sold-tomorrow-would-the-data-be-included', primary: 'Data Ownership', secondaries: ['NOI & Revenue', 'CRE Strategy'] },
  { slug: 'ai-needs-a-nervous-system-why-digital-infrastructure-is-the-real-enabler', primary: 'Digital Infrastructure', secondaries: ['AI Readiness', 'Building Intelligence'] },
  { slug: 'ai-governance-is-now-a-cre-risk-category-are-you-exposed', primary: 'AI Readiness', secondaries: ['Vendor Control & Governance', 'Operational Control'] },
  { slug: 'why-asset-managers-are-flying-blind-and-dont-even-know-it', primary: 'Operational Control', secondaries: ['Data Ownership', 'CRE Strategy'] },
  { slug: 'hyperscalers-are-industrializing-digital-infrastructure-your-building-is-next', primary: 'Digital Infrastructure', secondaries: ['CRE Strategy', 'Building Intelligence'] },
  { slug: 'the-realpage-settlements-are-not-the-story-the-story-is-who-makes-your-decisions', primary: 'Vendor Control & Governance', secondaries: ['AI Readiness', 'Data Ownership'] },
  { slug: 'the-shadow-ai-problem-is-already-in-your-buildings', primary: 'Vendor Control & Governance', secondaries: ['AI Readiness', 'Data Ownership'] },
  { slug: 'office-just-had-its-best-quarter-since-2018-the-winners-will-be-the-owners-who-c', primary: 'CRE Strategy', secondaries: ['Operational Control'] },
  { slug: 'data-centers-just-got-their-own-reit-every-owner-should-read-the-signal', primary: 'CRE Strategy', secondaries: ['Digital Infrastructure'] },
  { slug: 'blackstone-is-filing-a-2-billion-ipo-around-digital-infrastructure-most-cre-owne', primary: 'Digital Infrastructure', secondaries: ['CRE Strategy', 'Data Ownership'] },
  { slug: 'ai-promises-20-30-savings-in-your-building-thats-only-true-if-you-own-your-data', primary: 'Data Ownership', secondaries: ['AI Readiness', 'NOI & Revenue'] },
  { slug: 'blackstone-brookfield-and-jpmorgan-just-rewrote-the-rules-on-real-estate-value', primary: 'CRE Strategy', secondaries: ['Digital Infrastructure'] },
  { slug: 'ai-in-cre-wont-save-you-if-you-dont-own-your-data', primary: 'Data Ownership', secondaries: ['AI Readiness', 'Vendor Control & Governance'] },
  { slug: 'when-the-scorekeeper-works-for-the-vendor-who-is-looking-out-for-you', primary: 'Vendor Control & Governance', secondaries: ['Data Ownership', 'Digital Infrastructure'] },
  { slug: 'ai-wont-fix-your-building-operations-your-data-foundation-will', primary: 'Data Ownership', secondaries: ['AI Readiness', 'Operational Control'] },
  { slug: 'part-5-digital-infrastructure-as-the-strategic-foundation-for-ai-driven-esg-and', primary: 'Digital Infrastructure', secondaries: ['AI Readiness', 'Operational Control'] },
  { slug: 'part-4-ai-adoption-without-strategy-is-waste-digital-infrastructure-makes-it-wor', primary: 'AI Readiness', secondaries: ['Digital Infrastructure', 'The 5C\u2122 Plan'] },
  { slug: 'part-3-digital-infrastructure-ai-operational-excellence-and-higher-asset-value', primary: 'Digital Infrastructure', secondaries: ['AI Readiness', 'The 5C\u2122 Plan'] },
  { slug: 'Data-Is-the-New-Real-Estate-Utility', primary: 'Data Ownership', secondaries: ['Digital Infrastructure', 'NOI & Revenue'] },
  { slug: 'ai-isn-t-the-future-it-s-today-why-your-digital-infrastructure-must', primary: 'Digital Infrastructure', secondaries: ['AI Readiness', 'Building Intelligence'] },
  { slug: 'part-5-cre-s-digital-divide-why-infrastructure-ownership-determines-ai', primary: 'AI Readiness', secondaries: ['Digital Infrastructure', 'Data Ownership'] },
  { slug: 'part-4-the-coming-regulation-wave-why-cre-must-prepare-for-ethical-ai-now', primary: 'AI Readiness', secondaries: ['Vendor Control & Governance', 'Digital Infrastructure'] },
  { slug: 'part-3-esg-illusion-why-ai-dashboards-alone-won-t-deliver-sustainable-results', primary: 'Digital Infrastructure', secondaries: ['Operational Control', 'AI Readiness'] },
  { slug: 'part-2-what-cre-gets-wrong-about-tenant-experience-hint-it-s-not-a-smart', primary: 'Tenant Experience', secondaries: ['Digital Infrastructure', 'Building Intelligence'] },
  { slug: 'digital-infrastructure-first-series-part-1-digital-infrastructure-is-the', primary: 'Digital Infrastructure', secondaries: ['NOI & Revenue', 'Smart Buildings'] },
  { slug: 'the-case-for-a-digital-architect-why-cre-property-managers-are-drowning-in', primary: 'Operational Control', secondaries: ['Digital Infrastructure', 'Vendor Control & Governance'] },
  { slug: 'organizational-pencils-why-agility-not-perfection-will-win-in-2026', primary: 'CRE Strategy', secondaries: ['AI Readiness', 'Operational Control'] },
  { slug: 'digital-infrastructure-isn-t-just-wi-fi-it-s-the-nervous-system-of-your-property', primary: 'Digital Infrastructure', secondaries: ['Building Intelligence', 'Operational Control'] },
  { slug: 'the-cost-of-doing-nothing-what-you-lose-by-letting-the-isp-build-your-network', primary: 'Vendor Control & Governance', secondaries: ['Digital Infrastructure', 'NOI & Revenue'] },
  { slug: 'how-one-portfolio-used-ai-to-cut-utility-spend-double-digits', primary: 'Case Studies & Proof', secondaries: ['NOI & Revenue', 'Operational Control'] },
  { slug: 'own-the-digital-infrastructure-own-the-leverage', primary: 'Digital Infrastructure', secondaries: ['Data Ownership', 'Tenant Experience'] },
  { slug: 'trust-at-first-sight-data-dictionaries-refresh-stamps-and-adoption', primary: 'Data Ownership', secondaries: ['Operational Control'] },
  { slug: 'what-ai-is-doing-to-apartment-demand-and-how-buildings-must-respond', primary: 'Tenant Experience', secondaries: ['AI Readiness', 'Digital Infrastructure'] },
  { slug: 'the-genai-divide-what-cre-leaders-must-know-before-falling-behind', primary: 'AI Readiness', secondaries: ['Data Ownership', 'Digital Infrastructure'] },
  { slug: 'the-post-pandemic-office-isn-t-smaller-it-s-smarter', primary: 'CRE Strategy', secondaries: ['Building Intelligence', 'The 5C\u2122 Plan'] },
  { slug: 'cretech-2025-the-ai-illusion-and-the-next-wave-no-one-s-talking-about', primary: 'AI Readiness', secondaries: ['The 5C\u2122 Plan', 'Data Ownership'] },
  { slug: 'from-data-to-decisions-what-cre-can-learn-from-cortland-s-product-mindset', primary: 'Data Ownership', secondaries: ['Operational Control'] },
  { slug: 'cre-owners-are-the-data-stewards-whether-you-know-it-or-not', primary: 'Data Ownership', secondaries: ['Vendor Control & Governance'] },
  { slug: 'the-hidden-tech-debt-you-won-t-catch-in-the-code', primary: 'Vendor Control & Governance', secondaries: ['Digital Infrastructure', 'Operational Control'] },
  { slug: 'mastering-control-the-final-c-in-the-5c-framework', primary: 'The 5C\u2122 Plan', secondaries: ['Operational Control', 'AI Readiness'] },
  { slug: 'bringing-systems-together-the-coordination-step-in-the-five-c-s', primary: 'The 5C\u2122 Plan', secondaries: ['Operational Control', 'Building Intelligence'] },
  { slug: 'collect-unlocking-the-value-hidden-in-your-building-s-data', primary: 'The 5C\u2122 Plan', secondaries: ['Data Ownership'] },
  { slug: 'connect-creating-the-flow-that-unlocks-your-building-s-potential', primary: 'The 5C\u2122 Plan', secondaries: ['Digital Infrastructure', 'Data Ownership'] },
  { slug: 'clarify-the-first-step-to-peak-property-performance', primary: 'The 5C\u2122 Plan', secondaries: ['Data Ownership', 'NOI & Revenue'] },
  { slug: 'the-hidden-cost-of-vendor-sprawl-and-what-to-do-about-it', primary: 'Vendor Control & Governance', secondaries: ['Operational Control'] },
  { slug: 'the-operator-s-guide-to-autonomous-buildings', primary: 'Building Intelligence', secondaries: ['Operational Control', 'The 5C\u2122 Plan'] },
  { slug: 'wi-fi-is-not-a-utility-it-s-an-investment-signal', primary: 'CRE Strategy', secondaries: ['Digital Infrastructure', 'NOI & Revenue'] },
  { slug: 'digital-first-strategy-the-only-competitive-edge-that-lasts', primary: 'CRE Strategy', secondaries: ['Digital Infrastructure', 'Operational Control'] },
  { slug: 'tthe-hidden-cap-rate-enhancer-no-one-talks-about', primary: 'NOI & Revenue', secondaries: ['Digital Infrastructure', 'CRE Strategy'] },
  { slug: 'how-one-operator-cut-120k-in-opex-with-a-single-upgrade', primary: 'Case Studies & Proof', secondaries: ['NOI & Revenue', 'Operational Control'] },
  { slug: 'reframing-cre-strategy-stop-playing-to-win-start-building-to-endure', primary: 'CRE Strategy', secondaries: ['The 5C\u2122 Plan', 'Data Ownership'] },
  { slug: 'what-s-your-smart-building-strategy-or-are-you-guessing', primary: 'CRE Strategy', secondaries: ['Smart Buildings', 'Digital Infrastructure'] },
  { slug: 'what-starbucks-taught-us-about-smart-property-ops', primary: 'Operational Control', secondaries: ['Smart Buildings', 'NOI & Revenue'] },
  { slug: 'why-98-of-property-owners-are-leaving-money-on-the-table', primary: 'NOI & Revenue', secondaries: ['Operational Control', 'Tenant Experience'] },
  { slug: 'what-swedish-beach-volleyball-can-teach-you-about-cre-strategy', primary: 'CRE Strategy', secondaries: ['The 5C\u2122 Plan', 'Vendor Control & Governance'] },
  { slug: 'why-power-and-not-just-square-footage-is-the-future-of-smart-buildings', primary: 'Smart Buildings', secondaries: ['Digital Infrastructure', 'CRE Strategy'] },
  { slug: 'the-800k-conversation-developers-keep-missing', primary: 'NOI & Revenue', secondaries: ['Digital Infrastructure', 'Vendor Control & Governance'] },
  { slug: 'who-s-making-480k-year-off-your-tenants-hint-it-s-not-you', primary: 'NOI & Revenue', secondaries: ['Vendor Control & Governance', 'Digital Infrastructure'] },
  { slug: 'data-lake-not-data-swamp-structuring-what-you-collect', primary: 'Data Ownership', secondaries: ['Building Intelligence', 'AI Readiness'] },
  { slug: 'before-ai-you-need-data-you-actually-own', primary: 'Data Ownership', secondaries: ['AI Readiness'] },
  { slug: 'from-wifi-to-wealth-the-hidden-profit-in-connectivity', primary: 'NOI & Revenue', secondaries: ['Digital Infrastructure', 'Tenant Experience'] },
  { slug: 'monetize-like-amazon-analyze-like-google-and-avoid-tesla-s-data-missteps', primary: 'NOI & Revenue', secondaries: ['Data Ownership', 'Tenant Experience'] },
  { slug: 'why-redundant-networks-are-silent-killers', primary: 'Vendor Control & Governance', secondaries: ['Digital Infrastructure', 'NOI & Revenue'] },
  { slug: 'invisible-guardians-redefining-privacy-in-commercial-real-estate', primary: 'Data Ownership', secondaries: ['Vendor Control & Governance', 'Tenant Experience'] },
  { slug: 'from-liability-to-leadership-how-cre-data-unlocks-value-in-at-risk-assets', primary: 'Data Ownership', secondaries: ['NOI & Revenue', 'CRE Strategy'] },
  { slug: 'from-amenities-to-expectations-on-demand-connectivity-as-a-cre-necessity', primary: 'Tenant Experience', secondaries: ['Digital Infrastructure', 'CRE Strategy'] },
  { slug: 'built-to-last-why-smart-infrastructure-is-the-backbone-of-future-proof', primary: 'Digital Infrastructure', secondaries: ['Smart Buildings', 'CRE Strategy'] },
  { slug: 'the-hidden-roi-of-digital-infrastructure-ownership-in-commercial-real-estate', primary: 'NOI & Revenue', secondaries: ['Digital Infrastructure', 'Data Ownership'] },
  { slug: 'data-infrastructure-the-engine-behind-modern-cre-operations', primary: 'Data Ownership', secondaries: ['Digital Infrastructure', 'Operational Control'] },
  { slug: 'ai-in-commercial-real-estate-innovation-ethics-and-the-new-regulatory', primary: 'AI Readiness', secondaries: ['Vendor Control & Governance', 'Smart Buildings'] },
  { slug: 'not-just-smart-strategic-buildings-built-for-better-tenancy', primary: 'Tenant Experience', secondaries: ['Smart Buildings', 'Building Intelligence'] },
  { slug: 'cre-tech-revolution-data-driven-properties', primary: 'CRE Strategy', secondaries: ['Data Ownership', 'Building Intelligence'] },
  { slug: 'iot-networks-operational-efficiency-commercial-real-estate', primary: 'Operational Control', secondaries: ['Smart Buildings', 'Building Intelligence'] },
  { slug: 'smart-security-future-access-control-protection', primary: 'Smart Buildings', secondaries: ['Tenant Experience'] },
  { slug: 'invisible-workforce-iot-networks-running-cre', primary: 'Operational Control', secondaries: ['Smart Buildings', 'Building Intelligence'] },
  { slug: 'ai-revolutionizing-commercial-property-security-beyond-surveillance', primary: 'Smart Buildings', secondaries: ['AI Readiness', 'Tenant Experience'] },
  { slug: 'digital-infrastructure-office-residential-conversions', primary: 'Digital Infrastructure', secondaries: ['CRE Strategy', 'Tenant Experience'] },
  { slug: '5-genius-ways-smart-building-tech-elevates-tenant-experience', primary: 'Tenant Experience', secondaries: ['Smart Buildings'] },
  { slug: 'own-your-buildings-digital-infrastructure-or-be-owned-by-it', primary: 'Digital Infrastructure', secondaries: ['Data Ownership', 'Vendor Control & Governance'] },
  { slug: 'soaring-above-rest-opticwise-cre-thrive-flight-quality-era', primary: 'CRE Strategy', secondaries: ['Smart Buildings', 'Tenant Experience'] },
  { slug: 'network-compliance-multi-tenant-commercial-properties', primary: 'Vendor Control & Governance', secondaries: ['Digital Infrastructure', 'Operational Control'] },
  { slug: 'smart-building-technology-enhances-tenant-experience', primary: 'Tenant Experience', secondaries: ['Smart Buildings'] },
  { slug: 'network-resilience-smart-building-success', primary: 'Digital Infrastructure', secondaries: ['Smart Buildings', 'Operational Control'] },
  { slug: 'how-building-intelligence-drives-sustainable-work-environments', primary: 'Building Intelligence', secondaries: ['Operational Control', 'Digital Infrastructure'] },
  { slug: 'digital-twins-revolutionizing-commercial-real-estate', primary: 'Smart Buildings', secondaries: ['Building Intelligence', 'Operational Control'] },
  { slug: 'impact-cre-technology-real-estate', primary: 'CRE Strategy', secondaries: ['Smart Buildings', 'Operational Control'] },
  { slug: 'advanced-iot-device-management-strategies', primary: 'Operational Control', secondaries: ['Smart Buildings', 'Vendor Control & Governance'] },
  { slug: 'digital-infrastructure-commercial-real-estate', primary: 'Digital Infrastructure', secondaries: ['CRE Strategy', 'Smart Buildings'] },
  { slug: 'building-management-systems-security-connectivity', primary: 'Smart Buildings', secondaries: ['Building Intelligence', 'Operational Control'] },
  { slug: 'commercial-real-estate-technology', primary: 'CRE Strategy', secondaries: ['Smart Buildings', 'Operational Control'] },
  { slug: 'building-automation-systems-future-of-smart-buildings', primary: 'Building Intelligence', secondaries: ['Smart Buildings', 'Digital Infrastructure'] },
  { slug: 'transforming-spaces-smart-building-technology', primary: 'Smart Buildings', secondaries: ['NOI & Revenue', 'Operational Control'] },
  { slug: 'future-proof-network-digital-era', primary: 'Digital Infrastructure', secondaries: ['CRE Strategy'] },
  { slug: 'how-intelligent-buildings-revolutionize-multi-family-living', primary: 'Tenant Experience', secondaries: ['Building Intelligence', 'Smart Buildings'] },
  { slug: 'how-digital-infrastructure-shapes-modern-business', primary: 'Digital Infrastructure', secondaries: ['CRE Strategy', 'Tenant Experience'] },
  { slug: 'intelligent-buildings-investment-trend', primary: 'CRE Strategy', secondaries: ['Building Intelligence', 'Smart Buildings'] },
  { slug: 'smart-access-workspace-optimization-modern-space-as-a-service', primary: 'Tenant Experience', secondaries: ['Smart Buildings', 'Operational Control'] },
  { slug: 'resolute-building-intelligence-commercial-real-estate-management', primary: 'Building Intelligence', secondaries: ['Smart Buildings', 'Operational Control'] },
  { slug: 'how-smart-tech-is-shattering-modern-boundaries', primary: 'Smart Buildings', secondaries: ['Tenant Experience', 'Operational Control'] },
  { slug: 'how-smart-technology-enhances-tenant-experience-commercial-real-estate', primary: 'Tenant Experience', secondaries: ['Smart Buildings'] },
  { slug: 'proactive-cybersecurity-smart-building-tech-keeps-tenants-safe', primary: 'Smart Buildings', secondaries: ['Tenant Experience', 'Vendor Control & Governance'] },
  { slug: 'integrating-iot-smarter-safer-cre-building-management', primary: 'Smart Buildings', secondaries: ['Operational Control', 'Building Intelligence'] },
  { slug: 'leveraging-data-analytics-optimize-commercial-real-estate-assets', primary: 'Data Ownership', secondaries: ['Building Intelligence', 'Operational Control'] },
  { slug: 'future-cre-operations-intelligent-building-systems', primary: 'Building Intelligence', secondaries: ['Smart Buildings', 'Operational Control'] },
  { slug: 'ai-iot-modern-commercial-real-estate-management', primary: 'AI Readiness', secondaries: ['Smart Buildings', 'Building Intelligence'] },
  { slug: 'benefits-of-intelligent-building-management-for-multi-family-communities', primary: 'Building Intelligence', secondaries: ['Tenant Experience', 'Operational Control'] },
  { slug: 'artificial-intelligence-in-commercial-real-estate', primary: 'AI Readiness', secondaries: ['Operational Control', 'Tenant Experience'] },
  { slug: 'best-practices-in-building-management', primary: 'Building Intelligence', secondaries: ['Operational Control', 'NOI & Revenue'] },
  { slug: 'opticwise-building-intelligence-commercial-real-estate', primary: 'Building Intelligence', secondaries: ['NOI & Revenue', 'Smart Buildings'] },
  { slug: 'how-technology-is-transforming-real-estate-management', primary: 'CRE Strategy', secondaries: ['Smart Buildings', 'Building Intelligence'] },
  { slug: 'what-is-digital-infrastructure-commercial-real-estate', primary: 'Digital Infrastructure', secondaries: ['CRE Strategy', 'Building Intelligence'] },
  { slug: 'transitioning-to-digital-first-commercial-real-estate-portfolio-owners', primary: 'CRE Strategy', secondaries: ['Digital Infrastructure', 'Building Intelligence'] },
  { slug: 'The-LLM-Model-Just-Became-a-Commodity', primary: 'AI Readiness', secondaries: ['Data Ownership', 'CRE Strategy'] },
];

// ---------- helpers ----------

// HTML-escape an ampersand inside text or attribute content. The build
// script's decodeEntities() reverses this when reading the category.
function htmlEscapeAmp(s) {
  return s.replace(/&/g, '&amp;');
}

// Pill regex: opening tag through inner text through closing </span>.
// Mirrors the pattern in scripts/build-insights-index.mjs (line ~213)
// so the build script reads back exactly what we write.
const PILL_RE = /(<span class="block text-xs font-bold text-blue-300 bg-blue-400\/10[^"]*">)([\s\S]*?)(<\/span>)/;

// An existing hidden secondary-cats sibling element placed immediately
// after the pill (or anywhere in the document — we anchor against the
// pill on insert).
const EXISTING_SECONDARY_RE = /<span\s+hidden\s+data-ow-secondary-cats="[^"]*"\s*><\/span>/;

function validatePlan(plan) {
  const errors = [];
  const seenSlugs = new Set();
  for (const entry of plan) {
    if (seenSlugs.has(entry.slug)) errors.push(`${entry.slug}: duplicate plan entry`);
    seenSlugs.add(entry.slug);

    if (!ALLOWED_SET.has(entry.primary)) {
      errors.push(`${entry.slug}: primary not in allowed list: ${JSON.stringify(entry.primary)}`);
    }
    if (!Array.isArray(entry.secondaries)) {
      errors.push(`${entry.slug}: secondaries must be an array`);
      continue;
    }
    if (entry.secondaries.length > 2) {
      errors.push(`${entry.slug}: more than 2 secondaries (${entry.secondaries.length})`);
    }
    const secSeen = new Set();
    for (const s of entry.secondaries) {
      if (!ALLOWED_SET.has(s)) errors.push(`${entry.slug}: secondary not in allowed list: ${JSON.stringify(s)}`);
      if (s === entry.primary) errors.push(`${entry.slug}: secondary equals primary: ${JSON.stringify(s)}`);
      if (secSeen.has(s)) errors.push(`${entry.slug}: duplicate secondary: ${JSON.stringify(s)}`);
      secSeen.add(s);
    }
  }
  return errors;
}

function applyToHtml(html, primary, secondaries) {
  const pillMatch = html.match(PILL_RE);
  if (!pillMatch) return { html, changed: false, reason: 'pill-not-found' };

  // Build the replacement pill with HTML-escaped ampersand and a
  // literal Unicode trademark character (decodeEntities accepts both
  // the literal char and &#x2122; transparently).
  const newPillInner = htmlEscapeAmp(primary);
  const newPill = pillMatch[1] + newPillInner + pillMatch[3];

  // Build the secondary metadata element. Empty list -> remove element.
  const secAttr = secondaries.map(htmlEscapeAmp).join(', ');
  const secEl = secondaries.length > 0
    ? `<span hidden data-ow-secondary-cats="${secAttr}"></span>`
    : '';

  // Step 1: rewrite the pill in place.
  let next = html.replace(PILL_RE, newPill);

  // Step 2: handle the sibling secondary element.
  if (EXISTING_SECONDARY_RE.test(next)) {
    if (secEl) {
      next = next.replace(EXISTING_SECONDARY_RE, secEl);
    } else {
      next = next.replace(EXISTING_SECONDARY_RE, '');
    }
  } else if (secEl) {
    // Insert the new element immediately after the pill close.
    next = next.replace(PILL_RE, (_match, open, _inner, close) =>
      open + newPillInner + close + secEl,
    );
  }

  return { html: next, changed: true };
}

function fmtSecondaries(secondaries) {
  return secondaries.length ? `[${secondaries.join(', ')}]` : '[]';
}

// ---------- main ----------

function main() {
  const errors = validatePlan(PLAN);
  if (errors.length) {
    console.error('Plan validation failed:');
    for (const e of errors) console.error('  -', e);
    process.exit(1);
  }

  let written = 0;
  let unchanged = 0;
  const issues = [];

  for (const entry of PLAN) {
    const file = join(INSIGHTS_DIR, entry.slug, 'index.html');
    if (!existsSync(file)) {
      issues.push(`${entry.slug}: index.html missing`);
      continue;
    }
    const html = readFileSync(file, 'utf8');
    const { html: next, changed, reason } = applyToHtml(html, entry.primary, entry.secondaries);
    if (!changed) {
      issues.push(`${entry.slug}: ${reason}`);
      continue;
    }
    if (next !== html) {
      writeFileSync(file, next, 'utf8');
      written++;
    } else {
      unchanged++;
    }
    console.log(`${entry.slug} \u2014 ${entry.primary} ${fmtSecondaries(entry.secondaries)}`);
  }

  console.log('');
  console.log(`Plan size: ${PLAN.length}`);
  console.log(`Files written: ${written}`);
  console.log(`Already up-to-date: ${unchanged}`);
  if (issues.length) {
    console.log(`Issues (${issues.length}):`);
    for (const i of issues) console.log('  -', i);
  }
}

main();
