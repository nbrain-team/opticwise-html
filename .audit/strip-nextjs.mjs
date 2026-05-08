#!/usr/bin/env node
/* strip-nextjs.mjs — remove Next.js scaffolding from a static export so the
 * resulting HTML is plain, hand-editable, deploy-anywhere static markup.
 *
 * What it strips:
 *   - All _next/static/chunks/*.js script tags (page chunks, polyfills, webpack runtime)
 *   - The bundled CSS link (gets replaced with our own /styles.css)
 *   - All `self.__next_f.push(...)` Flight chunk scripts
 *   - The `<script>$RB=[]; $RV=function(...){}</script>` Suspense reconciler
 *   - `<script>requestAnimationFrame(function(){$RT=performance.now()});</script>`
 *   - `<script>document.querySelectorAll('body link[rel="icon"]...).forEach(...)</script>`
 *   - `<div hidden><!--$?--><template id="B:N"></template><!--/$--></div>` Suspense placeholders
 *   - Bare `<!--$?-->` / `<!--/$-->` / `<template id="B:N"></template>` / `<div hidden id="S:N"></div>` markers
 *   - `<link rel="preload" as="script" ... href=".../_next/...">`
 *
 * What it hoists from <body> to <head>:
 *   - <title>
 *   - <meta name="...">, <meta property="...">
 *   - <link rel="canonical|icon|apple-touch-icon|...">
 *   (Next.js wrote those into <body>; we put them where they belong.)
 *
 * What it normalizes:
 *   - <link rel="canonical"> → absolute production URL based on file path
 *   - All injected asset paths use ABSOLUTE roots (/styles.css, /site.js)
 *     so they work regardless of the page's directory depth.
 *
 * What it injects in <head>:
 *   <link rel="stylesheet" href="/styles.css">
 *   <link rel="stylesheet" href="/site.css">
 *   <link rel="stylesheet" href="/forms-embed.css">
 *   <script src="/site.js" defer></script>
 *   <script src="/forms-embed.js" defer></script>
 *
 * Idempotent: running twice produces the same output. Safe to re-run.
 *
 * Usage:
 *   node .audit/strip-nextjs.mjs <file-or-dir> [more files...]
 *   node .audit/strip-nextjs.mjs --all       # process every index.html in tree
 *   node .audit/strip-nextjs.mjs --check     # report what would change, don't write
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const PROD_ORIGIN = 'https://www.opticwise.com';

const INJECTED_HEAD_ASSETS = [
  '<link rel="stylesheet" href="/styles.css"/>',
  '<link rel="stylesheet" href="/site.css"/>',
  '<link rel="stylesheet" href="/forms-embed.css"/>',
  '<script src="/site.js" defer></script>',
  '<script src="/forms-embed.js" defer></script>',
];
const INJECTED_MARKER = '<!-- ow:strip-nextjs:assets -->';

/* ── HTML manipulation helpers ─────────────────────────────────────────── */

/** Remove every match of a pattern, return [newHtml, removedCount]. */
function strip(html, pattern) {
  let count = 0;
  const out = html.replace(pattern, () => { count++; return ''; });
  return [out, count];
}

/** Walk all top-level head/body tags after `<head>` open / before `</body>`. */
function getRange(html, openTag, closeTag) {
  const open = html.indexOf(openTag);
  if (open === -1) return null;
  const afterOpen = html.indexOf('>', open) + 1;
  const close = html.indexOf(closeTag, afterOpen);
  if (close === -1) return null;
  return { afterOpen, close, content: html.slice(afterOpen, close) };
}

/** Compute the production canonical URL from the workspace-relative path.
 *  about/index.html   → https://www.opticwise.com/about/
 *  index.html         → https://www.opticwise.com/
 *  insights/foo/index.html → https://www.opticwise.com/insights/foo/
 */
function canonicalUrlFor(absPath) {
  const rel = path.relative(ROOT, absPath).split(path.sep).join('/');
  if (rel === 'index.html') return PROD_ORIGIN + '/';
  if (rel.endsWith('/index.html')) {
    return PROD_ORIGIN + '/' + rel.slice(0, -'index.html'.length);
  }
  return PROD_ORIGIN + '/' + rel;
}

/* ── Strip + transform pipeline ────────────────────────────────────────── */

function stripPage(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const before = html.length;
  const stats = {};

  // 1. _next/static/chunks script tags (any depth of `../` or `./`)
  [html, stats.chunkScripts] = strip(
    html,
    /<script[^>]*src="[^"]*_next\/static\/chunks\/[^"]+"[^>]*>\s*<\/script>/g,
  );

  // 2. Polyfill loader (noModule attr is a tell)
  [html, stats.polyfillScripts] = strip(
    html,
    /<script[^>]*src="[^"]*_next\/static\/chunks\/polyfills-[^"]+"[^>]*>\s*<\/script>/g,
  );

  // 3. Webpack runtime preload
  [html, stats.preloadScripts] = strip(
    html,
    /<link\s+rel="preload"\s+as="script"[^>]*href="[^"]*_next\/[^"]+"[^>]*\/?>/g,
  );

  // 4. Bundled CSS link (we replace with /styles.css later)
  [html, stats.bundleCss] = strip(
    html,
    /<link\s+rel="stylesheet"\s+href="[^"]*_next\/static\/css\/[^"]+"[^>]*\/?>/g,
  );

  // 5. Flight chunks: <script>self.__next_f.push([1,"..."])</script>
  //    Use a non-greedy match for the body up to the closing </script>.
  [html, stats.flightChunks] = strip(
    html,
    /<script>\s*self\.__next_f\.push\(\[1,[^<]*?\]\)\s*<\/script>/g,
  );

  // 6. Flight init: <script>(self.__next_f=self.__next_f||[]).push([0])</script>
  [html, stats.flightInit] = strip(
    html,
    /<script>\(self\.__next_f=self\.__next_f\|\|\[\]\)\.push\(\[0\]\)<\/script>/g,
  );

  // 7. Suspense reconciler: <script>$RB=[];$RV=function(b){...};$RC=...</script>
  //    Must use [\s\S] (not [^<]) because the JS body contains `<` operators
  //    like `a<b.length`. Match everything from `<script>$R` to first `</script>`.
  [html, stats.reconciler] = strip(
    html,
    /<script>\s*\$R[A-Z][\s\S]*?<\/script>/g,
  );

  // 8. Performance timing: <script>requestAnimationFrame(function(){$RT=performance.now()});</script>
  [html, stats.rafTiming] = strip(
    html,
    /<script>\s*requestAnimationFrame\(function\(\)\{\$RT=[\s\S]*?<\/script>/g,
  );

  // 9. Icon-hoister script (we'll place icons in <head> directly so this is moot)
  [html, stats.iconHoist] = strip(
    html,
    /<script[^>]*>\s*document\.querySelectorAll\('body link\[rel="icon"\][\s\S]*?<\/script>/g,
  );

  // 9b. Old forms-embed asset tags (from a prior injection attempt) — clean
  //     them up so we don't end up with two copies after we re-inject below.
  [html, stats.oldFormsEmbedCss] = strip(
    html,
    /<link\s+rel="stylesheet"\s+href="[^"]*forms-embed\.css[^"]*"\s+data-ow-form-embed="css"\s*\/?>/g,
  );
  [html, stats.oldFormsEmbedJs] = strip(
    html,
    /<script\s+src="[^"]*forms-embed\.js[^"]*"\s+defer\s+data-ow-form-embed="js"><\/script>/g,
  );

  // 10. Suspense placeholder boundaries: <div hidden><!--$?--><template id="B:N"></template><!--/$--></div>
  [html, stats.suspensePlaceholders] = strip(
    html,
    /<div\s+hidden(?:="")?\s*><!--\$\?--><template[^<]*<\/template><!--\/\$--><\/div>/g,
  );

  // 11. Standalone Suspense fallback divs: <div hidden id="S:N"></div>
  [html, stats.suspenseFallbacks] = strip(
    html,
    /<div\s+hidden\s+id="S:\d+"><\/div>/g,
  );

  // 12. Bare Suspense comment markers anywhere in document
  [html, stats.suspenseComments] = strip(html, /<!--\$\?-->|<!--\/\$-->/g);
  [html, stats.suspenseTemplates] = strip(
    html,
    /<template\s+id="B:\d+"><\/template>/g,
  );

  // 13. Strip "data-precedence" attribute residue on any remaining <link>
  //     (it's a Next.js style-precedence marker, harmless but noisy).
  html = html.replace(/\s+data-precedence="next"/g, '');

  // 14. Hoist tags that Next.js wrote into <body> back into <head>.
  const result = hoistHeadTagsToHead(html);
  html = result.html;
  stats.hoisted = result.hoisted;

  // 15. Fix canonical URL → absolute prod URL. If no canonical link exists in
  //     the source (a handful of pages were exported without one), inject it.
  const canonical = canonicalUrlFor(filePath);
  if (/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/.test(html)) {
    html = html.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/g,
      `<link rel="canonical" href="${canonical}"/>`,
    );
  } else {
    // Inject before </head>; placed near the other metadata.
    html = html.replace('</head>', `<link rel="canonical" href="${canonical}"/></head>`);
    stats.canonicalInjected = 1;
  }
  // Same treatment for og:url so OG cards point at the canonical URL.
  if (/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/.test(html)) {
    html = html.replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/g,
      `<meta property="og:url" content="${canonical}"/>`,
    );
  } else {
    html = html.replace('</head>', `<meta property="og:url" content="${canonical}"/></head>`);
    stats.ogUrlInjected = 1;
  }

  // 16. Normalize favicon paths to absolute roots (they were relative). Use
  //     strict `(?:\.\.?\/)+` so we only match relative-prefixed forms and
  //     don't double-rewrite already-normalized hrefs (e.g. `/favicon.png`
  //     would otherwise match the broader `icon.png` rule).
  html = html
    .replace(/<link\s+rel="icon"\s+href="(?:\.\.?\/)+favicon\.ico"/g, '<link rel="icon" href="/favicon.ico"')
    .replace(/<link\s+rel="icon"\s+href="(?:\.\.?\/)+favicon\.png"/g, '<link rel="icon" href="/favicon.png"')
    .replace(/<link\s+rel="icon"\s+href="(?:\.\.?\/)+icon\.png"/g, '<link rel="icon" href="/icon.png"')
    .replace(/<link\s+rel="apple-touch-icon"\s+href="(?:\.\.?\/)+apple-touch-icon\.png"/g, '<link rel="apple-touch-icon" href="/apple-touch-icon.png"');

  // 17. Inject our assets at end of <head>, idempotent.
  if (!html.includes(INJECTED_MARKER)) {
    const headClose = '</head>';
    const idx = html.indexOf(headClose);
    if (idx !== -1) {
      const block = '\n' + INJECTED_MARKER + '\n' + INJECTED_HEAD_ASSETS.join('\n') + '\n';
      html = html.slice(0, idx) + block + html.slice(idx);
    }
  }

  // 18. Collapse runs of blank lines created by stripping.
  html = html.replace(/\n{3,}/g, '\n\n');

  const after = html.length;
  return { html, before, after, stats };
}

/** Move <title>, <meta>, <link rel="canonical|icon|apple-touch-icon|...">
 *  found in <body> into the end of <head>. Skips tags already in <head>.
 *  Returns { html, hoisted: count }. */
function hoistHeadTagsToHead(html) {
  const headRange = getRange(html, '<head', '</head>');
  if (!headRange) return { html, hoisted: 0 };
  const bodyRange = getRange(html, '<body', '</body>');
  if (!bodyRange) return { html, hoisted: 0 };

  // Capture self-closing tags in body that belong in head.
  const HOIST_PATTERN = /<(title|meta|link)\s[^>]*?\/?>(?:[\s\S]*?<\/\1>)?/g;
  // We only want to hoist meta/link/title that look like document-level metadata,
  // NOT meta tags inside open-graph script blocks or stylesheets that legitimately
  // load on the page. Strategy: scan <body>'s direct text (before any visible
  // content node like <nav>/<main>/<footer>) and after the last </script> we kept.
  // Simpler: just hoist any <title>, <meta name=...>, <meta property=...>,
  // <link rel="canonical|icon|apple-touch-icon|preconnect"> we find anywhere in body.

  const hoistRules = [
    /<title>[^<]*<\/title>/g,
    /<meta\s+(?:name|property|charset|http-equiv)="[^"]*"[^>]*\/?>/gi,
    /<link\s+rel="(?:canonical|icon|apple-touch-icon|manifest|alternate)"[^>]*\/?>/gi,
  ];

  // Existing head <title>, to dedupe.
  const headTitleMatch = headRange.content.match(/<title>[^<]*<\/title>/);
  const headHasTitle = !!headTitleMatch;

  let bodyContent = bodyRange.content;
  const hoisted = [];

  for (const rule of hoistRules) {
    bodyContent = bodyContent.replace(rule, (m) => {
      // Dedupe titles: if head already has one, drop the body one.
      if (m.startsWith('<title>') && headHasTitle) return '';
      // Dedupe charset/viewport meta if head already has them.
      if (/<meta\s+charset/i.test(m) && /<meta\s+charset/i.test(headRange.content)) return '';
      if (/name="viewport"/i.test(m) && /name="viewport"/i.test(headRange.content)) return '';
      hoisted.push(m);
      return '';
    });
  }

  if (hoisted.length === 0) return { html, hoisted: 0 };

  // Rebuild html: original head content + hoisted tags inserted just before </head>.
  // Body content gets the body-side tags removed.
  const newHead = headRange.content + '\n' + hoisted.join('') + '\n';
  const newBody = bodyContent;

  const outHtml =
    html.slice(0, headRange.afterOpen) +
    newHead +
    html.slice(headRange.close, bodyRange.afterOpen) +
    newBody +
    html.slice(bodyRange.close);

  return { html: outHtml, hoisted: hoisted.length };
}

/* ── CLI ──────────────────────────────────────────────────────────────── */

function listAllIndexHtml(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.name === 'node_modules' || entry.name === '_next' || entry.name === 'api') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listAllIndexHtml(full));
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
}

function fmt(n) { return n.toLocaleString(); }

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const all = args.includes('--all');
const targets = all
  ? listAllIndexHtml(ROOT)
  : args.filter((a) => !a.startsWith('--')).map((a) => path.resolve(a));

if (targets.length === 0) {
  console.error('Usage: node .audit/strip-nextjs.mjs <files...> | --all [--check]');
  process.exit(2);
}

let totalBefore = 0, totalAfter = 0;
for (const file of targets) {
  if (!fs.existsSync(file)) {
    console.error('  ✗ ' + path.relative(ROOT, file) + ' (not found)');
    continue;
  }
  const { html, before, after, stats } = stripPage(file);
  totalBefore += before;
  totalAfter += after;
  if (!checkOnly) fs.writeFileSync(file, html);
  const rel = path.relative(ROOT, file);
  const stripped = Object.entries(stats)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  const delta = ((before - after) / 1024).toFixed(1);
  console.log(`  ${checkOnly ? '✓ would strip' : '✓ stripped'} ${rel}  -${delta} KB  (${stripped || 'no-op'})`);
}
console.log(
  `\nTotal: ${targets.length} files, ${fmt(totalBefore)} → ${fmt(totalAfter)} bytes ` +
    `(saved ${fmt(totalBefore - totalAfter)} bytes / ${((totalBefore - totalAfter) / 1024).toFixed(1)} KB)`,
);
