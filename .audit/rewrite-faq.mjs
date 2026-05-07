// Patches /faq/index.html in lockstep across all four representations:
//   1. Visible accordion HTML (between hero and CTA inside .ow-v4)
//   2. SSR <script type="application/ld+json"> FAQPage block (in <main>)
//   3. Flight FAQPage chunk (the second flight push that holds raw FAQPage JSON)
//   4. initialData.layout[] inside the 19:["$","$L1a",null,{"initialData":...}] flight push
//
// Also re-computes the Tn:<hex> byte-length prefix that precedes the FAQPage flight chunk.
// Also injects a vanilla-JS client-side search bar (added post-hydration via rAF).
//
// Run: node .audit/rewrite-faq.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { FAQ_HERO, FAQ_CTA, FAQ_SECTIONS } from './faq-content.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FAQ_HTML_PATH = resolve(__dirname, '../faq/index.html');

// ─── HTML helpers ────────────────────────────────────────────────────────────
// Mirror Next.js / React JSX-style HTML escaping used in the existing file.
// The existing file uses: " → &quot; (in attrs), ' → &#x27;, & → &amp;.
function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}
function escText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Render the visible accordion sections (between hero close and CTA open).
function renderAccordions(sections) {
  const sectionHtml = (sec) => {
    const items = sec.questions
      .map(
        (q) =>
          `<details class="faq__item"><summary class="faq__q"><span>${escText(q.question)}</span><span class="faq__toggle">+</span></summary><div class="faq__a">${escText(q.answer)}</div></details>`,
      )
      .join('');
    return `<section class="faq"><div class="container"><div style="max-width:820px;margin-inline:auto"><span class="eyebrow">${escText(sec.eyebrow)}</span><div class="accent-line"></div><h2 class="h2">${escText(sec.heading)}</h2></div><div class="faq__list">${items}</div></div></section>`;
  };
  return sections.map(sectionHtml).join('');
}

// Render the search-bar HTML — we inject this OUTSIDE the React-managed tree
// (between the hero and the first .faq section) via a small post-hydration script
// at end-of-body, so it cannot cause hydration mismatch.
// The FAQ page is rendered by React (PageBlocksLive). React's concurrent
// hydration can remove DOM nodes that aren't part of its rendered tree, so
// we (a) idempotently insert the search bar and (b) install a MutationObserver
// on the FAQ container so we can re-insert if React reconciliation removes it.
// The observer fires only on childList changes of .ow-v4 (cheap), and the
// re-insert is a no-op if the bar still exists.
const SEARCH_BAR_SCRIPT = `<script>(function(){var BAR_HTML='<div class="container"><div class="faq-search"><label for="faq-search-input" class="faq-search__label">Search FAQs</label><input id="faq-search-input" type="search" autocomplete="off" placeholder="Search questions and answers\\u2026" class="faq-search__input" aria-label="Search FAQs"/><button type="button" id="faq-search-clear" class="faq-search__clear" aria-label="Clear search" hidden>\\u00d7</button><div class="faq-search__count" id="faq-search-count" aria-live="polite"></div></div></div>';var NORES_HTML='<div class="container"><div class="faq-no-results__inner"><p class="faq-no-results__msg">No FAQs match your search.</p><p class="faq-no-results__sub">Schedule a complimentary review and ask it directly.</p></div></div>';function ensureBar(){var sections=document.querySelectorAll('main section.faq');if(!sections.length){return false;}if(document.getElementById('faq-search-input')){return true;}var bar=document.createElement('div');bar.className='faq-search-wrap';bar.id='faq-search-wrap';bar.setAttribute('data-ow-injected','1');bar.innerHTML=BAR_HTML;var firstFaq=sections[0];firstFaq.parentNode.insertBefore(bar,firstFaq);var noResults=document.createElement('div');noResults.id='faq-no-results';noResults.className='faq-no-results';noResults.hidden=true;noResults.setAttribute('data-ow-injected','1');noResults.innerHTML=NORES_HTML;var lastFaq=sections[sections.length-1];lastFaq.parentNode.insertBefore(noResults,lastFaq.nextSibling);wireFilter();return true;}function wireFilter(){var input=document.getElementById('faq-search-input');var clearBtn=document.getElementById('faq-search-clear');var countEl=document.getElementById('faq-search-count');var noResults=document.getElementById('faq-no-results');if(!input||input._wired){return;}input._wired=true;var debounce;function filter(){var sections=document.querySelectorAll('main section.faq');var allItems=document.querySelectorAll('main section.faq .faq__item');var q=input.value.trim().toLowerCase();clearBtn.hidden=q.length===0;var matched=0;for(var i=0;i<allItems.length;i++){var item=allItems[i];var qSpan=item.querySelector('.faq__q span');var aDiv=item.querySelector('.faq__a');var qText=qSpan?qSpan.textContent:'';var aText=aDiv?aDiv.textContent:'';var hay=(qText+' '+aText).toLowerCase();var hit=q.length===0||hay.indexOf(q)!==-1;item.style.display=hit?'':'none';if(hit){matched++;item.open=q.length>0;}}for(var s=0;s<sections.length;s++){var visible=0;var items=sections[s].querySelectorAll('.faq__item');for(var k=0;k<items.length;k++){if(items[k].style.display!=='none'){visible++;}}sections[s].style.display=visible===0?'none':'';}noResults.hidden=!(q.length>0&&matched===0);countEl.textContent=q.length===0?'':(matched+' '+(matched===1?'match':'matches'));}input.addEventListener('input',function(){clearTimeout(debounce);debounce=setTimeout(filter,80);});clearBtn.addEventListener('click',function(){input.value='';input.focus();filter();});input.addEventListener('keydown',function(e){if(e.key==='Escape'){input.value='';filter();}});}function setupObserver(){var sections=document.querySelectorAll('main section.faq');if(!sections.length){return;}var target=sections[0].parentNode;if(!target||target._owFaqObs){return;}target._owFaqObs=true;var obs=new MutationObserver(function(){if(!document.getElementById('faq-search-input')){ensureBar();}});obs.observe(target,{childList:true});}function tick(){try{var ok=ensureBar();if(!ok){setTimeout(tick,120);return;}setupObserver();}catch(err){if(window&&window.console&&window.console.error){window.console.error('faq-search tick failed',err);}}}function start(){requestAnimationFrame(function(){requestAnimationFrame(tick);});setTimeout(tick,250);setTimeout(tick,800);setTimeout(tick,1500);}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',start);}else{start();}})();</script>`;

const SEARCH_BAR_STYLES = `<style id="faq-search-styles">.faq-search-wrap{padding:1.5rem 0 0;background:#fff;position:sticky;top:0;z-index:30;border-bottom:1px solid rgba(15,23,42,0.06);box-shadow:0 1px 0 rgba(15,23,42,0.04)}.faq-search{max-width:820px;margin-inline:auto;display:flex;align-items:center;gap:.75rem;position:relative;padding-bottom:1.25rem}.faq-search__label{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.faq-search__input{flex:1;padding:14px 44px 14px 18px;border:1px solid #cbd5e1;border-radius:10px;font-size:15px;background:#fff;font-family:inherit;color:#0f172a;outline:none;transition:border-color .15s,box-shadow .15s}.faq-search__input:focus{border-color:#0066cc;box-shadow:0 0 0 3px rgba(0,102,204,0.15)}.faq-search__clear{position:absolute;right:12px;top:50%;transform:translateY(calc(-50% - .625rem));width:28px;height:28px;border:0;background:rgba(15,23,42,0.08);color:#0f172a;border-radius:50%;font-size:18px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}.faq-search__clear[hidden]{display:none}.faq-search__clear:hover{background:rgba(15,23,42,0.16)}.faq-search__count{position:absolute;right:0;bottom:-4px;font-size:12px;color:#64748b}.faq-no-results{padding:3rem 0;background:#fafbfc;text-align:center}.faq-no-results[hidden]{display:none}.faq-no-results__inner{max-width:520px;margin-inline:auto}.faq-no-results__msg{font-size:18px;font-weight:600;color:#0f172a;margin:0 0 .5rem}.faq-no-results__sub{font-size:14px;color:#64748b;margin:0}@media (max-width:640px){.faq-search-wrap{padding-top:1rem}.faq-search{padding-bottom:1.5rem}.faq-search__count{position:static;text-align:right;margin-top:.25rem}}</style>`;

// ─── ld+json (FAQPage) ───────────────────────────────────────────────────────
function buildFaqPageJson(sections) {
  const all = [];
  for (const sec of sections) {
    for (const q of sec.questions) {
      all.push({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: { '@type': 'Answer', text: q.answer },
      });
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: all,
  };
}

// JSON.stringify, then re-escape & < > as Next.js Flight does (HTML safety).
function jsonStringForFlight(obj) {
  return JSON.stringify(obj)
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
}

// SSR <script type="application/ld+json"> body uses raw " (no escaping needed
// inside a script tag since browsers parse it literally), but Next.js encodes
// & as \u0026 there too. Match that pattern exactly.
function jsonStringForSsrScript(obj) {
  return JSON.stringify(obj)
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
}

// ─── Flight string encode/decode ─────────────────────────────────────────────
// The contents of self.__next_f.push([1,"<HERE>"]) is JS-string-literal escaped.
// Decoding gives us the raw flight payload (which itself is usually JSON-text).
function decodeFlightLiteral(raw) {
  let out = '';
  let i = 0;
  while (i < raw.length) {
    const c = raw[i];
    if (c === '\\') {
      const n = raw[i + 1];
      if (n === 'n') { out += '\n'; i += 2; continue; }
      if (n === '"') { out += '"'; i += 2; continue; }
      if (n === '\\') { out += '\\'; i += 2; continue; }
      if (n === 'r') { out += '\r'; i += 2; continue; }
      if (n === 't') { out += '\t'; i += 2; continue; }
      if (n === 'u' && /[0-9a-fA-F]{4}/.test(raw.slice(i + 2, i + 6))) {
        out += String.fromCharCode(parseInt(raw.slice(i + 2, i + 6), 16));
        i += 6;
        continue;
      }
      out += n;
      i += 2;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}
function encodeFlightLiteral(s) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

// ─── Layout block builders ───────────────────────────────────────────────────
// Reuse the existing block IDs where possible (so anything keyed off the id
// — analytics, links, anchors — stays stable). For new questions and the new
// Managed Wi-Fi block, mint stable synthetic IDs prefixed with "ow-faq-".
function makeFaqBlock(slug, eyebrow, heading, questions) {
  return {
    id: `ow-faq-section-${slug}`,
    eyebrow,
    heading,
    blockName: null,
    questions: questions.map((q, i) => ({
      id: `ow-faq-${slug}-${String(i + 1).padStart(2, '0')}`,
      question: q.question,
      answer: q.answer,
    })),
    blockType: 'faq',
  };
}
function makeHeroBlock(h) {
  return {
    id: 'ow-faq-hero',
    eyebrow: h.eyebrow,
    heading: h.heading,
    lede: h.lede,
    reframeLine: h.reframeLine,
    audienceLine: null,
    primaryCtaLabel: h.primaryCtaLabel,
    secondaryCtaLabel: null,
    secondaryCtaHref: null,
    style: 'dark',
    blockName: null,
    blockType: 'hero',
  };
}
function makeCtaBlock(c) {
  return {
    id: 'ow-faq-cta',
    eyebrow: c.eyebrow,
    heading: c.heading,
    subheading: c.subheading,
    buttonLabel: c.buttonLabel,
    style: 'blue',
    blockName: null,
    bulletPoints: [],
    blockType: 'callToAction',
  };
}

// Slug from heading
function slugFor(heading) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Patch the file ──────────────────────────────────────────────────────────
function main() {
  let html = readFileSync(FAQ_HTML_PATH, 'utf8');
  const original = html;

  // 1) Replace visible accordion sections.
  // Boundary: end of hero (first </section> after "hero hero--dark") to start
  // of CTA section ("<section class=\"cta cta--blue\"").
  const heroOpen = html.indexOf('<section class="hero hero--dark">');
  if (heroOpen < 0) throw new Error('hero section not found');
  // Find the matching </section> by walking forward from heroOpen.
  // Easiest: hero section ends with the first '</section>' encountered while
  // depth tracking <section> tags.
  function findSectionEnd(startIdx) {
    // The hero <section> contains no nested <section> tags in this layout, so
    // the very next </section> after startIdx is its close. Verified against
    // the current faq/index.html layout.
    const c = html.indexOf('</section>', startIdx);
    if (c < 0) throw new Error('no closing </section> for hero');
    return c + '</section>'.length;
  }
  const heroEnd = findSectionEnd(heroOpen);
  const ctaOpen = html.indexOf('<section class="cta cta--blue"', heroEnd);
  if (ctaOpen < 0) throw new Error('cta section not found');

  const accordionsHtml = renderAccordions(FAQ_SECTIONS);
  html = html.slice(0, heroEnd) + accordionsHtml + html.slice(ctaOpen);

  // 2) Replace SSR ld+json FAQPage script (the one inside <main>, NOT the flight chunk).
  // The SSR copy starts with: <script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage",
  const ssrFaqJsonObj = buildFaqPageJson(FAQ_SECTIONS);
  const ssrFaqJsonText = jsonStringForSsrScript(ssrFaqJsonObj);
  const ssrFaqOpen = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage"';
  const ssrIdx = html.indexOf(ssrFaqOpen);
  if (ssrIdx < 0) throw new Error('SSR FAQPage <script> not found');
  const ssrScriptStart = html.indexOf('<script type="application/ld+json">', ssrIdx);
  const ssrScriptEnd = html.indexOf('</script>', ssrScriptStart) + '</script>'.length;
  const ssrReplacement =
    '<script type="application/ld+json">' + ssrFaqJsonText + '</script>';
  html = html.slice(0, ssrScriptStart) + ssrReplacement + html.slice(ssrScriptEnd);

  // 3) Replace the FAQPage flight chunk + recompute its Tn:hex byte-length.
  // Pattern in original file:
  //   <script>self.__next_f.push([1,"18:T<HEX>,"])</script>
  //   <script>self.__next_f.push([1,"{\"@context\":\"https://schema.org\",\"@type\":\"FAQPage\"...}"])</script>
  //
  // We rebuild the FAQPage chunk content from the SAME ssrFaqJsonText so the SSR
  // and flight copies are byte-identical. Then compute its UTF-8 byte length
  // and write it back into the Tn:<hex>, prefix.
  const faqFlightContent = ssrFaqJsonText; // identical to the SSR <script> body
  const faqFlightLiteral = encodeFlightLiteral(faqFlightContent);
  const utf8Len = Buffer.byteLength(faqFlightContent, 'utf8');
  const newTPrefix = utf8Len.toString(16);

  // Find the existing Tn:<hex>, prefix. Slot number is whatever is currently used
  // (we don't change it). Pattern: self.__next_f.push([1,"<SLOT>:T<HEX>,"])
  const tPrefixRe = /self\.__next_f\.push\(\[1,"(\d+):T([0-9a-f]+),"\]\)/;
  const tMatch = html.match(tPrefixRe);
  if (!tMatch) throw new Error('FAQPage Tn:<hex>, flight prefix not found');
  const slot = tMatch[1];
  const oldHex = tMatch[2];
  // Build the replacement prefix and the replacement chunk; both are written.
  const newPrefix = `self.__next_f.push([1,"${slot}:T${newTPrefix},"])`;
  // Replace the prefix push first.
  html = html.replace(tPrefixRe, newPrefix);

  // Now find the FAQPage chunk push that immediately follows the prefix push and
  // rewrite its content. The pattern is the next push that starts with `{` (the
  // raw FAQPage JSON). Be defensive: search after the prefix index.
  const prefixIdx = html.indexOf(newPrefix);
  const chunkOpenStr = `</script><script>self.__next_f.push([1,"`;
  const chunkOpenIdx = html.indexOf(chunkOpenStr, prefixIdx);
  if (chunkOpenIdx < 0) throw new Error('FAQPage flight chunk start not found');
  const chunkBodyStart = chunkOpenIdx + chunkOpenStr.length;
  // Walk forward to the closing literal ".
  let k = chunkBodyStart;
  while (k < html.length) {
    if (html[k] === '\\') {
      k += 2;
      continue;
    }
    if (html[k] === '"') break;
    k++;
  }
  const chunkBodyEnd = k;
  const chunkClose = `"])`;
  if (html.slice(chunkBodyEnd, chunkBodyEnd + chunkClose.length) !== chunkClose) {
    throw new Error('FAQPage flight chunk close not where expected');
  }
  // Sanity check: the existing body should look like a FAQPage JSON literal.
  const oldBody = html.slice(chunkBodyStart, chunkBodyEnd);
  if (!oldBody.startsWith('{\\"@context')) {
    throw new Error(
      `FAQPage flight chunk body sanity check failed; starts with: ${oldBody.slice(0, 60)}`,
    );
  }
  html =
    html.slice(0, chunkBodyStart) +
    faqFlightLiteral +
    html.slice(chunkBodyEnd);

  // 4) Replace the layout array inside initialData in the
  //    19:["$","$L1a",null,{"initialData":...}] flight push.
  //
  // Strategy: find the push that contains '\"initialData\":' AND the '\"layout\":['.
  // Decode the literal, find the layout array bounds inside the decoded string,
  // replace the JSON array with a freshly stringified one, re-encode.
  const initialNeedle = '\\"initialData\\":';
  const initialIdx = html.indexOf(initialNeedle);
  if (initialIdx < 0) throw new Error('initialData flight push not found');
  // Find the enclosing self.__next_f.push([1,"...
  const pushOpen = 'self.__next_f.push([1,"';
  const pushOpenIdx = html.lastIndexOf(pushOpen, initialIdx);
  if (pushOpenIdx < 0) throw new Error('initialData push opener not found');
  const literalStart = pushOpenIdx + pushOpen.length;
  // Find literal end "])
  let m = literalStart;
  while (m < html.length) {
    if (html[m] === '\\') { m += 2; continue; }
    if (html[m] === '"') break;
    m++;
  }
  const literalEnd = m;
  if (html.slice(literalEnd, literalEnd + 3) !== '"])') {
    throw new Error('initialData push close marker not at expected position');
  }
  const literal = html.slice(literalStart, literalEnd);
  const decoded = decodeFlightLiteral(literal);

  // Decoded string looks like: 19:[...whatever...]
  // Find "layout": and walk to the matching ].
  const layoutKey = '"layout":';
  const layoutKeyIdx = decoded.indexOf(layoutKey);
  if (layoutKeyIdx < 0) throw new Error('"layout": key not found in initialData');
  let bracketStart = decoded.indexOf('[', layoutKeyIdx);
  if (bracketStart < 0) throw new Error('layout array open bracket not found');
  // Walk to matching ], respecting strings.
  let depth = 0;
  let p = bracketStart;
  while (p < decoded.length) {
    const ch = decoded[p];
    if (ch === '"') {
      // skip string
      p++;
      while (p < decoded.length) {
        if (decoded[p] === '\\') { p += 2; continue; }
        if (decoded[p] === '"') break;
        p++;
      }
      p++;
      continue;
    }
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) { break; }
    }
    p++;
  }
  if (depth !== 0) throw new Error('unbalanced brackets walking layout array');
  const bracketEnd = p; // index of matching ']'

  // Build new layout: hero + 7 faq blocks + cta.
  const newLayout = [
    makeHeroBlock(FAQ_HERO),
    ...FAQ_SECTIONS.map((sec) =>
      makeFaqBlock(slugFor(sec.heading), sec.eyebrow, sec.heading, sec.questions),
    ),
    makeCtaBlock(FAQ_CTA),
  ];

  // JSON-stringify the array using the same HTML-safety re-escape as flight.
  const newLayoutText = jsonStringForFlight(newLayout);

  const newDecoded =
    decoded.slice(0, bracketStart) +
    newLayoutText +
    decoded.slice(bracketEnd + 1);

  const newLiteral = encodeFlightLiteral(newDecoded);
  html =
    html.slice(0, literalStart) +
    newLiteral +
    html.slice(literalEnd);

  // 5) Inject the search bar styles + script just before </body>, idempotently.
  // Remove any prior version first.
  html = html.replace(
    /<style id="faq-search-styles">[\s\S]*?<\/style>/,
    '',
  );
  html = html.replace(
    /<script>\(function\(\)\{(?:function init\(\)\{try\{var sections=document\.querySelectorAll\('main section\.faq'\)|var BAR_HTML=)[\s\S]*?\}\)\(\);<\/script>/,
    '',
  );
  const bodyClose = html.lastIndexOf('</body>');
  if (bodyClose < 0) throw new Error('</body> not found');
  html =
    html.slice(0, bodyClose) +
    SEARCH_BAR_STYLES +
    SEARCH_BAR_SCRIPT +
    html.slice(bodyClose);

  if (html === original) {
    console.log('No changes to write.');
    return;
  }
  writeFileSync(FAQ_HTML_PATH, html);
  console.log(
    `Wrote ${FAQ_HTML_PATH}\n  sections: ${FAQ_SECTIONS.length}\n  questions: ${FAQ_SECTIONS.reduce((n, s) => n + s.questions.length, 0)}\n  prev T${oldHex} → T${newTPrefix}`,
  );
}

main();
