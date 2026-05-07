#!/usr/bin/env node
/**
 * Reverse the form-embed injection performed by inject-form-embed.mjs.
 *
 * Removes the <link data-ow-form-embed="css"> and
 * <script data-ow-form-embed="js"> tags this project added in front of
 * </body>. Idempotent.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');

function listHtmlFiles() {
  try {
    const out = execSync('git ls-files "*.html"', {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    return out.split(/\r?\n/).filter((p) => p && p.endsWith('index.html'));
  } catch {
    return [];
  }
}

const TAGS_RE =
  /<link\s+rel="stylesheet"\s+href="[^"]*forms-embed\.css\?[^"]*"\s+data-ow-form-embed="css"\s*\/?>\s*<script\s+src="[^"]*forms-embed\.js\?[^"]*"\s+defer\s+data-ow-form-embed="js"><\/script>/g;

let scanned = 0,
  cleaned = 0;
const sample = [];

for (const rel of listHtmlFiles()) {
  scanned++;
  const full = resolve(ROOT, rel);
  let html;
  try {
    html = readFileSync(full, 'utf8');
  } catch {
    continue;
  }
  if (!TAGS_RE.test(html)) {
    TAGS_RE.lastIndex = 0;
    continue;
  }
  TAGS_RE.lastIndex = 0;
  const next = html.replace(TAGS_RE, '');
  if (next !== html) {
    writeFileSync(full, next);
    cleaned++;
    if (sample.length < 6) sample.push(rel);
  }
}

console.log(JSON.stringify({ scanned, cleaned, sample }, null, 2));
