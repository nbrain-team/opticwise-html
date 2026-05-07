#!/usr/bin/env node
// Rebuild /for-it-executives — IT/OT gap + Right Butt Wrong Seat + OT governance (Coordinate/Control).

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PAGE_PATH = join(ROOT, "for-it-executives/index.html");

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
  }
};

const BLOCKS = [
  {
    type: "hero",
    id: "69f138acebc16d4deb9a3688",
    style: "dark",
    eyebrow: "For IT Executives",
    heading: "The IT/OT Gap Lands on Your Desk. We Operate the Layer Beneath It.",
    lede: "In commercial real estate, OT fell between org-chart boxes. Enterprise IT was never chartered to own segmented building networks. Property teams kept the lights on while vendors held the admin keys. OpticWise closes the gap with an owner-standard data & digital infrastructure layer \u2014 under your governance, without pretending your team suddenly picks up a new career.",
    reframeLine: "If you don\u2019t own your building\u2019s OT, your vendors do \u2014 and you\u2019ll get the findings.",
    audienceLine: "For CIOs, IT directors and managers, security leads, and digital strategy owners at CRE organizations.",
    primaryCtaLabel: "Schedule Your Review",
    secondaryCtaLabel: "See BoT\u00ae \u2014 the foundation layer",
    secondaryCtaHref: "../bot-building-of-things/index.html",
  },
  {
    type: "twoColumn",
    id: "69f13906ebc16d4deb9a3689",
    style: "light",
    eyebrow: "The Honest Frame",
    heading: "IT/OT Was Never Architected. It Was Inherited.",
    subheading: "In most CRE-owning organizations, nobody actually owns operational technology. The org chart shows IT covers corporate networks. Building tech is \"facilities\" or \"vendor-managed.\" Then comes the review. Or the breach. Or the AI initiative. Suddenly IT owns the outcome.",
    authorityNote:
      "Building automation, HVAC controls, access, elevators, IoT, metering, tenant connectivity, EV infrastructure \u2014 they all ride on networks and they all generate data. Few were designed with IT review evidence in mind. The pattern we see: shadow paths installed by vendors, break-glass credentials nobody internal holds, flat OT without segmentation, monitoring, documentation, or a single owner thread when something breaks. That is not your team failing a certification. It is decades of buying buildings like the network is someone else\u2019s product.",
  },
  {
    type: "twoColumn",
    id: "it-right-seat-collins",
    style: "nearwhite",
    eyebrow: "The Org-Chart Reality",
    heading: "Right People. Wrong Seat. (Jim Collins, Good to Great)",
    subheading:
      "Right person, right seat. CRE is doing the opposite: right people, wrong seat. We\u2019re asking property managers, IT managers, and asset managers to run operational technology. They\u2019re capable. They\u2019re not skilled or trained for it.",
    authorityNote:
      "Don\u2019t ask them to staff up overnight. Educate, partner, add a digital specialist. OpticWise is that operator layer for the building stack \u2014 the same PPP 5C\u2122 discipline owners use on the business side, applied to data & digital infrastructure \u2014 so enterprise IT keeps enterprise scope, and OT stops bleeding across your risk register.",
  },
  {
    type: "twoColumn",
    id: "it-ot-governance-coordinate",
    style: "dark",
    eyebrow: "Coordinate and Control",
    heading: "OT Governance Is Identity, Access, and Lineage \u2014 Not Just \u201cMore Firewall.\u201d",
    subheading:
      "This is often a Coordinate-layer failure first: who may touch what, who can export history, where tenant and owner data may go, and what an auditor can replay \u2014 before you even argue model selection.",
    authorityNote:
      "PPP 5C\u2122 runs Clarify \u2192 Connect \u2192 Collect \u2192 Coordinate \u2192 Control. Layer 1 \u2014 managed data & digital infrastructure \u2014 is engineered under SIC\u00ae, Security, Infrastructure, and Connectivity: segmented, documented, ISP-agnostic, first-tier gear. Property Brain\u2122 \u2192 Portfolio Brain\u2122 is the trust plane: vendor- and LLM-agnostic, permissioned outputs, lineage you can evidence. The model is the commodity. The moat is the layer above it. Vendors plug in under your rules; they do not own the governance story.",
  },
  {
    type: "cardGrid",
    id: "69f13950ebc16d4deb9a368a",
    style: "dark",
    columns: "2",
    eyebrow: "What Changes for You",
    heading: "Six Burdens That Stop Cascading to IT Alone",
    subheading: "Different lane than enterprise IT. Same owner standard on the packet captures and credentials sponsors actually need.",
    closingLine: "You stay focused on enterprise identity and corporate risk. We operate the repeatable OT standard property by property.",
    cards: [
      {
        id: "69f1396febc16d4deb9a368b",
        title: "OT Network Governance",
        description:
          "Segmentation, access control, monitoring, and documentation for every building system \u2014 repeatable across the portfolio, evidence-ready.",
      },
      {
        id: "69f1397febc16d4deb9a368c",
        title: "Vendor Compliance",
        description:
          "Vendors connect under your integration rules. No shadow networks, no private admin islands, no undocumented east-west paths in the basement IDF.",
      },
      {
        id: "69f139a4ebc16d4deb9a368d",
        title: "Audit Readiness",
        description:
          "Systems, credentials, and data flows mapped for SOC 2, ISO 27001, carrier, and insurance reviews \u2014 fewer all-nighters assembling screenshots.",
      },
      {
        id: "69f139b2ebc16d4deb9a368e",
        title: "OT Incident Response",
        description:
          "When a building system fails or is compromised, we run the root-cause thread. You get timelines and owner-held logs \u2014 not 2 AM bridge calls between three vendors who each claim \u201cnot my network.\u201d",
      },
      {
        id: "69f139e8ebc16d4deb9a368f",
        title: "AI and Data Governance Foundation",
        description:
          "Property Brain\u2122 is the trust plane that makes AI in CRE defensible: inputs, prompts, and outputs permissioned \u2014 no black-box vendor answers your general counsel cannot trace.",
      },
      {
        id: "69f139feebc16d4deb9a3690",
        title: "Different Lane, Same Standard",
        description:
          "We bring the OT craft your enterprise bench was never scaled to hire for \u2014 partner-operator, not a generic MSP trying to own your LAN.",
      },
    ],
  },
  {
    type: "twoColumn",
    id: "69f13a0debc16d4deb9a3691",
    style: "dark",
    eyebrow: "What OpticWise Is Not",
    heading: "We\u2019re Not Replacing IT. We\u2019re Filling a Gap That\u2019s Been Sitting Open.",
    subheading:
      "OpticWise is not a managed services provider trying to take over your stack. We are a partner-operator focused on the data & digital infrastructure layer of CRE assets.",
    authorityNote:
      "Your enterprise IT remains yours. Your security stack, identity systems, and corporate WAN \u2014 yours. OpticWise sits at the property OT layer and runs it to your governance standard, integrating with enterprise tooling where it makes sense. Same audit language. Different skill set.",
  },
  {
    type: "avoidFailure",
    id: "69f13a39ebc16d4deb9a3692",
    eyebrow: "What\u2019s at Stake",
    heading: "What Happens When the IT/OT Gap Stays Open",
    lede: "These aren\u2019t hypotheticals. These are patterns we see every week.",
    punchLine: "Governance debt comes due with interest \u2014 and IT is usually who pays it.",
    consequences: [
      { id: "69f13a51ebc16d4deb9a3693", text: "The shadow path nobody inventoried becomes a lateral-movement story" },
      { id: "69f13a5bebc16d4deb9a3694", text: "Vendor admin credentials walk out the door with the vendor" },
      { id: "69f13a62ebc16d4deb9a3695", text: "The board asks about AI strategy and the data isn\u2019t governable under your policies" },
      { id: "69f13a69ebc16d4deb9a3696", text: "Insurance renewal flags OT exposure nobody mapped to a control owner" },
      { id: "69f13a70ebc16d4deb9a3697", text: "A tenant service issue becomes an OT rabbit hole with no named owner" },
      { id: "69f13a7cebc16d4deb9a3698", text: "Capital partners run diligence and OT findings hit basis \u2014 with your logo on the response" },
    ],
  },
  {
    type: "pullQuote",
    id: "reframe-banner-for-it-executives",
    style: "dark",
    eyebrow: "",
    quote: "If you don\u2019t own your data & digital infrastructure, your vendors do.",
    attribution: "",
  },
  {
    type: "callToAction",
    id: "69f13a8cebc16d4deb9a3699",
    style: "blue",
    eyebrow: "Your Next Step",
    heading: "Let\u2019s Map Your OT Posture",
    subheading:
      "A complimentary working session with your IT and facilities leadership. One building. We map who owns what, where the Coordinate gaps are, and what closing them looks like under your standards.",
    buttonLabel: "Schedule a Conversation",
    bulletPoints: [
      { id: "69f13ab7ebc16d4deb9a369a", text: "Where OT lives across your properties \u2014 and who actually controls credentials and exports" },
      { id: "69f13ab9ebc16d4deb9a369b", text: "Evidence gaps that would surface in a SOC 2, carrier, or insurance review this quarter" },
      { id: "69f13abbebc16d4deb9a369c", text: "The IT/OT split \u2014 what stays enterprise IT, what OpticWise runs at the property, what stays joint" },
      { id: "69f13abdebc16d4deb9a369d", text: "The first three fixes that close your largest segmentation or lineage holes" },
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
if (hs < 0 || he < 0) throw new Error("HTML bounds lost");
updated = updated.slice(0, hs) + newHtml + updated.slice(he);
writeFileSync(PAGE_PATH, updated, "utf8");
console.log("Rewrote for-it-executives blocks:", BLOCKS.length);
