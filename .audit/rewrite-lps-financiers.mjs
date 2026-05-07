#!/usr/bin/env node
// Rebuild /for-lps-and-financiers — LP/GP/lender diligence frame + refi/disposition math,
// operator/IT read-through (how PM + IT orgs actually experience OT), preserved bot/brain
// blocks, hydrated JSON in lockstep.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PAGE_PATH = join(ROOT, "for-lps-and-financiers/index.html");

function normalize(s) {
  return String(s).replace(/\u2019/g, "'");
}
function H(s) {
  return normalize(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#x27;")
    .replace(/"/g, "&quot;");
}
function J(s) {
  return normalize(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/&/g, "\\u0026");
}

function htmlBotCallout(b) {
  const pillars = b.pillars
    .map(
      (p) =>
        `<div class="bot__pillar"><div class="bot__pillar-title">${H(p.title)}</div><p class="bot__pillar-desc">${H(p.description)}</p></div>`
    )
    .join("");
  return (
    `<section class="bot"><div class="container">` +
    `<div class="bot__header"><span class="bot__badge">${H(b.layerLabel)}</span>` +
    `<span class="eyebrow" style="color:var(--text-muted)">${H(b.eyebrow)}</span></div>` +
    `<h2 class="h2">${H(b.heading)}</h2>` +
    `<div class="bot__callout">${b.botCalloutInnerHtml}</div>` +
    `<div class="bot__pillars">${pillars}</div>` +
    `</div></section>`
  );
}

function htmlBrainBlock(b) {
  const paras = b.bodyHtml.map((html) => html).join("");
  return (
    `<section class="brain"><div class="container"><div class="brain__inner">` +
    `<div class="bot__header"><span class="bot__badge" style="background:var(--accent-bright);color:#001620">${H(b.layerLabel)}</span>` +
    `<span class="eyebrow" style="color:var(--accent-bright)">${H(b.eyebrow)}</span></div>` +
    `<h2 class="h2" style="color:white">${H(b.heading)}</h2>` +
    `<p class="brain__tagline">${H(b.tagline)}</p>` +
    `<div class="brain__body">${paras}</div>` +
    `<div class="brain__flow">${H(b.flowLine)}</div>` +
    `</div></div></section>`
  );
}

const renderers = {
  hero(b) {
    const sec2 =
      b.secondaryCtaLabel && b.secondaryCtaHref
        ? `<a class="btn btn-secondary" href="${H(b.secondaryCtaHref)}">${H(b.secondaryCtaLabel)}</a>`
        : "";
    return (
      `<section class="hero hero--${H(b.style)}"><div class="hero__bg" aria-hidden="true"></div>` +
      `<div class="container"><div class="hero__content">` +
      `<span class="eyebrow hero__eyebrow">${H(b.eyebrow)}</span>` +
      `<h1 class="h-display hero__heading">${H(b.heading)}</h1>` +
      `<p class="lede hero__lede">${H(b.lede)}</p>` +
      (b.reframeLine ? `<p class="hero__reframe">${H(b.reframeLine)}</p>` : "") +
      (b.audienceLine ? `<p class="hero__audience">${H(b.audienceLine)}</p>` : "") +
      `<div class="hero__cta"><button type="button" class="btn btn-primary btn-arrow">${H(b.primaryCtaLabel)}</button>${sec2}</div>` +
      `</div></div></section>`
    );
  },
  twoColumn(b) {
    return (
      `<section class="twocol twocol--${H(b.style)}"><div class="container"><div class="twocol__wrap">` +
      `<span class="eyebrow">${H(b.eyebrow)}</span>` +
      `<div class="accent-line"></div>` +
      `<h2 class="h2">${H(b.heading)}</h2>` +
      (b.subheading ? `<p class="lede" style="margin-top:1rem;max-width:65ch">${H(b.subheading)}</p>` : "") +
      (b.authorityNote ? `<p class="twocol__authority">${H(b.authorityNote)}</p>` : "") +
      `</div></div></section>`
    );
  },
  cardGrid(b) {
    const cards = b.cards
      .map(
        (c) =>
          `<div class="cards__card">` +
          `<h3 class="cards__card-title">${H(c.title)}</h3>` +
          `<p class="cards__card-desc">${H(c.description)}</p>` +
          `</div>`
      )
      .join("");
    return (
      `<section class="cards cards--${H(b.style)} cards--cols-${H(b.columns)}"><div class="container">` +
      `<div class="cards__header">` +
      `<span class="eyebrow">${H(b.eyebrow)}</span>` +
      `<div class="accent-line"></div>` +
      `<h2 class="h2">${H(b.heading)}</h2>` +
      (b.subheading ? `<p class="lede" style="margin-top:1rem;max-width:60ch">${H(b.subheading)}</p>` : "") +
      `</div>` +
      `<div class="cards__grid">${cards}</div>` +
      (b.closingLine ? `<p class="cards__closing">${H(b.closingLine)}</p>` : "") +
      `</div></section>`
    );
  },
  botCallout: htmlBotCallout,
  brainBlock: htmlBrainBlock,
  pullQuote(b) {
    return (
      `<section class="quote quote--${H(b.style)}"><div class="container-narrow"><div class="quote__inner">` +
      (b.eyebrow ? `<span class="eyebrow quote__eyebrow">${H(b.eyebrow)}</span>` : "") +
      `<blockquote class="quote__text">\u201C<!-- -->${H(b.quote)}<!-- -->\u201D</blockquote>` +
      (b.attribution ? `<span class="quote__attr">${H(b.attribution)}</span>` : "") +
      `</div></div></section>`
    );
  },
  avoidFailure(b) {
    const items = b.consequences.map((c) => `<li class="avoid__item">${H(c.text)}</li>`).join("");
    return (
      `<section class="avoid"><div class="container">` +
      `<span class="eyebrow avoid__eyebrow">${H(b.eyebrow)}</span>` +
      `<div class="accent-line" style="background:var(--accent-bright)"></div>` +
      `<h2 class="h2 avoid__heading">${H(b.heading)}</h2>` +
      `<p class="lede avoid__lede">${H(b.lede)}</p>` +
      `<ul class="avoid__list">${items}</ul>` +
      `<p class="avoid__punch">\u201C<!-- -->${H(b.punchLine)}<!-- -->\u201D</p>` +
      `</div></section>`
    );
  },
  callToAction(b) {
    const bullets = b.bulletPoints.map((p) => `<li class="cta__bullet">${H(p.text)}</li>`).join("");
    return (
      `<section class="cta cta--${H(b.style)}" id="cta"><div class="container"><div class="cta__inner">` +
      `<span class="eyebrow cta__eyebrow">${H(b.eyebrow)}</span>` +
      `<h2 class="h2 cta__heading">${H(b.heading)}</h2>` +
      `<p class="cta__sub">${H(b.subheading)}</p>` +
      (bullets ? `<ul class="cta__bullets">${bullets}</ul>` : "") +
      `<button type="button" class="btn btn-light btn-arrow">${H(b.buttonLabel)}</button>` +
      `</div></div></section>`
    );
  },
};

function jsonBotCallout(b) {
  const pillars = b.pillars
    .map(
      (p) =>
        `{\\"id\\":\\"${p.id}\\",\\"title\\":\\"${J(p.title)}\\",\\"description\\":\\"${J(p.description)}\\"}`
    )
    .join(",");
  return (
    `{` +
    `\\"id\\":\\"${b.id}\\",` +
    `\\"layerLabel\\":\\"${J(b.layerLabel)}\\",` +
    `\\"eyebrow\\":\\"${J(b.eyebrow)}\\",` +
    `\\"heading\\":\\"${J(b.heading)}\\",` +
    `\\"botDescription\\":\\"${J(b.botDescriptionPlain)}\\",` +
    `\\"closingLine\\":null,` +
    `\\"blockName\\":null,` +
    `\\"pillars\\":[${pillars}],` +
    `\\"blockType\\":\\"botCallout\\"` +
    `}`
  );
}

function jsonBrainBlock(b) {
  const body = b.bodyJson
    .map((p) => `{\\"id\\":\\"${p.id}\\",\\"text\\":\\"${J(p.text)}\\"}`)
    .join(",");
  return (
    `{` +
    `\\"id\\":\\"${b.id}\\",` +
    `\\"layerLabel\\":\\"${J(b.layerLabel)}\\",` +
    `\\"eyebrow\\":\\"${J(b.eyebrow)}\\",` +
    `\\"heading\\":\\"${J(b.heading)}\\",` +
    `\\"tagline\\":\\"${J(b.tagline)}\\",` +
    `\\"flowLine\\":\\"${J(b.flowLine)}\\",` +
    `\\"blockName\\":null,` +
    `\\"body\\":[${body}],` +
    `\\"blockType\\":\\"brainBlock\\"` +
    `}`
  );
}

const jsonRenderers = {
  hero(b) {
    return (
      `{` +
      `\\"id\\":\\"${b.id}\\",` +
      `\\"eyebrow\\":\\"${J(b.eyebrow)}\\",` +
      `\\"heading\\":\\"${J(b.heading)}\\",` +
      `\\"lede\\":\\"${J(b.lede)}\\",` +
      `\\"reframeLine\\":${b.reframeLine ? `\\"${J(b.reframeLine)}\\"` : "null"},` +
      `\\"audienceLine\\":${b.audienceLine ? `\\"${J(b.audienceLine)}\\"` : "null"},` +
      `\\"primaryCtaLabel\\":\\"${J(b.primaryCtaLabel)}\\",` +
      `\\"secondaryCtaLabel\\":${b.secondaryCtaLabel ? `\\"${J(b.secondaryCtaLabel)}\\"` : "null"},` +
      `\\"secondaryCtaHref\\":${b.secondaryCtaHref ? `\\"${J(b.secondaryCtaHref)}\\"` : "null"},` +
      `\\"style\\":\\"${b.style}\\",` +
      `\\"blockName\\":null,` +
      `\\"blockType\\":\\"hero\\"` +
      `}`
    );
  },
  twoColumn(b) {
    return (
      `{` +
      `\\"id\\":\\"${b.id}\\",` +
      `\\"eyebrow\\":\\"${J(b.eyebrow)}\\",` +
      `\\"heading\\":\\"${J(b.heading)}\\",` +
      `\\"subheading\\":${b.subheading ? `\\"${J(b.subheading)}\\"` : "null"},` +
      `\\"body\\":null,` +
      `\\"authorityNote\\":${b.authorityNote ? `\\"${J(b.authorityNote)}\\"` : "null"},` +
      `\\"style\\":\\"${b.style}\\",` +
      `\\"blockName\\":null,` +
      `\\"blockType\\":\\"twoColumn\\"` +
      `}`
    );
  },
  cardGrid(b) {
    const cards = b.cards
      .map(
        (c) =>
          `{\\"id\\":\\"${c.id}\\",\\"image\\":null,\\"title\\":\\"${J(c.title)}\\",\\"description\\":\\"${J(c.description)}\\",\\"href\\":null}`
      )
      .join(",");
    return (
      `{` +
      `\\"id\\":\\"${b.id}\\",` +
      `\\"eyebrow\\":\\"${J(b.eyebrow)}\\",` +
      `\\"heading\\":\\"${J(b.heading)}\\",` +
      `\\"subheading\\":${b.subheading ? `\\"${J(b.subheading)}\\"` : "null"},` +
      `\\"columns\\":\\"${b.columns}\\",` +
      `\\"style\\":\\"${b.style}\\",` +
      `\\"closingLine\\":${b.closingLine ? `\\"${J(b.closingLine)}\\"` : "null"},` +
      `\\"blockName\\":null,` +
      `\\"cards\\":[${cards}],` +
      `\\"blockType\\":\\"cardGrid\\"` +
      `}`
    );
  },
  botCallout: jsonBotCallout,
  brainBlock: jsonBrainBlock,
  pullQuote(b) {
    return (
      `{` +
      `\\"id\\":\\"${b.id}\\",` +
      `\\"eyebrow\\":\\"${J(b.eyebrow)}\\",` +
      `\\"quote\\":\\"${J(b.quote)}\\",` +
      `\\"attribution\\":\\"${J(b.attribution || "")}\\",` +
      `\\"style\\":\\"${b.style}\\",` +
      `\\"blockName\\":null,` +
      `\\"blockType\\":\\"pullQuote\\"` +
      `}`
    );
  },
  avoidFailure(b) {
    const items = b.consequences
      .map((c) => `{\\"id\\":\\"${c.id}\\",\\"text\\":\\"${J(c.text)}\\"}`)
      .join(",");
    return (
      `{` +
      `\\"id\\":\\"${b.id}\\",` +
      `\\"eyebrow\\":\\"${J(b.eyebrow)}\\",` +
      `\\"heading\\":\\"${J(b.heading)}\\",` +
      `\\"lede\\":\\"${J(b.lede)}\\",` +
      `\\"punchLine\\":\\"${J(b.punchLine)}\\",` +
      `\\"blockName\\":null,` +
      `\\"consequences\\":[${items}],` +
      `\\"blockType\\":\\"avoidFailure\\"` +
      `}`
    );
  },
  callToAction(b) {
    const bullets = (b.bulletPoints || [])
      .map((p) => `{\\"id\\":\\"${p.id}\\",\\"text\\":\\"${J(p.text)}\\"}`)
      .join(",");
    return (
      `{` +
      `\\"id\\":\\"${b.id}\\",` +
      `\\"eyebrow\\":\\"${J(b.eyebrow)}\\",` +
      `\\"heading\\":\\"${J(b.heading)}\\",` +
      `\\"subheading\\":\\"${J(b.subheading)}\\",` +
      `\\"buttonLabel\\":\\"${J(b.buttonLabel)}\\",` +
      `\\"style\\":\\"${b.style}\\",` +
      `\\"blockName\\":null,` +
      `\\"bulletPoints\\":[${bullets}],` +
      `\\"blockType\\":\\"callToAction\\"` +
      `}`
    );
  },
};

const BOT_CALLOUT_HTML =
  "Delivered through <strong>BoT\u00ae</strong> <strong>(Building of Things\u00ae)</strong>. A single, secure, segmented foundation engineered under <strong>SIC\u00ae</strong> \u2014 Security, Infrastructure, and Connectivity \u2014 owned by the sponsor, operable under governance, portable at exit.";

const BRAIN_BODY_HTML = [
  "<p><strong>Property Brain\u2122</strong> is a governed <strong>data plane + trust plane</strong>. Every output is auditable. Every decision is permissioned.</p>",
  "<p><strong>Portfolio Brain\u2122</strong> is the compounding layer \u2014 intelligence that survives each building and improves the whole portfolio over time.</p>",
  "<p>At refinance, at sale, at partner exit \u2014 governed operating intelligence transfers with the asset when the sponsor owns the substrate.</p>",
];

const BLOCKS = [
  {
    type: "hero",
    id: "69ebb63dea9de5548eff5e34",
    style: "dark",
    eyebrow: "For LPs & Financiers",
    heading: "Governance, Basis Risk, and What Transfers at Exit.",
    lede: "For limited partners, general partners, lenders, and institutional capital allocating to CRE \u2014 data & digital infrastructure is not a slide in the appendix. It is the substrate behind NOI, insurance, tenant experience, and every diligence narrative you rely on.",
    reframeLine: "If the sponsor doesn\u2019t own the data & digital infrastructure, the vendors do.",
    audienceLine: "A diligence and portfolio-governance frame for capital allocators \u2014 adjacent to how asset managers defend the same numbers.",
    primaryCtaLabel: "Schedule Your Review",
    secondaryCtaLabel: "See the asset-manager view",
    secondaryCtaHref: "../for-asset-managers/index.html",
  },
  {
    type: "twoColumn",
    id: "69ebb63dea9de5548eff5e35",
    style: "nearwhite",
    eyebrow: "Basis Risk at Refi, Sale, and Partner Exit",
    heading: "The Counterparty Underwrites the Same Asset With Different Access.",
    subheading: "You modeled a building and an NOI path. At sale or major refi, the other side runs its own process on operating data, export rights, and governance. If they surface recoverable NOI the sponsor never operationalized \u2014 or intelligence that cannot be ported \u2014 that gap becomes a negotiation input, not a footnote.",
    authorityNote: "Same systems. Same revenue line. Different rigor on who holds admin credentials, whether history is exportable, and whether \u201cinsights\u201d in the deck can be reproduced under your documentation standards. Owning data & digital infrastructure is not only an operating story. It is a diligence story \u2014 the same lesson capital markets keep re-learning at exit.",
  },
  {
    type: "twoColumn",
    id: "lp-operator-it-readthrough",
    style: "light",
    eyebrow: "The Read-Through From Property and IT",
    heading: "Operators and IT Aren\u2019t the Villains \u2014 They\u2019re Carrying the Wrong Scope.",
    subheading: "Property teams live in tenant service levels, work orders, life-safety, CAM recoveries, and vendor response times. Enterprise IT lives in identity, corporate networks, patching, and evidence packs for auditors. Multi-tenant building OT \u2014 access, BMS, metering, life-safety networks, tenant connectivity \u2014 usually grew through vendor installs, not an owner standard.",
    authorityNote: "Neither group was hired to own segmented OT, exportable history, and vendor-neutral governance end-to-end. A common pattern we see: capable people asked to cover operational technology out of position \u2014 while counterparty concentration sits in vendor admin screens. Underwriting the sponsor means reading that gap \u2014 not assuming it is closed because the operating partner forwarded a vendor uptime report.",
  },
  {
    type: "cardGrid",
    id: "69ebb63dea9de5548eff5e3c",
    style: "dark",
    columns: "2",
    eyebrow: "What to Ask",
    heading: "Six Questions for Your Next IC or Covenant Review",
    subheading: "Plain English due diligence \u2014 the answers belong in the data room, not in a vendor\u2019s ticketing system.",
    closingLine: "If the sponsor can\u2019t answer these cleanly, you are underwriting vendor dependency \u2014 not a portable intelligence position.",
    cards: [
      {
        id: "69ebb63dea9de5548eff5e36",
        title: "Who holds network admin and break-glass access?",
        description: "Sponsor-held credentials with an export path \u2014 or vendor-held keys with renewal risk?",
      },
      {
        id: "69ebb63dea9de5548eff5e37",
        title: "Is building operating data exportable on demand?",
        description: "Time-series history, alarms, and equipment context in a normalized model \u2014 not PDFs buried in portals.",
      },
      {
        id: "69ebb63dea9de5548eff5e38",
        title: "Can vendors be swapped without a rebuild?",
        description: "Documented integrations and owner-controlled segmentation \u2014 or custom glue that resets when the incumbent leaves?",
      },
      {
        id: "69ebb63dea9de5548eff5e39",
        title: "Is there a written data governance standard?",
        description: "Identity, access, retention, and lineage rules the owner can evidence \u2014 or tribal knowledge living in one integrator?",
      },
      {
        id: "69ebb63dea9de5548eff5e3a",
        title: "What AI or automation outputs exist today?",
        description: "Who can audit prompts, inputs, and lineage \u2014 and who is accountable when outputs hit investor or lender reporting?",
      },
      {
        id: "69ebb63dea9de5548eff5e3b",
        title: "At refi, sale, or promote \u2014 what transfers?",
        description: "The building shell only \u2014 or the operating intelligence, export rights, and governance package that protects basis?",
      },
    ],
  },
  {
    type: "botCallout",
    id: "69ebb63dea9de5548eff5e40",
    layerLabel: "Layer 1",
    eyebrow: "The Foundation",
    heading: "Owner-Controlled Data & Digital Infrastructure",
    botCalloutInnerHtml: BOT_CALLOUT_HTML,
    botDescriptionPlain:
      "Delivered through BoT® (Building of Things®). A single, secure, segmented foundation engineered under SIC® — Security, Infrastructure, and Connectivity — owned by the sponsor, operable under governance, portable at exit.",
    pillars: [
      {
        id: "69ebb63dea9de5548eff5e3d",
        title: "Documented",
        description: "Every system, credential, and integration mapped to an owner standard.",
      },
      {
        id: "69ebb63dea9de5548eff5e3e",
        title: "Traceable",
        description: "Governance events and access patterns evidence-ready for your diligence narrative.",
      },
      {
        id: "69ebb63dea9de5548eff5e3f",
        title: "Portable",
        description: "Survives vendor swaps, operator changes, and sponsor transitions without resetting intelligence.",
      },
    ],
  },
  {
    type: "brainBlock",
    id: "69ebb63dea9de5548eff5e44",
    layerLabel: "Layer 2",
    eyebrow: "The Intelligence",
    heading: "Property Brain\u2122 \u2192 Portfolio Brain\u2122",
    tagline: "Portable intelligence assets. Not rented software.",
    flowLine: "Underwrite the intelligence layer \u2014 not just the building.",
    bodyHtml: BRAIN_BODY_HTML,
    bodyJson: [
      {
        id: "69ebb63dea9de5548eff5e41",
        text: "Property Brain\u2122 is a governed data plane + trust plane. Every output is auditable. Every decision is permissioned.",
      },
      {
        id: "69ebb63dea9de5548eff5e42",
        text: "Portfolio Brain\u2122 is the compounding layer \u2014 intelligence that survives each building and improves the whole portfolio over time.",
      },
      {
        id: "69ebb63dea9de5548eff5e43",
        text: "At refinance, at sale, at partner exit \u2014 governed operating intelligence transfers with the asset when the sponsor owns the substrate.",
      },
    ],
  },
  {
    type: "pullQuote",
    id: "lp-diligence-wedge",
    style: "nearwhite",
    eyebrow: "The Diligence Wedge",
    quote: "Make this review part of your diligence process. You don\u2019t know what you don\u2019t know.",
    attribution: "OpticWise Talk Track",
  },
  {
    type: "avoidFailure",
    id: "69ebb63dea9de5548eff5e48",
    eyebrow: "Patterns That Destroy Basis",
    heading: "What We See When the Substrate Is Vendor-Held",
    lede: "These are recurring patterns across portfolios \u2014 not one-off anecdotes.",
    punchLine: "Governance debt comes due with interest \u2014 often at exit.",
    consequences: [
      {
        id: "69ebb63dea9de5548eff5e45",
        text: "The incumbent walks; admin credentials and normalized history walk with them \u2014 the next operator starts cold.",
      },
      {
        id: "69ebb63dea9de5548eff5e46",
        text: "Narratives in the sponsor deck cannot be reproduced under investor-side documentation standards.",
      },
      {
        id: "69ebb63dea9de5548eff5e47",
        text: "Portfolio comparability that compounded during the hold evaporates at sale because exports were never contractually real.",
      },
      {
        id: "lp-risk-diligence",
        text: "Counterparty diligence surfaces OT or data-lineage gaps that land in IC memos, not just operator backlogs.",
      },
      {
        id: "lp-risk-nm006",
        text: "Recoverable NOI shows up in the buyer\u2019s process and becomes a price or structure conversation the sponsor did not model.",
      },
    ],
  },
  {
    type: "pullQuote",
    id: "reframe-banner-for-lps-and-financiers",
    style: "dark",
    eyebrow: "",
    quote: "If you don\u2019t own your data & digital infrastructure, your vendors do.",
    attribution: "",
  },
  {
    type: "callToAction",
    id: "69ebb63dea9de5548eff5e49",
    style: "blue",
    eyebrow: "Your Next Step",
    heading: "Get the Diligence Frame",
    subheading:
      "We work with LPs, GPs, and lenders on pre-investment diligence and post-close operational reviews of CRE data & digital infrastructure \u2014 mapped, scoped, and evidence-ready.",
    buttonLabel: "Schedule a Conversation",
    bulletPoints: [
      { id: "lp-cta-1", text: "A sponsor-side map of who holds credentials, exports, and governance for building OT" },
      { id: "lp-cta-2", text: "Gap analysis against the six capital-allocator questions \u2014 in plain English" },
      { id: "lp-cta-3", text: "What transfers at refi, sale, or partner exit \u2014 and what resets if the posture does not change" },
      { id: "lp-cta-4", text: "A practical path to owner-controlled Layer 1 (BoT\u00ae / SIC\u00ae) and Layer 2 (Property Brain\u2122 \u2192 Portfolio Brain\u2122)" },
    ],
  },
];

function emitHtml() {
  return `<div class="ow-v4">${BLOCKS.map((b) => renderers[b.type](b)).join("")}</div>`;
}

function emitJsonLayout() {
  return `\\"layout\\":[${BLOCKS.map((b) => jsonRenderers[b.type](b)).join(",")}]`;
}

function detectHtmlTail(html) {
  const a = "<!--$?--><template id=\"B:1\"></template><!--/$--></main>";
  const b = "<!--$--><!--/$--></main>";
  if (html.includes(a)) return a;
  if (html.includes(b)) return b;
  throw new Error("Could not detect HTML tail after ow-v4");
}

const file = readFileSync(PAGE_PATH, "utf8");
const HTML_OPEN = '<div class="ow-v4">';
const HTML_TAIL = detectHtmlTail(file);
const jsonStart = file.indexOf('\\"layout\\":[');
const jsonEnd = file.indexOf('],\\"updatedAt\\"', jsonStart);
if (jsonStart < 0 || jsonEnd < 0) throw new Error("JSON layout not found");

const newHtml = emitHtml();
const newJson = emitJsonLayout();

let updated = file.slice(0, jsonStart) + newJson + file.slice(jsonEnd + 1);
const hs = updated.indexOf(HTML_OPEN);
const he = updated.indexOf(HTML_TAIL);
if (hs < 0 || he < 0) throw new Error("HTML bounds lost after JSON replace");
updated = updated.slice(0, hs) + newHtml + updated.slice(he);

writeFileSync(PAGE_PATH, updated, "utf8");
console.log("Rewrote for-lps-and-financiers blocks:", BLOCKS.length);
