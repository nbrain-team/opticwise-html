#!/usr/bin/env node
// Rebuild /for-tenants — business (multi-tenant CRE) tenant lens: lease diligence, connectivity,
// occupancy readiness, ownership of building data & digital infrastructure. Visible HTML + flight layout in lockstep.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PAGE_PATH = join(ROOT, "for-tenants/index.html");

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
    id: "69ebb643ea9de5548eff5e60",
    style: "dark",
    eyebrow: "For Business Tenants",
    heading: "What You Are Really Buying: Building Data \u0026 Digital Infrastructure \u2014 Not Just RSF.",
    lede: "Multi\u2011tenant teams show up with LC, IT, and workplace leads in the same room because the risk is operational: time to usable connectivity, who owns carriage in the path, whether common\u2011area and base\u2011building systems can take your firm down on Day One, and what the sponsor can evidence when you ask a hard question in diligence. This page is written for the tenant side of that conversation.",
    reframeLine: "If you don\u2019t own your data \u0026 digital infrastructure, your vendors do.",
    audienceLine:
      "For occupiers, corporate real estate advisors, workplace leads, and IT stakeholders evaluating office and multi\u2011tenant commercial space \u2014 not residential leasing.",
    primaryCtaLabel: "Schedule Your Review",
    secondaryCtaLabel: "5S\u00ae tenant experience standard",
    secondaryCtaHref: "../5s-user-experience-standard/index.html",
  },
  {
    type: "fiveStandard",
    id: "69ebb643ea9de5548eff5e66",
    eyebrow: "What Tenants Ask Us to Evidence",
    heading: "5S\u00ae \u2014 The User Experience You Can Negotiate Around",
    tagline:
      "Buy\u2011side teams increasingly treat reliable carriage, identity, and fault isolation as table stakes \u2014 the same way they treat power and HVAC capacity. Peak Property Performance\u00ae is the owner discipline; 5S\u00ae is the tenant\u2011facing description of what that feels like day to day.",
    standards: [
      {
        id: "69ebb643ea9de5548eff5e61",
        title: "Seamless Mobility",
        description:
          "One coherent identity from the suite to shared amenity and circulation space \u2014 fewer \u201cre\u2011authenticate everywhere\u201d days when your employees move.",
      },
      {
        id: "69ebb643ea9de5548eff5e62",
        title: "Security",
        description:
          "Tenant traffic logically separated from other occupiers and from building OT \u2014 the posture you want when legal and IT ask how \u201cshared\u201d the stack really is.",
      },
      {
        id: "69ebb643ea9de5548eff5e63",
        title: "Stability",
        description:
          "Failure domains that do not turn a chiller event or a vendor slip into a firm\u2011wide outage \u2014 closer to the resilience you model internally.",
      },
      {
        id: "69ebb643ea9de5548eff5e64",
        title: "Speed",
        description:
          "Throughput and latency aligned to how you work \u2014 video, design, trading, clinic, lab \u2014 instead of a generic \u201cbuilding minimum\u201d that ages poorly at Year Three.",
      },
      {
        id: "69ebb643ea9de5548eff5e65",
        title: "Service",
        description:
          "Named operational cover and runbooks \u2014 not a portal that routes every incident to \u201cplease wait for the next available vendor.\u201d",
      },
    ],
  },
  {
    type: "cardGrid",
    id: "69ebb643ea9de5548eff5e6b",
    style: "nearwhite",
    columns: "2",
    eyebrow: "Patterns Offices Outgrow",
    heading: "When the Stack Was Never Designed For Your Timeline",
    subheading:
      "A common pattern we see in tour and LOI weeks: connectivity looks free until it isn\u2019t, and the building story gets fuzzy right when IT joins the thread.",
    closingLine:
      "None of this is drama for drama\u2019s sake \u2014 it is the difference between occupying on the date you modeled and burning soft dollars while someone finds the demarc.",
    cards: [
      {
        id: "69ebb643ea9de5548eff5e67",
        title: "\u201cGift\u201d Wi\u2011Fi That Comes With a Landlord None of You Know",
        description:
          "Outsourced amenity networks, opaque SLAs, and a help desk that cannot answer suite\u2011edge questions \u2014 your GC signs; your IT inherits the ambiguity.",
      },
      {
        id: "69ebb643ea9de5548eff5e68",
        title: "Single\u2011Thread Building Paths",
        description:
          "One carrier, one closet, no documented diversity \u2014 fine until a backhoe afternoon becomes a revenue or patient\u2011care story instead of a facilities note.",
      },
      {
        id: "69ebb643ea9de5548eff5e69",
        title: "TI Surprises After IT Walks the Base Building",
        description:
          "Conduit, IDF capacity, cable plant, and cooling headroom were not priced against your move\u2011in \u2014 so your allowance disappears before a single desk lands.",
      },
      {
        id: "69ebb643ea9de5548eff5e6a",
        title: "You Are the Default Integrator",
        description:
          "Access control, visitor, parking, and guest Wi\u2011Fi each want their own vendor login \u2014 your workplace team becomes the glue because nobody owns the plane end to end.",
      },
    ],
  },
  {
    type: "twoColumn",
    id: "69ebb643ea9de5548eff5e6c",
    style: "dark",
    eyebrow: "Owner Thread \u2014 Tenant Trust",
    heading: "What We Do \u2014 and What Stays Sacred",
    subheading:
      "OpticWise does not monetize tenant browsing behavior. OpticWise does not sell user data. Tenant trust is non\u2011negotiable \u2014 the same way owner\u2011controlled data \u0026 digital infrastructure is non\u2011negotiable on the asset side.",
    authorityNote:
      "PPP 5C\u2122 under Peak Property Performance\u00ae keeps capital and operations on one owner evidence line. OpticWise runs the building\u2019s data \u0026 digital infrastructure (BoT\u00ae \u2014 Building of Things\u00ae); Property Brain\u2122 \u2192 Portfolio Brain\u2122 is the permissioned trust plane. Your suite stays yours \u2014 we align base\u2011building carriage to what your sponsor can show in a review.",
  },
  {
    type: "pullQuote",
    id: "reframe-banner-for-tenants",
    style: "dark",
    eyebrow: "",
    quote: "If you don\u2019t own your data \u0026 digital infrastructure, your vendors do.",
    attribution: "",
  },
  {
    type: "callToAction",
    id: "69ebb643ea9de5548eff5e6d",
    style: "blue",
    eyebrow: "Your Next Step",
    heading: "Evaluating a Building Marketed With OpticWise?",
    subheading:
      "Bring your sponsor or broker, your IT lead, and your workplace owner \u2014 we walk the questions tenant teams actually file after the tour: demarc, redundancy, change control, and what is evidenced when performance slips.",
    buttonLabel: "Schedule a Conversation",
    bulletPoints: [
      {
        id: "69ebb643ea9de5548eff5e6e",
        text: "Who holds operational authority for base\u2011building and amenity carriage \u2014 and how that shows up in an incident, not a slide",
      },
      {
        id: "69ebb643ea9de5548eff5e6f",
        text: "How 5S\u00ae maps to your occupancy plan, headcount mix, and the applications your firm runs",
      },
      {
        id: "69ebb643ea9de5548eff5e70",
        text: "What the owner can show when your counsel or IT asks about segmentation, lineage, and vendor access on the building plane",
      },
      {
        id: "69ebb643ea9de5548eff5e71",
        text: "Where suite scope stops and owner\u2011held data \u0026 digital infrastructure begins \u2014 before TI gets re\u2011cut",
      },
    ],
  },
];

const NEW_PAGE_TITLE = "For Business Tenants | Data & Digital Infrastructure in Your Lease | OpticWise";
const OLD_PAGE_TITLE = "For Tenants | What 5S® Means for Lease Decisions | OpticWise";
const OLD_OG_TITLE = "For Tenants | What 5S® Means for Lease Decisions";

const NEW_META_DESCRIPTION =
  "For business tenants and advisors: what OpticWise signals in multi\u2011tenant CRE \u2014 5S\u00ae user experience, owner\u2011held data \u0026 digital infrastructure, PPP 5C\u2122 discipline, and diligence you can hold sponsors to.";
const OLD_META_DESC_SNIPPET =
  "What the 5S® Connectivity standard actually means for tenants — and why it matters for lease decisions in commercial real estate.";
const NEW_EXCERPT =
  "What owner\u2011standard data \u0026 digital infrastructure means for business tenants in multi\u2011tenant CRE \u2014 5S\u00ae, diligence language, and why the owner thread matters at LOI.";

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
const META_HTML_ESC = NEW_META_DESCRIPTION.replace(/&/g, "&amp;");
updated = updated.split(OLD_META_DESC_SNIPPET).join(META_HTML_ESC);

const OLD_FLIGHT_META_DESC = J(
  "What the 5S® Connectivity standard actually means for tenants — and why it matters for lease decisions in commercial real estate."
);
updated = updated.replace(OLD_FLIGHT_META_DESC, J(NEW_META_DESCRIPTION));

const OLD_EXCERPT_ESC = J(
  "What the 5S® standard actually means for tenants — and why it matters for lease decisions."
);
if (!updated.includes(`\\"excerpt\\":\\"${OLD_EXCERPT_ESC}\\"`)) {
  throw new Error("Expected flight excerpt not found");
}
updated = updated.replace(
  `\\"excerpt\\":\\"${OLD_EXCERPT_ESC}\\"`,
  `\\"excerpt\\":\\"${J(NEW_EXCERPT)}\\"`
);

const NEW_TITLE_HTML = NEW_PAGE_TITLE.replace(/&/g, "&amp;");
updated = updated.split(`<title>${OLD_PAGE_TITLE}</title>`).join(`<title>${NEW_TITLE_HTML}</title>`);
updated = updated
  .split(`<meta property="og:title" content="${OLD_OG_TITLE}"/>`)
  .join(`<meta property="og:title" content="${NEW_TITLE_HTML.replace(" | OpticWise", "")}"/>`);
updated = updated
  .split(`<meta name="twitter:title" content="${OLD_OG_TITLE}"/>`)
  .join(`<meta name="twitter:title" content="${NEW_TITLE_HTML.replace(" | OpticWise", "")}"/>`);

const OLD_INITIAL_META_TITLE = J("For Tenants | What 5S® Means for Lease Decisions");
const NEW_INITIAL_META_TITLE = J("For Business Tenants | Data & Digital Infrastructure in Your Lease");
updated = updated.replace(`\\"title\\":\\"${OLD_INITIAL_META_TITLE}\\",\\"description\\"`, `\\"title\\":\\"${NEW_INITIAL_META_TITLE}\\",\\"description\\"`);

const OLD_FLIGHT_OG = J(OLD_OG_TITLE);
const NEW_FLIGHT_OG = J(NEW_TITLE_HTML.replace(" | OpticWise", ""));
updated = updated.replace(`\\"property\\":\\"og:title\\",\\"content\\":\\"${OLD_FLIGHT_OG}\\"`, `\\"property\\":\\"og:title\\",\\"content\\":\\"${NEW_FLIGHT_OG}\\"`);
updated = updated.replace(`\\"name\\":\\"twitter:title\\",\\"content\\":\\"${OLD_FLIGHT_OG}\\"`, `\\"name\\":\\"twitter:title\\",\\"content\\":\\"${NEW_FLIGHT_OG}\\"`);
const OLD_METADATA_CHILD_TITLE = `For Tenants | What 5S\u00ae Means for Lease Decisions | OpticWise`;
updated = updated.split(`\\"children\\":\\"${OLD_METADATA_CHILD_TITLE}\\"`).join(`\\"children\\":\\"${J(NEW_PAGE_TITLE)}\\"`);

writeFileSync(PAGE_PATH, updated, "utf8");
console.log("Rewrote for-tenants blocks:", BLOCKS.length);
