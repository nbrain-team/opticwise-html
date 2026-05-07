#!/usr/bin/env node
/**
 * Idempotent injector for the OpticWise FormEmbed assets.
 *
 * For every public page that contains a "Schedule Review" / "Schedule Your
 * Review" trigger (button OR text), inject:
 *   <link rel="stylesheet" href="<rel>forms-embed.css?v=N">
 *   <script src="<rel>forms-embed.js?v=N" defer></script>
 *
 * Runs from the workspace root. Skips files that already have the assets.
 *
 * Usage:
 *   node .audit/inject-form-embed.mjs           # dry run if --check is passed
 *   node .audit/inject-form-embed.mjs --check   # report only, no writes
 *   node .audit/inject-form-embed.mjs --version=2  # bump cache-bust query
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, posix } from 'node:path';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');

const args = new Map(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    return m ? [m[1], m[2] ?? 'true'] : [a, 'true'];
  })
);
const DRY_RUN = args.has('check');
const VERSION = args.get('version') || '1';

const CSS_FILE = 'forms-embed.css';
const JS_FILE = 'forms-embed.js';

// Locate every index.html under the workspace, excluding node_modules,
// .next caches, and any audit work-dirs.
function listHtmlFiles() {
  // git ls-files is ~free and respects .gitignore. Fall back to a manual
  // walk if we're outside a git repo.
  try {
    const out = execSync('git ls-files "*.html"', {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    return out
      .split(/\r?\n/)
      .filter((p) => p && p.endsWith('index.html'));
  } catch {
    // Fallback walk — rarely hit; the workspace is a git repo.
    return walkHtml(ROOT, ROOT);
  }
}

function walkHtml(dir, root) {
  const { readdirSync } = require('node:fs');
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkHtml(full, root));
    } else if (entry.name === 'index.html') {
      out.push(relative(root, full));
    }
  }
  return out;
}

const TRIGGER_RE = /Schedule\s+(?:Your\s+)?Review/i;

function relPathToRoot(htmlRelPath) {
  // htmlRelPath is workspace-relative, posix-style. Compute the depth.
  const segments = htmlRelPath.split('/').filter(Boolean);
  // The file itself is the last segment; the directory chain above it is
  // (segments.length - 1) deep relative to the workspace root.
  const depth = Math.max(0, segments.length - 1);
  return depth === 0 ? './' : '../'.repeat(depth);
}

function alreadyInjected(html) {
  return html.includes('forms-embed.js');
}

function buildInjection(prefix) {
  const css = `<link rel="stylesheet" href="${prefix}${CSS_FILE}?v=${VERSION}" data-ow-form-embed="css"/>`;
  const js = `<script src="${prefix}${JS_FILE}?v=${VERSION}" defer data-ow-form-embed="js"></script>`;
  return `${css}${js}`;
}

function inject(html, prefix) {
  const tag = buildInjection(prefix);
  // Insert just before the closing </body>. The site uses lowercase tags;
  // be defensive and accept any casing/whitespace.
  const m = html.match(/<\/body>/i);
  if (!m) {
    throw new Error('No </body> tag found');
  }
  const idx = m.index;
  return html.slice(0, idx) + tag + html.slice(idx);
}

function main() {
  const all = listHtmlFiles();
  let scanned = 0;
  let qualified = 0;
  let injected = 0;
  let skipped = 0;
  const sample = [];

  for (const rel of all) {
    scanned++;
    const full = resolve(ROOT, rel);
    let html;
    try {
      html = readFileSync(full, 'utf8');
    } catch (e) {
      continue;
    }

    if (!TRIGGER_RE.test(html)) { continue; }
    qualified++;

    if (alreadyInjected(html)) {
      skipped++;
      continue;
    }

    const prefix = relPathToRoot(rel);
    let next;
    try {
      next = inject(html, prefix);
    } catch (e) {
      console.warn(`SKIP ${rel}: ${e.message}`);
      continue;
    }

    if (!DRY_RUN) {
      writeFileSync(full, next);
    }
    injected++;
    if (sample.length < 6) { sample.push(rel); }
  }

  console.log(JSON.stringify({
    scanned,
    qualified,
    injected,
    skipped_already_present: skipped,
    dry_run: DRY_RUN,
    version: VERSION,
    sample_injected: sample,
  }, null, 2));
}

main();
