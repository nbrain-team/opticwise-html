#!/usr/bin/env node
/*
 * scripts/_fix-broken-post-meta.mjs
 *
 * One-shot rescue script for posts imported with the global site fallbacks
 * baked into <title>, meta description, og:image, etc. instead of post-
 * specific values. Two failure modes:
 *
 *   A. Title + excerpt + image are all the global site default (og-default.png
 *      + "OpticWise | Own Your Data..." + the global tagline). The fix derives
 *      title from the post <h1>, description from the first substantive body
 *      paragraph, and image from a per-slug file in /api/media/file/.
 *
 *   B. Title + excerpt are post-specific but og:image references a filename
 *      that doesn't exist on disk (typo / -1 suffix mismatch). The fix
 *      rewrites the og:image / twitter:image to the real filename.
 *
 * Run once after extractor hardening, then run build-insights-index.mjs.
 *
 * Pure Node, no deps.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const INSIGHTS_DIR = join(ROOT, 'insights');
const MEDIA_DIR = join(ROOT, 'api', 'media', 'file');
const ABS = 'https://www.opticwise.com';

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
function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeJson(s) {
  return JSON.stringify(String(s)).slice(1, -1);
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return '';
  return decodeEntities(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function extractFirstParagraph(html) {
  const ghostMarker = '<div class="ghost-content">';
  const ghostStart = html.indexOf(ghostMarker);
  if (ghostStart === -1) return '';
  const after = html.slice(ghostStart + ghostMarker.length);
  const closeIdx = after.indexOf('</div></div></section>');
  const ghostHtml = closeIdx !== -1 ? after.slice(0, closeIdx) : after;
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

function findCandidateImage(slug) {
  const files = readdirSync(MEDIA_DIR);
  const lower = slug.toLowerCase();
  // Try in order: <slug>.<ext>, <slug>-cover.<ext>, <slug>-1.<ext>
  const variants = [lower, lower + '-cover', lower + '-1'];
  for (const v of variants) {
    const hit = files.find((f) => f.toLowerCase().startsWith(v + '.'));
    if (hit) return hit;
  }
  return null;
}

function urlEncodePath(filename) {
  return encodeURIComponent(filename).replace(/%2F/g, '/');
}

// Per-post overrides for posts whose existing og:image is wrong but a known
// per-post image exists on disk under a different filename.
const IMAGE_OVERRIDES = {
  'Data-Is-the-New-Real-Estate-Utility': 'Smart office tower at night.png',
  'The-LLM-Model-Just-Became-a-Commodity': 'The-LLM-Model-Just-Became-a-Commodity-1.jpg',
};

const FULL_REPAIR_SLUGS = [
  'built-to-last-why-smart-infrastructure-is-the-backbone-of-future-proof',
  'monetize-like-amazon-analyze-like-google-and-avoid-tesla-s-data-missteps',
  'not-just-smart-strategic-buildings-built-for-better-tenancy',
  'operational-efficiency-is-the-new-alpha-in-commercial-real-estate',
  'own-the-digital-infrastructure-own-the-leverage',
  'the-ai-model-is-commoditizing-your-owner-data-is-the-real-moat',
  'what-starbucks-taught-us-about-smart-property-ops',
];

const IMAGE_ONLY_SLUGS = Object.keys(IMAGE_OVERRIDES);

function repairFull(slug) {
  const file = join(INSIGHTS_DIR, slug, 'index.html');
  let html = readFileSync(file, 'utf8');

  const title = extractH1(html);
  if (!title) throw new Error(`${slug}: no <h1> to derive title from`);

  const firstP = extractFirstParagraph(html);
  if (!firstP) throw new Error(`${slug}: no body paragraph to derive description from`);
  const description = firstP.length > 280
    ? firstP.slice(0, 277).replace(/\s+\S*$/, '') + '\u2026'
    : firstP;

  const imgFile = findCandidateImage(slug);
  if (!imgFile) throw new Error(`${slug}: no image asset found in /api/media/file/`);
  const imageUrl = `${ABS}/api/media/file/${urlEncodePath(imgFile)}`;

  const titleAttr = escapeAttr(title);
  const descAttr = escapeAttr(description);
  const imageAttr = escapeAttr(imageUrl);

  const replacements = [];
  const apply = (re, repl) => {
    const before = html;
    html = html.replace(re, repl);
    if (html === before) {
      replacements.push({ ok: false, re: re.toString() });
    } else {
      replacements.push({ ok: true, re: re.toString() });
    }
  };

  apply(
    /<title[^>]*>[\s\S]*?<\/title>/i,
    `<title>${titleAttr}</title>`,
  );
  apply(
    /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="description" content="${descAttr}"/>`,
  );
  apply(
    /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:title" content="${titleAttr}"/>`,
  );
  apply(
    /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:description" content="${descAttr}"/>`,
  );
  apply(
    /<meta\s+property=["']og:image["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:image" content="${imageAttr}"/>`,
  );
  apply(
    /<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="twitter:title" content="${titleAttr}"/>`,
  );
  apply(
    /<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="twitter:description" content="${descAttr}"/>`,
  );
  apply(
    /<meta\s+name=["']twitter:image["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="twitter:image" content="${imageAttr}"/>`,
  );

  // JSON-LD Article description (headline is usually already correct, but
  // rewrite both anyway to keep them in sync with <title>/<h1>).
  const jsonTitle = escapeJson(title);
  const jsonDesc = escapeJson(description);
  apply(
    /("@type"\s*:\s*"Article"[^}]*?"headline"\s*:\s*")(?:\\"|[^"])*(")/,
    `$1${jsonTitle}$2`,
  );
  apply(
    /("@type"\s*:\s*"Article"[^}]*?"description"\s*:\s*")(?:\\"|[^"])*(")/,
    `$1${jsonDesc}$2`,
  );

  writeFileSync(file, html, 'utf8');
  return { slug, title, description, imageUrl, replacements };
}

function repairImageOnly(slug) {
  const file = join(INSIGHTS_DIR, slug, 'index.html');
  let html = readFileSync(file, 'utf8');
  const imgFile = IMAGE_OVERRIDES[slug];
  if (!existsSync(join(MEDIA_DIR, imgFile))) {
    throw new Error(`${slug}: override image ${imgFile} does not exist`);
  }
  const imageUrl = `${ABS}/api/media/file/${urlEncodePath(imgFile)}`;
  const imageAttr = escapeAttr(imageUrl);
  const before = html;
  html = html.replace(
    /<meta\s+property=["']og:image["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta property="og:image" content="${imageAttr}"/>`,
  );
  html = html.replace(
    /<meta\s+name=["']twitter:image["']\s+content=["'][^"']*["']\s*\/?>/i,
    `<meta name="twitter:image" content="${imageAttr}"/>`,
  );
  // Also fix the JSON-LD Article image if present.
  html = html.replace(
    /("@type"\s*:\s*"Article"[^}]*?"image"\s*:\s*")(?:\\"|[^"])*(")/,
    `$1${escapeJson(imageUrl)}$2`,
  );
  if (html === before) {
    throw new Error(`${slug}: no image meta tags matched for override`);
  }
  writeFileSync(file, html, 'utf8');
  return { slug, imageUrl };
}

function main() {
  console.log('Full repair (title + excerpt + image):');
  for (const slug of FULL_REPAIR_SLUGS) {
    const r = repairFull(slug);
    const failed = r.replacements.filter((x) => !x.ok);
    console.log(`  \u2713 ${slug}`);
    console.log(`     title:       ${r.title}`);
    console.log(`     description: ${r.description.slice(0, 90)}${r.description.length > 90 ? '\u2026' : ''}`);
    console.log(`     image:       ${r.imageUrl}`);
    if (failed.length) {
      console.log(`     warnings: ${failed.length} regex(es) did not match`);
      for (const f of failed) console.log(`       - ${f.re}`);
    }
  }
  console.log('');
  console.log('Image-only repair:');
  for (const slug of IMAGE_ONLY_SLUGS) {
    const r = repairImageOnly(slug);
    console.log(`  \u2713 ${slug} \u2192 ${r.imageUrl}`);
  }
}

main();
