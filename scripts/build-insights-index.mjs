#!/usr/bin/env node
/*
 * scripts/build-insights-index.mjs
 *
 * Regenerates the OpticWise insights listing in two passes:
 *
 *   1. Walks every post under /insights/<slug>/index.html, extracts
 *      title / excerpt / category / date / hero image / body text,
 *      and writes /insights/search-index.json (consumed at runtime by
 *      site.js for client-side search across all posts).
 *
 *   2. Splices a freshly rendered card grid + filter buttons + counter
 *      into /insights/index.html so the listing reflects the current
 *      post set (newest first, first 30 visible, the rest marked
 *      `hidden` until "Load more" reveals them).
 *
 * Run this script whenever you add or edit a post under /insights/<slug>/:
 *
 *     node scripts/build-insights-index.mjs
 *
 * Pure Node (>= 18). No external dependencies, no build step.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const INSIGHTS_DIR = join(ROOT, 'insights');
const LISTING_FILE = join(INSIGHTS_DIR, 'index.html');
const INDEX_JSON = join(INSIGHTS_DIR, 'search-index.json');

const INITIAL_VISIBLE = 30;
const BODY_CHAR_CAP = 5000;
const EAGER_IMG_COUNT = 6;

// ---------- entity helpers ----------

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ldquo: '\u201c', rdquo: '\u201d', lsquo: '\u2018', rsquo: '\u2019',
  hellip: '\u2026', mdash: '\u2014', ndash: '\u2013', trade: '\u2122',
  reg: '\u00ae', copy: '\u00a9', deg: '\u00b0',
};

function decodeEntities(s) {
  if (!s) return '';
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => (NAMED_ENTITIES[name] ?? m));
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ---------- post extraction ----------

// A small number of imported posts ship with the global site fallbacks baked
// into <title>, <meta name="description">, and <meta property="og:image">
// instead of post-specific values. The extractor refuses these and falls back
// to higher-fidelity sources (post <h1>, JSON-LD Article, body first <p>).
const GENERIC_TITLE_RE = /^OpticWise\s*\|/i;
const GENERIC_DESC_RE = /^OpticWise\s+helps\s+commercial\s+real\s+estate\s+owners/i;
const GENERIC_IMAGE_RE = /\/og-default\.png(?:[?#]|$)/i;

function isGenericTitle(s) { return !!s && GENERIC_TITLE_RE.test(s); }
function isGenericDescription(s) { return !!s && GENERIC_DESC_RE.test(s); }
function isGenericImage(s) { return !!s && GENERIC_IMAGE_RE.test(s); }

function htmlToText(html) {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|section|article|figure|blockquote)\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

function extractH1Text(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return '';
  return decodeEntities(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function findJsonLdArticleField(html, field) {
  const blockRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const fieldRe = new RegExp('"' + field + '"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"');
  let m;
  while ((m = blockRe.exec(html)) !== null) {
    const block = m[1];
    if (!/"@type"\s*:\s*"Article"/i.test(block)) continue;
    const fm = block.match(fieldRe);
    if (!fm) continue;
    try {
      const decoded = JSON.parse('"' + fm[1] + '"');
      return decodeEntities(decoded).replace(/\s+/g, ' ').trim();
    } catch {
      return decodeEntities(fm[1]).replace(/\s+/g, ' ').trim();
    }
  }
  return '';
}

function extractFirstParagraphFromGhost(ghostHtml) {
  if (!ghostHtml) return '';
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(ghostHtml)) !== null) {
    const text = decodeEntities(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const cleaned = text.replace(/^TL;DR:\s*/i, '').trim();
    if (cleaned.length < 60) continue;
    return cleaned;
  }
  return '';
}

function normalizeText(html) {
  const stripped = htmlToText(html);
  return decodeEntities(stripped).replace(/\s+/g, ' ').trim();
}

function formatDateLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function normalizeImagePath(image) {
  if (!image) return '';
  const ABS = 'https://www.opticwise.com';
  if (image.startsWith(ABS)) return '..' + image.slice(ABS.length);
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith('/')) return '..' + image;
  return image;
}

function extractPost(slug, html) {
  // Pull out the ghost-content body once; reused by excerpt fallback and body.
  let ghostHtml = '';
  let body = '';
  const ghostMarker = '<div class="ghost-content">';
  const ghostStart = html.indexOf(ghostMarker);
  if (ghostStart !== -1) {
    const after = html.slice(ghostStart + ghostMarker.length);
    const closeIdx = after.indexOf('</div></div></section>');
    ghostHtml = closeIdx !== -1 ? after.slice(0, closeIdx) : after;
    body = normalizeText(ghostHtml).slice(0, BODY_CHAR_CAP);
  }

  // Title: prefer the post's hero <h1> over <title>, since some imported
  // posts have the global site title in <title>. JSON-LD Article.headline is
  // a secondary fallback before <title>; slug is the floor.
  const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = titleM ? decodeEntities(titleM[1]).trim() : '';
  const h1Title = extractH1Text(html);
  const jsonLdHeadline = findJsonLdArticleField(html, 'headline');

  let title;
  if (h1Title) title = h1Title;
  else if (jsonLdHeadline) title = jsonLdHeadline;
  else if (rawTitle && !isGenericTitle(rawTitle)) title = rawTitle;
  else title = slug;

  // Excerpt: prefer post-specific meta description, then JSON-LD Article
  // description, then the first substantive paragraph in the body. Reject
  // generic site fallback values at every step. The content="" capture is
  // quote-aware so an unescaped apostrophe inside a double-quoted attribute
  // does not truncate the match.
  const descM = html.match(/<meta\s+name=["']description["']\s+content=(?:"([^"]*)"|'([^']*)')/i);
  const rawDesc = descM ? decodeEntities(descM[1] ?? descM[2] ?? '').trim() : '';
  const jsonLdDesc = findJsonLdArticleField(html, 'description');

  let excerpt = '';
  if (rawDesc && !isGenericDescription(rawDesc)) excerpt = rawDesc;
  else if (jsonLdDesc && !isGenericDescription(jsonLdDesc)) excerpt = jsonLdDesc;
  else excerpt = extractFirstParagraphFromGhost(ghostHtml);

  // Image: reject the global og-default fallback so the listing card can
  // render a placeholder instead of showing a misleading hero image. The
  // content="" capture is quote-aware (see excerpt above).
  const ogImageM = html.match(/<meta\s+property=["']og:image["']\s+content=(?:"([^"]+)"|'([^']+)')/i);
  const rawImage = ogImageM ? (ogImageM[1] ?? ogImageM[2] ?? '') : '';
  const image = (rawImage && !isGenericImage(rawImage)) ? normalizeImagePath(rawImage) : '';

  // Hero category pill (rendered on every post page hero)
  const catM = html.match(/<span class="block text-xs font-bold text-blue-300 bg-blue-400\/10[^"]*">([\s\S]*?)<\/span>/);
  const category = catM ? decodeEntities(catM[1]).trim() : '';

  // Optional hidden secondary-categories metadata element rendered next to
  // the primary pill. Comma-separated list, max 2 entries. Inert metadata
  // for now — the listing filter still uses the primary `category` only.
  const secM = html.match(/<span\s+hidden\s+data-ow-secondary-cats="([^"]*)"\s*><\/span>/);
  const secondaryCategories = secM
    ? decodeEntities(secM[1])
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // datePublished from JSON-LD Article schema
  const dateM = html.match(/"datePublished"\s*:\s*"([^"]+)"/);
  const dateIso = dateM ? dateM[1] : '';
  const dateLabel = formatDateLabel(dateIso);

  return {
    slug,
    href: `../insights/${slug}/index.html`,
    title,
    excerpt,
    category,
    secondaryCategories,
    date: dateLabel,
    dateIso,
    image,
    body,
  };
}

// ---------- card / button rendering ----------

function renderCard(p, index) {
  const hidden = index >= INITIAL_VISIBLE ? ' hidden' : '';
  const loading = index < EAGER_IMG_COUNT ? 'eager' : 'lazy';
  const altTitle = escapeAttr(p.title);

  const imgBlock = p.image
    ? `<div class="aspect-[16/9] overflow-hidden bg-gray-100"><img src="${escapeAttr(p.image)}" alt="${altTitle}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="${loading}" decoding="async"/></div>`
    : `<div class="aspect-[16/9] overflow-hidden bg-gray-100"></div>`;

  const categoryBlock = p.category
    ? `<span class="inline-block text-xs font-bold text-ow-blue bg-blue-50 px-3 py-1 rounded-full mb-3">${escapeHtml(p.category)}</span>`
    : '';

  const excerptBlock = p.excerpt
    ? `<p class="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-3">${escapeHtml(p.excerpt)}</p>`
    : '';

  const dateBlock = p.date
    ? `<div class="flex items-center gap-2 text-xs text-gray-400"><span>${escapeHtml(p.date)}</span></div>`
    : `<div class="flex items-center gap-2 text-xs text-gray-400"></div>`;

  return (
    `<a class="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-ow-blue/20 transition-all no-underline" href="${escapeAttr(p.href)}" data-ow-slug="${escapeAttr(p.slug)}" data-ow-cat="${escapeAttr(p.category)}"${hidden}>` +
    imgBlock +
    `<div class="p-6">` +
    categoryBlock +
    `<h3 class="text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-ow-blue transition-colors">${escapeHtml(p.title)}</h3>` +
    excerptBlock +
    dateBlock +
    `</div></a>`
  );
}

function renderButtons(categories) {
  const parts = [`<button class="role-tab active" data-ow-cat="All">All</button>`];
  for (const c of categories) {
    parts.push(`<button class="role-tab" data-ow-cat="${escapeAttr(c)}">${escapeHtml(c)}</button>`);
  }
  return parts.join('');
}

// ---------- listing splice ----------

function replaceFiltersRow(html, buttonsHtml) {
  const open = '<div class="flex flex-wrap justify-center gap-2">';
  const start = html.indexOf(open);
  if (start === -1) throw new Error('Filters row anchor not found in listing HTML');
  const innerStart = start + open.length;
  const close = '</div>';
  const end = html.indexOf(close, innerStart);
  if (end === -1) throw new Error('Filters row close not found in listing HTML');
  return html.slice(0, innerStart) + buttonsHtml + html.slice(end);
}

function replaceGridSection(html, cardsHtml, totalCount) {
  const startMarker = '<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"';
  const endAnchor = '<section class="relative overflow-hidden py-24">';
  const start = html.indexOf(startMarker);
  if (start === -1) throw new Error('Grid start anchor not found in listing HTML');
  const end = html.indexOf(endAnchor, start);
  if (end === -1) throw new Error('Grid end anchor not found in listing HTML');

  const initial = Math.min(INITIAL_VISIBLE, totalCount);
  const remaining = Math.max(0, totalCount - initial);
  const wrapStyle = remaining > 0 ? '' : ' style="display:none"';
  const loadMoreText = remaining > 0
    ? `Load more (<!-- -->${remaining}<!-- --> remaining)`
    : `Load more`;

  const replacement =
    `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8" data-ow-insights-grid>` +
    cardsHtml +
    `</div>` +
    `<div aria-hidden="true" class="h-1 w-full"></div>` +
    `<div class="flex justify-center mt-10" data-ow-insights-loadmore-wrap${wrapStyle}>` +
    `<button type="button" class="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:border-ow-blue hover:text-ow-blue transition-colors" data-ow-insights-loadmore>${loadMoreText}</button>` +
    `</div>` +
    `<p class="mt-6 text-center text-xs text-gray-400" data-ow-insights-count>Showing <!-- -->${initial}<!-- --> of <!-- -->${totalCount}</p>` +
    `</div></section>`;

  return html.slice(0, start) + replacement + html.slice(end);
}

// ---------- main ----------

function main() {
  const slugs = readdirSync(INSIGHTS_DIR).filter((name) => {
    if (name.startsWith('.')) return false;
    const full = join(INSIGHTS_DIR, name);
    try { return statSync(full).isDirectory(); } catch { return false; }
  });

  const posts = [];
  const warnings = [];
  for (const slug of slugs) {
    const file = join(INSIGHTS_DIR, slug, 'index.html');
    let html;
    try { html = readFileSync(file, 'utf8'); }
    catch { warnings.push(`${slug}: missing index.html`); continue; }
    const post = extractPost(slug, html);
    if (!post.title) warnings.push(`${slug}: missing title`);
    if (isGenericTitle(post.title)) warnings.push(`${slug}: title still resolves to generic site title`);
    if (isGenericDescription(post.excerpt)) warnings.push(`${slug}: excerpt still resolves to generic site description`);
    if (!post.category) warnings.push(`${slug}: missing category pill`);
    if (!post.dateIso) warnings.push(`${slug}: missing datePublished`);
    if (!post.body) warnings.push(`${slug}: empty body extraction`);
    posts.push(post);
  }

  // Newest first; posts without a date sink to the bottom
  posts.sort((a, b) => {
    const ad = a.dateIso || '';
    const bd = b.dateIso || '';
    if (!ad && bd) return 1;
    if (ad && !bd) return -1;
    return bd.localeCompare(ad);
  });

  const indexEntries = posts.map((p) => ({
    slug: p.slug,
    href: p.href,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    date: p.date,
    image: p.image,
    body: p.body,
  }));
  writeFileSync(INDEX_JSON, JSON.stringify(indexEntries) + '\n', 'utf8');

  const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'en'));
  const buttonsHtml = renderButtons(categories);
  const cardsHtml = posts.map((p, i) => renderCard(p, i)).join('');

  let listing = readFileSync(LISTING_FILE, 'utf8');
  listing = replaceFiltersRow(listing, buttonsHtml);
  listing = replaceGridSection(listing, cardsHtml, posts.length);
  writeFileSync(LISTING_FILE, listing, 'utf8');

  console.log(`✓ Wrote ${INDEX_JSON} (${indexEntries.length} entries)`);
  console.log(`✓ Updated ${LISTING_FILE}`);
  console.log(`  Categories (${categories.length}): ${categories.join(', ')}`);
  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  - ${w}`);
  }
}

main();
