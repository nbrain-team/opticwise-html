#!/usr/bin/env node
/**
 * Insert "Accessibility" link into footer legal line on all HTML pages.
 *
 * Before: …Terms of Use</a> · <a …>Cookie Policy</a>…
 * After:  …Terms of Use</a> · <a …>Accessibility</a> · <a …>Cookie Policy</a>…
 *
 * Run: node scripts/add-accessibility-footer-link.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = decodeURIComponent(new URL('..', import.meta.url).pathname).replace(/\/$/, '');

function walk(dir, ext) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules' && entry !== 'opticwise-mcp-bundle') {
      results.push(...walk(full, ext));
    } else if (st.isFile() && full.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

const FIND = /(<a[^>]*href="[^"]*\/terms\/"[^>]*>Terms of Use<\/a>) · (<a[^>]*href="[^"]*\/cookie-policy\/")/g;

const htmlFiles = walk(ROOT, '.html');
let changed = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  if (!FIND.test(html)) continue;
  FIND.lastIndex = 0;

  const depth = relative(ROOT, file).split('/').length - 1;
  const prefix = depth > 0 ? '../'.repeat(depth) : './';
  const accessibilityHref = prefix + 'accessibility/';

  const updated = html.replace(FIND, `$1 · <a class="hover:text-white transition-colors" href="${accessibilityHref}">Accessibility</a> · $2`);

  if (updated !== html) {
    writeFileSync(file, updated, 'utf8');
    changed++;
  }
}

console.log(`Done. Updated ${changed} files.`);
