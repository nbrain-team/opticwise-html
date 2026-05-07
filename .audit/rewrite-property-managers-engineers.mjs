#!/usr/bin/env node
// Rebuild /for-property-managers-and-engineers — PM/engineer dialect, PPP 5C™ / ownership read-through, visible HTML + flight layout in lockstep.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PAGE_PATH = join(ROOT, "for-property-managers-and-engineers/index.html");

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
  fiveStandard(b) {
    const items = b.standards
      .map(
        (s, idx) =>
          `<div class="five-s__item">` +
          `<div class="five-s__num">0<!-- -->${idx + 1}</div>` +
          `<h4 class="five-s__title">${H(s.title)}</h4>` +
          `<p class="five-s__desc">${H(s.description)}</p>` +
          `</div>`
      )
      .join("");
    return (
      `<section class="five-s"><div class="container">` +
      `<span class="eyebrow">${H(b.eyebrow)}</span>` +
      `<div class="accent-line"></div>` +
      `<h2 class="h2">${H(b.heading)}</h2>` +
      (b.tagline ? `<p class="lede" style="margin-top:1rem;max-width:60ch">${H(b.tagline)}</p>` : "") +
      `<div class="five-s__grid">${items}</div>` +
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
  fiveStandard(b) {
    const stds = b.standards
      .map(
        (s) =>
          `{\\"id\\":\\"${s.id}\\",\\"title\\":\\"${J(s.title)}\\",\\"description\\":\\"${J(s.description)}\\"}`
      )
      .join(",");
    return (
      `{` +
      `\\"id\\":\\"${b.id}\\",` +
      `\\"eyebrow\\":\\"${J(b.eyebrow)}\\",` +
      `\\"heading\\":\\"${J(b.heading)}\\",` +
      `\\"tagline\\":\\"${J(b.tagline)}\\",` +
      `\\"blockName\\":null,` +
      `\\"standards\\":[${stds}],` +
      `\\"blockType\\":\\"fiveStandard\\"` +
      `}`
    );
  },
  pullQuote(b) {
    return (
      `{` +
      `\\"id\\":\\"${b.id}\\",` +
      (b.eyebrow !== undefined && b.eyebrow !== "" ? `\\"eyebrow\\":\\"${J(b.eyebrow)}\\",` : `\\"eyebrow\\":\\"\\",`) +
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

const BLOCKS = [
  {
    type: "hero",
    id: "69ebb640ea9de5548eff5e4a",
    style: "dark",
    eyebrow: "For PMs \u0026 Engineers",
    heading: "You Run the Building. We Run the Owner Standard on Data \u0026 Digital Infrastructure.",
    lede: "Your week is work orders, callbacks, rounds, and tenant touchpoints \u2014 not stitching together OT, Wi\u2011Fi, and vendor admin stories. OpticWise takes the data \u0026 digital infrastructure thread that landed on your radio without a charter: documented paths, owner-held credentials where they belong, and root\u2011cause discipline when the ticket stack goes noisy.",
    reframeLine: "If you don\u2019t own your data \u0026 digital infrastructure, your vendors do.",
    audienceLine:
      "For property managers, chief engineers, stationary engineers, and on\u2011site ops leads who feel the gap first when something in the riser misbehaves.",
    primaryCtaLabel: "Schedule Your Review",
    secondaryCtaLabel: "How PPP 5C\u2122 reads for owners",
    secondaryCtaHref: "../how-we-operate/index.html",
  },
  {
    type: "twoColumn",
    id: "69ebb640ea9de5548eff5e4b",
    style: "nearwhite",
    eyebrow: "The Honest Frame",
    heading: "Not a Skills Lecture \u2014 a Scope Fix",
    subheading:
      "You already know how to run property: setpoints, vendor coordination, tenant service, life\u2011safety posture, and the political lift when uptime slips. What keeps showing up is the digital layer \u2014 BAS alarms that need a vendor login nobody internal truly owns, tenant Wi\u2011Fi complaints that are not really \u201cin the suite,\u201d IDF doors propped during a truck roll, integration work orders that bounce because the stack was never engineered as one owner thread.",
    authorityNote:
      "On the ownership side, Peak Property Performance\u00ae runs through PPP 5C\u2122 \u2014 Clarify \u2192 Connect \u2192 Collect \u2192 Coordinate \u2192 Control \u2014 the discipline asset managers use so capital, risk, and operations stay on one evidence line. Buildings drifted for years without that same clarity at the data \u0026 digital infrastructure layer; vendors filled the vacuum. OpticWise partners with your owner and enterprise IT as the operator at Layer 1 (BoT\u00ae \u2014 Building of Things\u00ae): you keep running the asset day to day; we align what is in the walls with the owner standard your sponsor is accountable for \u2014 including what shows up when IT or the asset team runs a review.",
  },
  {
    type: "cardGrid",
    id: "69ebb640ea9de5548eff5e52",
    style: "dark",
    columns: "2",
    eyebrow: "What Changes for You",
    heading: "What Should Get Quieter in Your Ear",
    subheading:
      "Same shop language \u2014 tickets, vendors, turnovers \u2014 with governance, carriage, and evidence handled on the owner thread your asset team can defend.",
    closingLine:
      "We are not here to replace property leadership. We are here to keep digital noise from eating the leadership bandwidth you already do not have.",
    cards: [
      {
        id: "69ebb640ea9de5548eff5e4c",
        title: "Root\u2011cause bridge calls",
        description:
          "When the outage is really vendor\u2011versus\u2011vendor, we own the thread. You get a named path and timestamps \u2014 not three voicemails asking you to referee scope on zero sleep.",
      },
      {
        id: "69ebb640ea9de5548eff5e4d",
        title: "BAS / OT admin and credentials",
        description:
          "Break\u2011glass and service accounts are operated under owner governance \u2014 rotated, documented, not living in a personal notebook on the console.",
      },
      {
        id: "69ebb640ea9de5548eff5e4e",
        title: "Tenant experience carriage",
        description:
          "Wi\u2011Fi and connectivity issues route to a team that can read path, tenancy, and 5S\u00ae carriage \u2014 measured like a service line, not a shrug at the front desk.",
      },
      {
        id: "69ebb640ea9de5548eff5e4f",
        title: "After\u2011hours triage",
        description:
          "When the 2:00 a.m. page is packet\u2011path or integration\u2011plane \u2014 not the chiller itself \u2014 we pick up the operational thread so engineering can stay on equipment truth.",
      },
      {
        id: "69ebb640ea9de5548eff5e50",
        title: "Vendor on\u2011boarding to the owner ruleset",
        description:
          "New controls, access, IoT, or carrier installs plug into the owner integration pattern \u2014 fewer \u201cone\u2011off\u201d punches that age into mystery spans in the ceiling.",
      },
      {
        id: "691eb640ea9de5548eff5e51",
        title: "Documentation that survives turnover",
        description:
          "As\u2011builts, exports, and log access that match how owners and IT actually ask questions \u2014 not a PDF graveyard that only made sense the week of commissioning.",
      },
    ],
  },
  {
    type: "fiveStandard",
    id: "69ebb640ea9de5548eff5e58",
    eyebrow: "The Standard We Hold",
    heading: "5S\u00ae \u2014 What Tenants Feel On Your Network",
    tagline:
      "Peak Property Performance\u00ae is the owner frame; 5S\u00ae is the tenant\u2011facing user experience we hold every deployment to \u2014 so your front line is not guessing if the building meets promise.",
    standards: [
      {
        id: "69ebb640ea9de5548eff5e53",
        title: "Seamless Mobility",
        description: "One consistent network identity and roam behavior \u2014 so mobility stops being a daily fire drill at the lobby.",
      },
      {
        id: "69ebb640ea9de5548eff5e54",
        title: "Security",
        description: "Segmented, authenticated, monitored paths \u2014 fewer \u201cit worked yesterday\u201d surprises after a vendor laptop hits the wrong VLAN.",
      },
      {
        id: "69ebb640ea9de5548eff5e55",
        title: "Stability",
        description: "Failure domains stay bounded; redundancy and change control read like engineering \u2014 not superstition.",
      },
      {
        id: "69ebb640ea9de5548eff5e56",
        title: "Speed",
        description: "Throughput and latency that match lease language and tenant class \u2014 measured, not debated in the hallway.",
      },
      {
        id: "69ebb640ea9de5548eff5e57",
        title: "Service",
        description: "Known runbooks, named contacts, accountable follow\u2011through \u2014 the opposite of endless ticket ping\u2011pong.",
      },
    ],
  },
  {
    type: "avoidFailure",
    id: "69ebb640ea9de5548eff5e5e",
    eyebrow: "When Layer 1 Stays Fuzzy",
    heading: "The Patterns You Are Already Tired Of",
    lede: "A common pattern we see when nobody truly owns the data \u0026 digital infrastructure layer:",
    punchLine: "Different skill set. Different lane. Same PPP 5C\u2122 owner thread \u2014 we are beside your shop, not in your chair.",
    consequences: [
      {
        id: "69ebb640ea9de5548eff5e59",
        text: "Work orders that close without a root cause because every vendor swears it is the other vendor\u2019s VLAN",
      },
      {
        id: "69ebb640ea9de5548eff5e5a",
        text: "\u201cWorks on my laptop\u201d arguments with tenants while the actual issue is path, DNS, or carriage \u2014 not their NIC",
      },
      {
        id: "69ebb640ea9de5548eff5e5b",
        text: "Controls upgrades that ship with factory defaults still live because nobody named the OT change window with IT cover",
      },
      {
        id: "69ebb640ea9de5548eff5e5c",
        text: "Late\u2011night pages for \u201cnetwork down\u201d that trace to integration debt the asset plan never priced",
      },
      {
        id: "69ebb640ea9de5548eff5e5d",
        text: "New vendor punch lists that quietly retire last year\u2019s documentation \u2014 the next team inherits fiction",
      },
    ],
  },
  {
    type: "pullQuote",
    id: "reframe-banner-for-property-managers-and-engineers",
    style: "dark",
    eyebrow: "",
    quote: "If you don\u2019t own your data \u0026 digital infrastructure, your vendors do.",
    attribution: "",
  },
  {
    type: "callToAction",
    id: "69ebb640ea9de5548eff5e5f",
    style: "blue",
    eyebrow: "Your Next Step",
    heading: "Walk It With Someone Who Speaks Riser \u2014 and Owner",
    subheading:
      "If your sponsor is moving toward an OpticWise review, ask for the session that translates PPP 5C\u2122 into what changes on your console, your radio, and your vendor list \u2014 honest scope, no replacement theater.",
    buttonLabel: "Schedule a Conversation",
    bulletPoints: [
      {
        id: "69ebb640ea9de5548eff5e60",
        text: "What stays in property / engineering scope versus what lifts to the operator layer under owner governance",
      },
      {
        id: "69ebb640ea9de5548eff5e61",
        text: "How turnkey and tenant\u2011facing issues get carriage under 5S\u00ae so your team is not the accidental NOC",
      },
      {
        id: "69ebb640ea9de5548eff5e62",
        text: "What documentation and credential posture looks like when the asset manager needs to answer IT or capital in one thread",
      },
      {
        id: "69ebb640ea9de5548eff5e63",
        text: "Where BoT\u00ae (Building of Things\u00ae) and Property Brain\u2122 \u2192 Portfolio Brain\u2122 fit without turning you into the integrator",
      },
    ],
  },
];

const NEW_META_DESCRIPTION =
  "For property managers and building engineers: OpticWise runs the owner standard on data & digital infrastructure \u2014 PPP 5C\u2122 alignment, 5S\u00ae carriage, and partner\u2011operator cover so your shop is not the accidental NOC.";
const OLD_META_DESC_SNIPPET =
  "OpticWise takes the data &amp; digital infrastructure burden off your on-site team — without replacing you. Operational coverage with owner control.";
const NEW_EXCERPT =
  "Partner\u2011operator cover for PMs and engineers \u2014 PPP 5C\u2122 on the ownership thread, 5S\u00ae tenant experience discipline, and a clear lane for data & digital infrastructure without replacing on\u2011site leadership.";

function emitHtml() {
  return `<div class="ow-v4">${BLOCKS.map((b) => renderers[b.type](b)).join("")}</div>`;
}

function emitJsonLayout() {
  return `\\"layout\\":[${BLOCKS.map((b) => jsonRenderers[b.type](b)).join(",")}]`;
}

function detectHtmlTail(html) {
  const a = '<!--$?--><template id="B:1"></template><!--/$--></main>';
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

let updated = file.slice(0, jsonStart) + emitJsonLayout() + file.slice(jsonEnd + 1);
const hs = updated.indexOf(HTML_OPEN);
const he = updated.indexOf(HTML_TAIL);
if (hs < 0 || he < 0) throw new Error("HTML bounds lost");
updated = updated.slice(0, hs) + emitHtml() + updated.slice(he);

if (!updated.includes(OLD_META_DESC_SNIPPET)) {
  throw new Error("Expected meta description segment not found — aborting head patch");
}
updated = updated.split(OLD_META_DESC_SNIPPET).join(
  H(NEW_META_DESCRIPTION.replace(/&/g, "&amp;").replace(/"/g, "&quot;")) ===
  NEW_META_DESCRIPTION.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    ? NEW_META_DESCRIPTION.replace(/&/g, "&amp;")
    : NEW_META_DESCRIPTION.replace(/&/g, "&amp;")
);
// H() over-escapes — meta content should use &amp; for & only
const META_HTML_ESC = NEW_META_DESCRIPTION.replace(/&/g, "&amp;");
updated = updated.split(OLD_META_DESC_SNIPPET).join(META_HTML_ESC);

const OLD_EXCERPT_ESC = J(
  "How OpticWise takes the operational burden off your on-site team without replacing you."
);
if (!updated.includes(`\\"excerpt\\":\\"${OLD_EXCERPT_ESC}\\"`)) {
  throw new Error("Expected flight excerpt not found");
}
updated = updated.replace(
  `\\"excerpt\\":\\"${OLD_EXCERPT_ESC}\\"`,
  `\\"excerpt\\":\\"${J(NEW_EXCERPT)}\\"`
);

writeFileSync(PAGE_PATH, updated, "utf8");
console.log("Rewrote for-property-managers-and-engineers blocks:", BLOCKS.length);
