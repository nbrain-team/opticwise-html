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
      `\\"secondaryCtaLabel\\":${b.secondaryCtaLabel ? `\\"${J(b.secondaryCtaLabel)}\\
..."` : "null"}`
    );
  },
};

// Fix corrupted hero json renderer - I made a typo. Let me replace the whole jsonRenderers object properly in file.
