#!/usr/bin/env node
/* regenerate-sitemap.mjs — walk the filesystem and emit a fresh sitemap.xml.
 *
 * Sources: every directory containing an index.html, excluding node_modules,
 * api, _next, .audit, and any dotfiles.
 *
 * Each <url> entry:
 *   <loc>          — absolute production URL with trailing slash
 *   <lastmod>      — ISO timestamp of the last git commit touching the file
 *                    (falls back to file mtime if git unavailable)
 *   <changefreq>   — heuristic: home/pillar=weekly, audience=monthly,
 *                    insights/glossary/faq=weekly
 *   <priority>     — heuristic: home=1.0, pillar=0.9, audience=0.8, blog=0.6
 *
 * Idempotent. Safe to run on every deploy.
 *
 * Usage:
 *   node .audit/regenerate-sitemap.mjs           # writes sitemap.xml
 *   node .audit/regenerate-sitemap.mjs --check   # prints to stdout, no write
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PROD_ORIGIN = 'https://www.opticwise.com';

const EXCLUDED = new Set(['node_modules', '_next', 'api', '.audit', '.git', 'terminals']);

function listIndexHtml(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (EXCLUDED.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listIndexHtml(full));
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
}

function urlForFile(absPath) {
  const rel = path.relative(ROOT, absPath).split(path.sep).join('/');
  if (rel === 'index.html') return PROD_ORIGIN + '/';
  if (rel.endsWith('/index.html')) {
    return PROD_ORIGIN + '/' + rel.slice(0, -'index.html'.length);
  }
  return PROD_ORIGIN + '/' + rel;
}

function lastModFor(absPath) {
  // Prefer last git commit time touching this file. Falls back to file mtime
  // if the file has never been committed (e.g. untracked work in progress).
  try {
    const out = execSync(`git log -1 --format=%cI -- "${absPath}"`, {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    if (out) return out;
  } catch {}
  const stat = fs.statSync(absPath);
  return stat.mtime.toISOString();
}

function classify(url) {
  const p = url.replace(PROD_ORIGIN, '');
  if (p === '/') return { changefreq: 'weekly', priority: 1.0 };
  if (p.startsWith('/insights/') && p !== '/insights/') {
    return { changefreq: 'monthly', priority: 0.6 };
  }
  if (p === '/insights/') return { changefreq: 'weekly', priority: 0.8 };
  if (p === '/faq/' || p === '/glossary/' || p === '/contact/' || p === '/about/') {
    return { changefreq: 'weekly', priority: 0.7 };
  }
  if (p.startsWith('/for-')) return { changefreq: 'monthly', priority: 0.7 };
  // Pillars and solutions (everything else)
  return { changefreq: 'weekly', priority: 0.9 };
}

function buildSitemap() {
  const files = listIndexHtml(ROOT).sort();
  const urls = files.map((f) => {
    const loc = urlForFile(f);
    const { changefreq, priority } = classify(loc);
    return { loc, lastmod: lastModFor(f), changefreq, priority };
  });

  // De-dupe: should be unique by directory, but guard anyway.
  const seen = new Set();
  const unique = urls.filter((u) => {
    if (seen.has(u.loc)) return false;
    seen.add(u.loc);
    return true;
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...unique.map((u) =>
      [
        '  <url>',
        `    <loc>${u.loc}</loc>`,
        `    <lastmod>${u.lastmod}</lastmod>`,
        `    <changefreq>${u.changefreq}</changefreq>`,
        `    <priority>${u.priority.toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n');

  return { xml, count: unique.length };
}

const checkOnly = process.argv.includes('--check');
const { xml, count } = buildSitemap();

if (checkOnly) {
  process.stdout.write(xml);
} else {
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
  console.log(`✓ wrote sitemap.xml (${count} URLs)`);
}
