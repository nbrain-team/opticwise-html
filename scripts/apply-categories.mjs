#!/usr/bin/env node
// One-off script: apply primary + secondary category decisions to every
// /insights/<slug>/index.html. Replaces the visible primary pill text and
// inserts/updates a hidden secondary-cats metadata element immediately
// after the pill. Run from repo root:
//
//   node scripts/apply-categories.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const INSIGHTS_DIR = join(ROOT, 'insights');

const ALLOWED = new Set([
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
  'The 5C™ Plan',
  'Vendor Control & Governance',
]);

// slug -> { primary, secondaries[] }
const MAPPING = {
  'ai-agents-permissions-cre-orchestration': { primary: 'Building Intelligence', secondaries: ['Vendor Control & Governance', 'AI Readiness'] },
  'your-pms-has-an-api-thats-not-the-same-as-a-data-strategy': { primary: 'Data Ownership', secondaries: ['Vendor Control & Governance'] },
  'the-ai-model-is-commoditizing-your-owner-data-is-the-real-moat': { primary: 'Data Ownership', secondaries: ['AI Readiness', 'CRE Strategy'] },
  'why-cre-tech-is-shifting-from-point-solutions-to-platforms-and-what-to-do-about': { primary: 'Vendor Control & Governance', secondaries: ['CRE Strategy', 'Data Ownership'] },
  'the-winners-in-cre-will-own-the-stacknot-just-the-asset': { primary: 'CRE Strategy', secondaries: ['Data Ownership', 'Digital Infrastructure'] },
  'the-most-valuable-asset-in-cre-isnt-the-buildingits-the-data': { primary: 'Data Ownership', secondaries: ['CRE Strategy', 'NOI & Revenue'] },
  'the-hidden-cost-killing-your-noi-and-you-dont-see-it': { primary: 'NOI & Revenue', secondaries: ['Operational Control', 'Data Ownership'] },
  'operational-efficiency-is-the-new-alpha-in-commercial-real-estate': { primary: 'Operational Control', secondaries: ['NOI & Revenue', 'CRE Strategy'] },
  'data-centers-are-the-new-cre-gravity-well': { primary: 'CRE Strategy', secondaries: ['Digital Infrastructure'] },
  'owners-are-overwhelmednot-under-informed': { primary: 'CRE Strategy', secondaries: ['Operational Control'] },
  'capex-is-tightening-roi-scrutiny-is-brutal-and-cool-tech-is-dead': { primary: 'NOI & Revenue', secondaries: ['CRE Strategy'] },
  'ai-wont-fix-your-propertyit-will-expose-whats-broken': { primary: 'AI Readiness', secondaries: ['Operational Control'] },
  'ai-wont-fix-your-propertybut-this-will': { primary: 'AI Readiness', secondaries: ['Digital Infrastructure', 'Data Ownership'] },
  'ai-will-commoditize-creunless-you-own-something-it-cant-replicate': { primary: 'CRE Strategy', secondaries: ['Data Ownership', 'AI Readiness'] },
  'if-your-building-sold-tomorrow-would-the-data-be-included': { primary: 'Data Ownership', secondaries: ['NOI & Revenue', 'CRE Strategy'] },
  'ai-needs-a-nervous-system-why-digital-infrastructure-is-the-real-enabler': { primary: 'Digital Infrastructure', secondaries: ['AI Readiness'] },
  'ai-governance-is-now-a-cre-risk-category-are-you-exposed': { primary: 'Vendor Control & Governance', secondaries: ['AI Readiness'] },
  'why-asset-managers-are-flying-blind-and-dont-even-know-it': { primary: 'Operational Control', secondaries: ['CRE Strategy', 'Data Ownership'] },
  'hyperscalers-are-industrializing-digital-infrastructure-your-building-is-next': { primary: 'Digital Infrastructure', secondaries: ['CRE Strategy', 'Building Intelligence'] },
  'the-realpage-settlements-are-not-the-story-the-story-is-who-makes-your-decisions': { primary: 'Vendor Control & Governance', secondaries: ['CRE Strategy'] },
  'the-shadow-ai-problem-is-already-in-your-buildings': { primary: 'Vendor Control & Governance', secondaries: ['Building Intelligence', 'AI Readiness'] },
  'office-just-had-its-best-quarter-since-2018-the-winners-will-be-the-owners-who-c': { primary: 'CRE Strategy', secondaries: ['Operational Control'] },
  'data-centers-just-got-their-own-reit-every-owner-should-read-the-signal': { primary: 'CRE Strategy', secondaries: ['Digital Infrastructure'] },
  'blackstone-is-filing-a-2-billion-ipo-around-digital-infrastructure-most-cre-owne': { primary: 'Digital Infrastructure', secondaries: ['CRE Strategy', 'Data Ownership'] },
  'ai-promises-20-30-savings-in-your-building-thats-only-true-if-you-own-your-data': { primary: 'AI Readiness', secondaries: ['Data Ownership', 'NOI & Revenue'] },
  'blackstone-brookfield-and-jpmorgan-just-rewrote-the-rules-on-real-estate-value': { primary: 'CRE Strategy', secondaries: ['Digital Infrastructure'] },
  'ai-in-cre-wont-save-you-if-you-dont-own-your-data': { primary: 'Data Ownership', secondaries: ['AI Readiness'] },
  'when-the-scorekeeper-works-for-the-vendor-who-is-looking-out-for-you': { primary: 'Vendor Control & Governance', secondaries: ['Digital Infrastructure'] },
  'ai-wont-fix-your-building-operations-your-data-foundation-will': { primary: 'AI Readiness', secondaries: ['Data Ownership', 'Operational Control'] },
  'part-5-digital-infrastructure-as-the-strategic-foundation-for-ai-driven-esg-and': { primary: 'Digital Infrastructure', secondaries: ['AI Readiness'] },
  'part-4-ai-adoption-without-strategy-is-waste-digital-infrastructure-makes-it-wor': { primary: 'AI Readiness', secondaries: ['Digital Infrastructure', 'The 5C™ Plan'] },
  'part-3-digital-infrastructure-ai-operational-excellence-and-higher-asset-value': { primary: 'Digital Infrastructure', secondaries: ['Operational Control', 'AI Readiness'] },
  'Data-Is-the-New-Real-Estate-Utility': { primary: 'Data Ownership', secondaries: ['Digital Infrastructure', 'NOI & Revenue'] },
  'ai-isn-t-the-future-it-s-today-why-your-digital-infrastructure-must': { primary: 'AI Readiness', secondaries: ['Digital Infrastructure'] },
  'part-5-cre-s-digital-divide-why-infrastructure-ownership-determines-ai': { primary: 'AI Readiness', secondaries: ['Digital Infrastructure', 'Data Ownership'] },
  'part-4-the-coming-regulation-wave-why-cre-must-prepare-for-ethical-ai-now': { primary: 'AI Readiness', secondaries: ['Vendor Control & Governance'] },
  'part-3-esg-illusion-why-ai-dashboards-alone-won-t-deliver-sustainable-results': { primary: 'AI Readiness', secondaries: ['Digital Infrastructure', 'Operational Control'] },
  'part-2-what-cre-gets-wrong-about-tenant-experience-hint-it-s-not-a-smart': { primary: 'Tenant Experience', secondaries: ['Digital Infrastructure'] },
  'digital-infrastructure-first-series-part-1-digital-infrastructure-is-the': { primary: 'Digital Infrastructure', secondaries: ['NOI & Revenue', 'Tenant Experience'] },
  'the-case-for-a-digital-architect-why-cre-property-managers-are-drowning-in': { primary: 'Vendor Control & Governance', secondaries: ['Operational Control', 'Digital Infrastructure'] },
  'organizational-pencils-why-agility-not-perfection-will-win-in-2026': { primary: 'CRE Strategy', secondaries: ['AI Readiness'] },
  'digital-infrastructure-isn-t-just-wi-fi-it-s-the-nervous-system-of-your-property': { primary: 'Digital Infrastructure', secondaries: ['Operational Control', 'Smart Buildings'] },
  'the-cost-of-doing-nothing-what-you-lose-by-letting-the-isp-build-your-network': { primary: 'Vendor Control & Governance', secondaries: ['Digital Infrastructure', 'NOI & Revenue'] },
  'how-one-portfolio-used-ai-to-cut-utility-spend-double-digits': { primary: 'Case Studies & Proof', secondaries: ['Operational Control', 'AI Readiness'] },
  'own-the-digital-infrastructure-own-the-leverage': { primary: 'Digital Infrastructure', secondaries: ['Data Ownership', 'Vendor Control & Governance'] },
  'trust-at-first-sight-data-dictionaries-refresh-stamps-and-adoption': { primary: 'Data Ownership', secondaries: ['Operational Control'] },
  'what-ai-is-doing-to-apartment-demand-and-how-buildings-must-respond': { primary: 'Tenant Experience', secondaries: ['AI Readiness', 'CRE Strategy'] },
  'the-genai-divide-what-cre-leaders-must-know-before-falling-behind': { primary: 'AI Readiness', secondaries: ['Data Ownership', 'CRE Strategy'] },
  'the-post-pandemic-office-isn-t-smaller-it-s-smarter': { primary: 'CRE Strategy', secondaries: ['Smart Buildings', 'Tenant Experience'] },
  'cretech-2025-the-ai-illusion-and-the-next-wave-no-one-s-talking-about': { primary: 'AI Readiness', secondaries: ['CRE Strategy'] },
  'from-data-to-decisions-what-cre-can-learn-from-cortland-s-product-mindset': { primary: 'Data Ownership', secondaries: ['Operational Control', 'AI Readiness'] },
  'cre-owners-are-the-data-stewards-whether-you-know-it-or-not': { primary: 'Data Ownership', secondaries: ['Vendor Control & Governance'] },
  'the-hidden-tech-debt-you-won-t-catch-in-the-code': { primary: 'Vendor Control & Governance', secondaries: ['Operational Control'] },
  'mastering-control-the-final-c-in-the-5c-framework': { primary: 'The 5C™ Plan', secondaries: ['Building Intelligence', 'Operational Control'] },
  'bringing-systems-together-the-coordination-step-in-the-five-c-s': { primary: 'The 5C™ Plan', secondaries: ['Operational Control', 'Vendor Control & Governance'] },
  'collect-unlocking-the-value-hidden-in-your-building-s-data': { primary: 'The 5C™ Plan', secondaries: ['Data Ownership'] },
  'connect-creating-the-flow-that-unlocks-your-building-s-potential': { primary: 'The 5C™ Plan', secondaries: ['Digital Infrastructure'] },
  'clarify-the-first-step-to-peak-property-performance': { primary: 'The 5C™ Plan', secondaries: ['Data Ownership'] },
  'the-hidden-cost-of-vendor-sprawl-and-what-to-do-about-it': { primary: 'Vendor Control & Governance', secondaries: ['Operational Control'] },
  'the-operator-s-guide-to-autonomous-buildings': { primary: 'Building Intelligence', secondaries: ['Operational Control', 'AI Readiness'] },
  'wi-fi-is-not-a-utility-it-s-an-investment-signal': { primary: 'CRE Strategy', secondaries: ['Digital Infrastructure', 'NOI & Revenue'] },
  'digital-first-strategy-the-only-competitive-edge-that-lasts': { primary: 'CRE Strategy', secondaries: ['Digital Infrastructure', 'Operational Control'] },
  'tthe-hidden-cap-rate-enhancer-no-one-talks-about': { primary: 'NOI & Revenue', secondaries: ['Digital Infrastructure', 'CRE Strategy'] },
  'how-one-operator-cut-120k-in-opex-with-a-single-upgrade': { primary: 'Case Studies & Proof', secondaries: ['Operational Control', 'NOI & Revenue'] },
  'reframing-cre-strategy-stop-playing-to-win-start-building-to-endure': { primary: 'CRE Strategy', secondaries: ['Data Ownership', 'Operational Control'] },
  'what-s-your-smart-building-strategy-or-are-you-guessing': { primary: 'CRE Strategy', secondaries: ['Smart Buildings', 'Digital Infrastructure'] },
  'what-starbucks-taught-us-about-smart-property-ops': { primary: 'Operational Control', secondaries: ['CRE Strategy', 'NOI & Revenue'] },
  'why-98-of-property-owners-are-leaving-money-on-the-table': { primary: 'NOI & Revenue', secondaries: ['Operational Control', 'Tenant Experience'] },
  'what-swedish-beach-volleyball-can-teach-you-about-cre-strategy': { primary: 'CRE Strategy', secondaries: ['The 5C™ Plan', 'Operational Control'] },
  'why-power-and-not-just-square-footage-is-the-future-of-smart-buildings': { primary: 'Smart Buildings', secondaries: ['CRE Strategy', 'Digital Infrastructure'] },
  'the-800k-conversation-developers-keep-missing': { primary: 'NOI & Revenue', secondaries: ['Digital Infrastructure', 'Vendor Control & Governance'] },
  'who-s-making-480k-year-off-your-tenants-hint-it-s-not-you': { primary: 'NOI & Revenue', secondaries: ['Vendor Control & Governance', 'Data Ownership'] },
  'data-lake-not-data-swamp-structuring-what-you-collect': { primary: 'Data Ownership', secondaries: ['AI Readiness'] },
  'before-ai-you-need-data-you-actually-own': { primary: 'Data Ownership', secondaries: ['AI Readiness'] },
  'from-wifi-to-wealth-the-hidden-profit-in-connectivity': { primary: 'NOI & Revenue', secondaries: ['Digital Infrastructure', 'Tenant Experience'] },
  'monetize-like-amazon-analyze-like-google-and-avoid-tesla-s-data-missteps': { primary: 'NOI & Revenue', secondaries: ['Data Ownership', 'Smart Buildings'] },
  'why-redundant-networks-are-silent-killers': { primary: 'Vendor Control & Governance', secondaries: ['Digital Infrastructure', 'NOI & Revenue'] },
  'invisible-guardians-redefining-privacy-in-commercial-real-estate': { primary: 'Vendor Control & Governance', secondaries: ['Tenant Experience', 'Smart Buildings'] },
  'from-liability-to-leadership-how-cre-data-unlocks-value-in-at-risk-assets': { primary: 'Data Ownership', secondaries: ['CRE Strategy', 'NOI & Revenue'] },
  'from-amenities-to-expectations-on-demand-connectivity-as-a-cre-necessity': { primary: 'Tenant Experience', secondaries: ['Digital Infrastructure'] },
  'built-to-last-why-smart-infrastructure-is-the-backbone-of-future-proof': { primary: 'Digital Infrastructure', secondaries: ['Smart Buildings', 'CRE Strategy'] },
  'the-hidden-roi-of-digital-infrastructure-ownership-in-commercial-real-estate': { primary: 'NOI & Revenue', secondaries: ['Digital Infrastructure', 'Data Ownership'] },
  'data-infrastructure-the-engine-behind-modern-cre-operations': { primary: 'Data Ownership', secondaries: ['Operational Control', 'Digital Infrastructure'] },
  'ai-in-commercial-real-estate-innovation-ethics-and-the-new-regulatory': { primary: 'AI Readiness', secondaries: ['Vendor Control & Governance'] },
  'not-just-smart-strategic-buildings-built-for-better-tenancy': { primary: 'Tenant Experience', secondaries: ['Smart Buildings'] },
  'cre-tech-revolution-data-driven-properties': { primary: 'CRE Strategy', secondaries: ['Data Ownership'] },
  'iot-networks-operational-efficiency-commercial-real-estate': { primary: 'Operational Control', secondaries: ['Smart Buildings'] },
  'smart-security-future-access-control-protection': { primary: 'Smart Buildings', secondaries: ['Operational Control', 'AI Readiness'] },
  'invisible-workforce-iot-networks-running-cre': { primary: 'Operational Control', secondaries: ['Smart Buildings', 'Building Intelligence'] },
  'ai-revolutionizing-commercial-property-security-beyond-surveillance': { primary: 'Smart Buildings', secondaries: ['AI Readiness', 'Operational Control'] },
  'digital-infrastructure-office-residential-conversions': { primary: 'Digital Infrastructure', secondaries: ['CRE Strategy', 'Tenant Experience'] },
  '5-genius-ways-smart-building-tech-elevates-tenant-experience': { primary: 'Tenant Experience', secondaries: ['Smart Buildings'] },
  'own-your-buildings-digital-infrastructure-or-be-owned-by-it': { primary: 'Digital Infrastructure', secondaries: ['Data Ownership', 'Vendor Control & Governance'] },
  'soaring-above-rest-opticwise-cre-thrive-flight-quality-era': { primary: 'CRE Strategy', secondaries: ['Smart Buildings'] },
  'network-compliance-multi-tenant-commercial-properties': { primary: 'Vendor Control & Governance', secondaries: ['Digital Infrastructure'] },
  'smart-building-technology-enhances-tenant-experience': { primary: 'Tenant Experience', secondaries: ['Smart Buildings'] },
  'network-resilience-smart-building-success': { primary: 'Digital Infrastructure', secondaries: ['Smart Buildings', 'Operational Control'] },
  'how-building-intelligence-drives-sustainable-work-environments': { primary: 'Building Intelligence', secondaries: ['Smart Buildings', 'Operational Control'] },
  'digital-twins-revolutionizing-commercial-real-estate': { primary: 'Smart Buildings', secondaries: ['Operational Control', 'Building Intelligence'] },
  'impact-cre-technology-real-estate': { primary: 'CRE Strategy', secondaries: ['Smart Buildings'] },
  'advanced-iot-device-management-strategies': { primary: 'Operational Control', secondaries: ['Smart Buildings', 'Vendor Control & Governance'] },
  'digital-infrastructure-commercial-real-estate': { primary: 'Digital Infrastructure', secondaries: ['CRE Strategy'] },
  'building-management-systems-security-connectivity': { primary: 'Smart Buildings', secondaries: ['Operational Control', 'Digital Infrastructure'] },
  'commercial-real-estate-technology': { primary: 'CRE Strategy', secondaries: ['Smart Buildings'] },
  'building-automation-systems-future-of-smart-buildings': { primary: 'Smart Buildings', secondaries: ['Building Intelligence', 'Operational Control'] },
  'transforming-spaces-smart-building-technology': { primary: 'Smart Buildings', secondaries: ['Tenant Experience', 'Operational Control'] },
  'future-proof-network-digital-era': { primary: 'Digital Infrastructure', secondaries: ['Operational Control'] },
  'how-intelligent-buildings-revolutionize-multi-family-living': { primary: 'Tenant Experience', secondaries: ['Building Intelligence', 'Smart Buildings'] },
  'how-digital-infrastructure-shapes-modern-business': { primary: 'Digital Infrastructure', secondaries: ['CRE Strategy'] },
  'intelligent-buildings-investment-trend': { primary: 'CRE Strategy', secondaries: ['Smart Buildings', 'Building Intelligence'] },
  'smart-access-workspace-optimization-modern-space-as-a-service': { primary: 'Tenant Experience', secondaries: ['Smart Buildings'] },
  'resolute-building-intelligence-commercial-real-estate-management': { primary: 'Building Intelligence', secondaries: ['Smart Buildings', 'Operational Control'] },
  'how-smart-tech-is-shattering-modern-boundaries': { primary: 'Smart Buildings', secondaries: ['Operational Control', 'Building Intelligence'] },
  'how-smart-technology-enhances-tenant-experience-commercial-real-estate': { primary: 'Tenant Experience', secondaries: ['Smart Buildings'] },
  'proactive-cybersecurity-smart-building-tech-keeps-tenants-safe': { primary: 'Smart Buildings', secondaries: ['Vendor Control & Governance', 'Tenant Experience'] },
  'integrating-iot-smarter-safer-cre-building-management': { primary: 'Smart Buildings', secondaries: ['Operational Control', 'Digital Infrastructure'] },
  'leveraging-data-analytics-optimize-commercial-real-estate-assets': { primary: 'Data Ownership', secondaries: ['Operational Control', 'AI Readiness'] },
  'future-cre-operations-intelligent-building-systems': { primary: 'Building Intelligence', secondaries: ['Operational Control', 'Smart Buildings'] },
  'ai-iot-modern-commercial-real-estate-management': { primary: 'AI Readiness', secondaries: ['Smart Buildings', 'Operational Control'] },
  'benefits-of-intelligent-building-management-for-multi-family-communities': { primary: 'Building Intelligence', secondaries: ['Smart Buildings', 'Tenant Experience'] },
  'artificial-intelligence-in-commercial-real-estate': { primary: 'AI Readiness', secondaries: ['CRE Strategy', 'Building Intelligence'] },
  'best-practices-in-building-management': { primary: 'Operational Control', secondaries: ['Building Intelligence', 'NOI & Revenue'] },
  'opticwise-building-intelligence-commercial-real-estate': { primary: 'Building Intelligence', secondaries: ['Smart Buildings', 'Operational Control'] },
  'how-technology-is-transforming-real-estate-management': { primary: 'CRE Strategy', secondaries: ['Smart Buildings', 'Building Intelligence'] },
  'what-is-digital-infrastructure-commercial-real-estate': { primary: 'Digital Infrastructure', secondaries: ['CRE Strategy'] },
  'transitioning-to-digital-first-commercial-real-estate-portfolio-owners': { primary: 'CRE Strategy', secondaries: ['Digital Infrastructure'] },
  'The-LLM-Model-Just-Became-a-Commodity': { primary: 'AI Readiness', secondaries: ['Data Ownership', 'CRE Strategy'] },
};

// Sanity-check the mapping itself before touching files.
function validateMapping() {
  const errors = [];
  for (const [slug, entry] of Object.entries(MAPPING)) {
    if (!ALLOWED.has(entry.primary)) errors.push(`${slug}: primary not in allowed list: ${entry.primary}`);
    for (const s of entry.secondaries) {
      if (!ALLOWED.has(s)) errors.push(`${slug}: secondary not in allowed list: ${s}`);
      if (s === entry.primary) errors.push(`${slug}: secondary equals primary: ${s}`);
    }
    if (new Set(entry.secondaries).size !== entry.secondaries.length) {
      errors.push(`${slug}: duplicate secondaries`);
    }
    if (entry.secondaries.length > 2) errors.push(`${slug}: more than 2 secondaries`);
  }
  if (errors.length) {
    console.error('Mapping validation failed:');
    for (const e of errors) console.error('  -', e);
    process.exit(1);
  }
}

// Pill regex: opening tag through inner text through closing </span>.
// Matches the exact class string the build script already uses.
const PILL_RE = /(<span class="block text-xs font-bold text-blue-300 bg-blue-400\/10[^"]*">)([\s\S]*?)(<\/span>)/;

// Existing secondary-cats element that we may need to overwrite.
const EXISTING_SECONDARY_RE = /<span\s+hidden\s+data-ow-secondary-cats="[^"]*"\s*><\/span>/;

function applyToHtml(html, primary, secondaries) {
  const pillMatch = html.match(PILL_RE);
  if (!pillMatch) return { html, changed: false, reason: 'pill-not-found' };
  const newPill = pillMatch[1] + primary + pillMatch[3];
  const secAttr = secondaries.join(', ');
  const secEl = `<span hidden data-ow-secondary-cats="${secAttr}"></span>`;

  let next = html.replace(PILL_RE, newPill);

  if (EXISTING_SECONDARY_RE.test(next)) {
    next = next.replace(EXISTING_SECONDARY_RE, secEl);
  } else {
    // Insert secondary element immediately after the pill close </span>.
    next = next.replace(PILL_RE, (_, open, _inner, close) => open + primary + close + secEl);
  }
  return { html: next, changed: true };
}

function main() {
  validateMapping();

  const slugs = Object.keys(MAPPING);
  let updated = 0;
  const issues = [];
  for (const slug of slugs) {
    const file = join(INSIGHTS_DIR, slug, 'index.html');
    if (!existsSync(file)) {
      issues.push(`${slug}: index.html missing`);
      continue;
    }
    const html = readFileSync(file, 'utf8');
    const { html: next, changed, reason } = applyToHtml(html, MAPPING[slug].primary, MAPPING[slug].secondaries);
    if (!changed) {
      issues.push(`${slug}: ${reason}`);
      continue;
    }
    if (next !== html) {
      writeFileSync(file, next, 'utf8');
      updated++;
    }
  }
  console.log(`Updated ${updated}/${slugs.length} posts.`);
  if (issues.length) {
    console.log(`${issues.length} issue(s):`);
    for (const i of issues) console.log('  -', i);
  }
}

main();
