#!/usr/bin/env node
// Rebuild /for-asset-managers from a structured block tree.
// Emits visible HTML + SSR-hydration JSON layout in lockstep so React doesn't
// reconcile content away on hydration.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PAGE_PATH = join(ROOT, "for-asset-managers/index.html");

// ---------- escaping helpers ----------

// Normalize curly apostrophes to ASCII to match the rest of the site
// (every existing page uses `&#x27;` in HTML and `'` in JSON).
function normalize(s) {
  return String(s).replace(/\u2019/g, "'");
}

// HTML-escape for visible markup (text nodes / attribute values).
function H(s) {
  return normalize(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#x27;")
    .replace(/"/g, "&quot;");
}

// JSON-escape — produces the literal byte sequence used inside a
// `self.__next_f.push([1, "..."])` JS string literal:
//   "  → \"
//   \  → \\
//   &  → \u0026  (Next.js convention; matches what the live site emits)
function J(s) {
  return normalize(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/&/g, "\\u0026");
}

// ---------- block renderers (HTML side) ----------

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
      `<ul class="cta__bullets">${bullets}</ul>` +
      `<button type="button" class="btn btn-light btn-arrow">${H(b.buttonLabel)}</button>` +
      `</div></div></section>`
    );
  },
};

// ---------- block renderers (JSON side) ----------

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
          `{` +
          `\\"id\\":\\"${c.id}\\",` +
          `\\"image\\":null,` +
          `\\"title\\":\\"${J(c.title)}\\",` +
          `\\"description\\":\\"${J(c.description)}\\",` +
          `\\"href\\":null` +
          `}`
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
  pullQuote(b) {
    return (
      `{` +
      `\\"id\\":\\"${b.id}\\",` +
      (b.eyebrow !== undefined ? `\\"eyebrow\\":\\"${J(b.eyebrow)}\\",` : "") +
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
    const bullets = b.bulletPoints
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

// ---------- content tree ----------

// Block IDs: keep existing IDs where the block survives in spirit; mint new
// stable IDs for new blocks (prefixed `am-` + descriptive slug).
const BLOCKS = [
  // 1) Hero — sharper, refi/exit/IRR-forward
  {
    type: "hero",
    id: "69f14864ebc16d4deb9a36a0",
    style: "dark",
    eyebrow: "For Asset Managers",
    heading: "Held Accountable for Numbers Built on Operating Data You Can\u2019t See.",
    lede: "Acquisitions modeled the IRR. Property managers run the building. You run the investment \u2014 and you\u2019re the one who has to defend NOI, refi DSCR, insurance renewal, and exit basis on numbers you can\u2019t fully see.",
    reframeLine: "If you only look at NOI, you\u2019re looking at the result \u2014 not the cause.",
    audienceLine: "For asset managers at medium-to-large CRE firms. Numbers people. Held accountable for outcomes built on operating data trapped in vendor silos.",
    primaryCtaLabel: "Schedule a Working Session",
    secondaryCtaLabel: "Read the NOI Strategy",
    secondaryCtaHref: "../digital-infrastructure-noi-strategy/index.html",
  },

  // 2) The Honest Frame — name-checks NM-005 Massaged Report
  {
    type: "twoColumn",
    id: "69f14892ebc16d4deb9a36a1",
    style: "light",
    eyebrow: "The Honest Frame",
    heading: "You Get the Report You Asked For. Not the Report That Tells You Why.",
    subheading: "Property staff send the home office reports tuned to the KPIs the home office asks for. Numbers don\u2019t get manipulated \u2014 context just gets left out. You get exactly what you asked for. But you don\u2019t know what to ask for, because you can\u2019t see the operating data behind the property.",
    authorityNote: "We call this the Massaged Report. Operating data sits in vendor platforms at the property level and never reaches the home office in any usable form. You\u2019re making decisions on lagging summaries instead of leading drivers. Utilities, insurance, occupancy \u2014 the three plays that move the most NOI \u2014 get pulled blindly because the data to play them lives in systems you can\u2019t reach. That\u2019s not a reporting problem. It\u2019s a data-ownership problem.",
  },

  // 3) Skybox Principle — NEW pull-quote (canon §10 talk track)
  {
    type: "pullQuote",
    id: "am-skybox-principle",
    style: "nearwhite",
    eyebrow: "The Skybox Principle",
    quote: "Don\u2019t manage a 50-asset portfolio from the field. Build the owner-controlled intelligence layer so you can operate from the skybox \u2014 seeing causes, not just results.",
    attribution: "OpticWise Quote Bank",
  },

  // 4) Big Three Plays — kept structure, slightly tightened cards
  {
    type: "cardGrid",
    id: "69f148b7ebc16d4deb9a36a2",
    style: "dark",
    columns: "3",
    eyebrow: "The Big Three Plays",
    heading: "Three Plays Move Most of the NOI in CRE.",
    subheading: "Utilities. Insurance. Occupancy. The PPP book names these as the three areas with the biggest impact on the bottom line. You\u2019re accountable for outcomes in all three. Most asset managers run all three with incomplete operating data \u2014 because the data lives in vendor platforms they can\u2019t reach.",
    closingLine: "The data to play these is already being generated in your buildings. The question is whether you own it or your vendors do.",
    cards: [
      {
        id: "69f148d7ebc16d4deb9a36a3",
        title: "Utilities \u2014 The Offensive Line",
        description:
          "Demand management, consumption visibility, accurate tenant allocation. HVAC peak-demand timing. Sub-metering by actual tenant use. Activating lighting control systems already installed and never turned on. Plays you can run in 90 days, with savings on the next utility bill.",
      },
      {
        id: "69f148daebc16d4deb9a36a4",
        title: "Insurance \u2014 The Defensive Line",
        description:
          "Premium reduction at renewal. Lower deductibles. Better claims documentation. Most owners walk into renewal with no data package because the data sits in vendor silos. Underwriters respond to documentation. Show them response-protocol logs and claims-history narratives \u2014 your data, not theirs \u2014 and the conversation changes.",
      },
      {
        id: "69f148ddebc16d4deb9a36a5",
        title: "Occupancy \u2014 The Special Teams",
        description:
          "Space utilization revenue. Dynamic pricing. Tenant retention. Lease-up velocity. Amenity-usage patterns. Pre-move-out signals that predict tenant churn before notice gets given. Retention is cheaper than acquisition \u2014 when you can see it coming.",
      },
    ],
  },

  // 5) The Honest Read — Quote Bank line, slightly extended
  {
    type: "pullQuote",
    id: "69f1493cebc16d4deb9a36a6",
    style: "dark",
    eyebrow: "The Honest Read",
    quote: "Asset managers are financial quants. They can run forecasts. They don\u2019t always know the operating levers driving the numbers \u2014 until they get access to them.",
    attribution: "OpticWise Quote Bank",
  },

  // 6) The Diligence Story — canonical NM-006 framing
  {
    type: "twoColumn",
    id: "69f14980ebc16d4deb9a36a7",
    style: "dark",
    eyebrow: "Why It Matters Now, Not Someday",
    heading: "Price = NOI \u00D7 Cap Rate. Diligence Doesn\u2019t Wait.",
    subheading: "When a property trades, the buyer\u2019s diligence team runs their own analysis. If they find recoverable NOI you weren\u2019t capturing during the hold, that gap doesn\u2019t stay on the table. It becomes a price-negotiation lever. You take the hit at close.",
    authorityNote: "You don\u2019t just lose the income you could have captured during the hold. You lose the capitalized value of that income at exit. Same building. Same systems. Same data. Different access, different rigor \u2014 and the buyer\u2019s team finds the value that should have been yours. For a 300-unit multifamily asset in the canonical benchmark range \u2014 $500\u2013$600 per door per year \u2014 that\u2019s $150,000 to $180,000 in annual NOI. Capitalize that at a market cap rate and the diligence discount becomes several million dollars in lost asset value at exit. Operationalize early. Capture the income while you hold. Don\u2019t hand the next owner a value-add that should have been yours.",
  },

  // 7) Cap-rate leverage line — NEW (canon §9.3)
  {
    type: "pullQuote",
    id: "am-cap-rate-leverage",
    style: "light",
    eyebrow: "The Capitalized-Value Math",
    quote: "Every dollar of recoverable NOI is worth roughly fifteen to twenty-five dollars of asset value at typical cap rates.",
    attribution: "Peak Property Performance\u00AE \u00B7 Fast Company Press",
  },

  // 8) Refi & Investor-Letter Story — NEW
  {
    type: "twoColumn",
    id: "am-refi-investor-letter",
    style: "nearwhite",
    eyebrow: "Capital-Markets Reality",
    heading: "Refi, Renewals, and Investor Letters Don\u2019t Care That the Data\u2019s Trapped.",
    subheading: "DSCR ratios. Insurance renewals. Property-tax appeals. Expense-trajectory narratives. The conversations you have to defend up the chain all rest on operating data you can\u2019t see when it lives in vendor platforms.",
    authorityNote: "Quarterly investor letters need the why behind the variance, not just the variance. Refi conversations turn on a defensible expense trajectory. Property-tax appeals require documentation the assessor will respect. Insurance renewals reward owners who walk in with claims-history narratives and response-protocol logs. None of that comes out of an accounting system. All of it comes out of operating data. You can\u2019t defend a number you can\u2019t see.",
  },

  // 9) Six Things AMs Get — sharpened AM-coded copy
  {
    type: "cardGrid",
    id: "69f149a8ebc16d4deb9a36a8",
    style: "light",
    columns: "2",
    eyebrow: "What Changes for You",
    heading: "Six Things That Show Up in Your Numbers.",
    subheading: "Not features. Outcomes \u2014 visible in the metrics asset managers are actually accountable for.",
    closingLine: "None of this requires a data-science team. It requires access to operating data you can already see \u2014 once it\u2019s yours.",
    cards: [
      {
        id: "69f149c2ebc16d4deb9a36a9",
        title: "Operating Data, Not Just Financial Data",
        description:
          "Utilities variance, equipment-failure patterns, ticket velocity, water-risk exposure \u2014 the causes behind the numbers you report up. You stop forecasting from lagging summaries.",
      },
      {
        id: "69f149c3ebc16d4deb9a36aa",
        title: "Portfolio Benchmarking That Actually Compares",
        description:
          "Stop comparing NOI per door across assets. Start comparing the causal drivers. Why is Building A\u2019s HVAC OpEx 18% higher than Building B\u2019s? Now you can answer.",
      },
      {
        id: "69f149c8ebc16d4deb9a36ab",
        title: "CapEx Planning With Defensible Inputs",
        description:
          "Predictive maintenance, equipment-failure patterns, vendor-performance variance. CapEx decisions stop being reactive and start being patterned \u2014 and IRR-defensible.",
      },
      {
        id: "69f149cbebc16d4deb9a36ac",
        title: "Negotiating Power You Didn\u2019t Have",
        description:
          "When you own the data, vendors compete to serve you instead of trapping you. Switching vendors stops being a multi-year reimplementation. Lock-in becomes negotiable.",
      },
      {
        id: "69f14a02ebc16d4deb9a36ad",
        title: "A Renewal Story for Insurance",
        description:
          "Walk into renewal with documentation underwriters actually respond to: response-protocol logs, claims-history narratives, alarm-escalation timing. Premium reductions follow documentation.",
      },
      {
        id: "69f14a10ebc16d4deb9a36ae",
        title: "A Diligence Story for Exit",
        description:
          "When the asset trades, the recoverable NOI is already in your numbers \u2014 not in the buyer\u2019s diligence findings. You captured the value while you held it instead of leaving it on the table at close.",
      },
    ],
  },

  // 10) Two-Layer Model snapshot — NEW (cardGrid 2-col so each layer gets its own card)
  {
    type: "cardGrid",
    id: "am-two-layer-model",
    style: "dark",
    columns: "2",
    eyebrow: "How OpticWise Operates",
    heading: "Two Layers. One Owner Standard.",
    subheading: "We don\u2019t sell another dashboard. We deliver the layers underneath the dashboards \u2014 the foundation your operating data has to come out of, and the governed substrate your decision engines run on top of.",
    closingLine: "The model is the commodity. The moat is the layer above it.",
    cards: [
      {
        id: "am-layer-1",
        title: "Layer 1 \u2014 Managed Data & Digital Infrastructure (BoT\u00AE)",
        description:
          "Owner-controlled connectivity, segmentation, and OT governance. Engineered under SIC\u00AE \u2014 Security, Infrastructure, and Connectivity. First-tier equipment only \u2014 no white-label gear. Vendor- and ISP-agnostic by design. The foundation your operating data has to come out of.",
      },
      {
        id: "am-layer-2",
        title: "Layer 2 \u2014 Owner-Controlled Intelligence (Property Brain\u2122 \u2192 Portfolio Brain\u2122)",
        description:
          "A vendor- and LLM-agnostic governed data plane and trust plane. Plug in any vendor, any model, any decision engine \u2014 under your permissions, on your standard. Standardize once at one property; scale across the portfolio without rewiring.",
      },
    ],
  },

  // 11) What Stays at Risk — refi bullet added, sharper closer
  {
    type: "avoidFailure",
    id: "69f14a6aebc16d4deb9a36af",
    eyebrow: "What\u2019s at Stake",
    heading: "What Stays at Risk Without Operating-Data Access",
    lede: "These aren\u2019t hypotheticals. These are patterns we see across portfolios every quarter.",
    punchLine: "You cannot optimize what you cannot see. And you cannot defend what you cannot prove.",
    consequences: [
      { id: "69f14a7febc16d4deb9a36b0", text: "You report NOI accurately and never see why it\u2019s drifting" },
      { id: "69f14a88ebc16d4deb9a36b1", text: "Utility variance gets blamed on weather instead of analyzed for root cause" },
      { id: "69f14a8febc16d4deb9a36b2", text: "Insurance renewals come in 8\u201312% higher than peer assets because you have no data package" },
      { id: "69f14a95ebc16d4deb9a36b3", text: "CapEx decisions get made on emergencies instead of patterns" },
      { id: "69f14a9aebc16d4deb9a36b4", text: "Tenants give notice before you see the pre-move-out signals" },
      { id: "am-risk-refi", text: "Refi conversations turn on an expense trajectory you can\u2019t fully defend" },
      { id: "69f14aa0ebc16d4deb9a36b5", text: "The buyer\u2019s diligence team finds value the seller\u2019s team couldn\u2019t see \u2014 and the price reflects it" },
    ],
  },

  // 12) Canonical reframe pull-quote — preserved from Phase 3A insertion
  {
    type: "pullQuote",
    id: "reframe-banner-for-asset-managers",
    style: "dark",
    eyebrow: "",
    quote: "If you don\u2019t own your data & digital infrastructure, your vendors do.",
    attribution: "",
  },

  // 13) CTA — copy polish only
  {
    type: "callToAction",
    id: "69f14ab4ebc16d4deb9a36b6",
    style: "blue",
    eyebrow: "Your Next Step",
    heading: "Run the Big Three Plays Diagnostic on One Asset.",
    subheading: "A complimentary working session with your asset-management team. One building. We map utilities, insurance, and occupancy against the operating data you actually have access to \u2014 and the operating data you don\u2019t. Then we tell you which play has the biggest accountability-to-visibility gap, and what closing it would do for your numbers.",
    buttonLabel: "Schedule a Working Session",
    bulletPoints: [
      { id: "69f14acfebc16d4deb9a36b7", text: "Where your operating data lives \u2014 and which vendor platforms hold it" },
      { id: "69f14ad2ebc16d4deb9a36b8", text: "Which of the Big Three Plays has the biggest gap between what you\u2019re accountable for and what you can see" },
      { id: "69f14ad8ebc16d4deb9a36b9", text: "A scoped 90-day pilot focused on the highest-impact play" },
      { id: "69f14adeebc16d4deb9a36ba", text: "A defensible NOI uplift estimate grounded in benchmarks \u2014 $500\u2013$600 per door per year for multifamily, $0.60\u2013$0.90 per RSF per year for multi-tenant office" },
    ],
  },
];

// ---------- emit ----------

function emitHtml() {
  const sections = BLOCKS.map((b) => renderers[b.type](b)).join("");
  return `<div class="ow-v4">${sections}</div>`;
}

function emitJsonLayout() {
  const blocks = BLOCKS.map((b) => jsonRenderers[b.type](b)).join(",");
  return `\\"layout\\":[${blocks}]`;
}

// ---------- file surgery ----------

const file = readFileSync(PAGE_PATH, "utf8");

// HTML wrapper bounds (visible content). HTML_TAIL_AFTER_DIV starts AFTER the
// closing `</div>` of the ow-v4 wrapper, so our replacement (which already
// ends with `</div>`) doesn't double it.
const HTML_OPEN = '<div class="ow-v4">';
const HTML_TAIL_AFTER_DIV = '<!--$--><!--/$--></main>';
const htmlStart = file.indexOf(HTML_OPEN);
const htmlEnd = file.indexOf(HTML_TAIL_AFTER_DIV);
if (htmlStart < 0 || htmlEnd < 0) {
  throw new Error("Could not locate visible HTML wrapper boundaries");
}

// JSON layout bounds (inside __next_f.push)
const JSON_KEY = '\\"layout\\":[';
const JSON_END_MARKER = '],\\"updatedAt\\"';
const jsonStart = file.indexOf(JSON_KEY);
const jsonEnd = file.indexOf(JSON_END_MARKER, jsonStart);
if (jsonStart < 0 || jsonEnd < 0) {
  throw new Error("Could not locate JSON layout boundaries");
}

// Apply both replacements. JSON range is later in file than HTML range,
// so do JSON first (or both via concatenation).
const newHtml = emitHtml();
const newJson = emitJsonLayout();

// Replace JSON block first (later in file) using simple string concatenation,
// then replace HTML.
let updated =
  file.slice(0, jsonStart) +
  newJson +
  file.slice(jsonEnd + 1); // +1 to drop the closing `]` we matched

// Safety: also strip the original closing bracket of the layout array
// (the JSON_END_MARKER starts with `]`, so jsonEnd points at the `]`).
// We replaced everything up to and including that `]`, so the result lands
// right at `,\"updatedAt\"`.

// Now replace HTML in the updated string.
const updatedHtmlStart = updated.indexOf(HTML_OPEN);
const updatedHtmlEnd = updated.indexOf(HTML_TAIL_AFTER_DIV);
updated =
  updated.slice(0, updatedHtmlStart) +
  newHtml +
  updated.slice(updatedHtmlEnd);

writeFileSync(PAGE_PATH, updated, "utf8");

console.log("Rewrote /for-asset-managers");
console.log("  blocks:", BLOCKS.length);
console.log("  HTML bytes:", newHtml.length);
console.log("  JSON layout bytes:", newJson.length);
console.log("  total file delta:", updated.length - file.length);
