#!/usr/bin/env node
/**
 * WCAG 2.1 AA — batch HTML fixes
 *
 * 1. Remove premature </html> tags from 9 broken Insight files
 * 2. Add <main> landmark wrapper to pages that lack one
 *
 * Run: node scripts/wcag-html-fixes.mjs
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

const htmlFiles = walk(ROOT, '.html');
let fixedPremature = 0;
let addedMain = 0;

for (const file of htmlFiles) {
  let html = readFileSync(file, 'utf8');
  let changed = false;
  const rel = relative(ROOT, file);

  // Fix 1: Remove premature </html> that appears before the real end.
  // Pattern: </html> appears before </body></html> at the real end.
  const endPattern = '</body></html>';
  const htmlCloseCount = (html.match(/<\/html>/g) || []).length;
  if (htmlCloseCount > 1) {
    // Remove all </html> except the final one (which follows </body>)
    const lastIdx = html.lastIndexOf('</html>');
    let result = '';
    let searchFrom = 0;
    let idx;
    while ((idx = html.indexOf('</html>', searchFrom)) !== -1) {
      if (idx === lastIdx) {
        result += html.slice(searchFrom);
        break;
      }
      result += html.slice(searchFrom, idx);
      searchFrom = idx + '</html>'.length;
    }
    if (result !== html) {
      html = result;
      changed = true;
      fixedPremature++;
      console.log(`  Fixed premature </html>: ${rel}`);
    }
  }

  // Fix 2: Add <main> if missing.
  // Skip the insights listing (index.html at root of insights/) and files
  // that already have <main>.
  if (!html.includes('<main>') && !html.includes('<main ')) {
    // Strategy: insert <main> after the closing </nav> wrapper (</div></nav>)
    // and </main> before <footer
    const navCloseIdx = html.indexOf('</nav>');
    const footerIdx = html.indexOf('<footer');

    if (navCloseIdx !== -1 && footerIdx !== -1 && footerIdx > navCloseIdx) {
      const insertMainOpen = navCloseIdx + '</nav>'.length;
      const insertMainClose = footerIdx;

      html = html.slice(0, insertMainOpen) +
             '<main>' +
             html.slice(insertMainOpen, insertMainClose) +
             '</main>' +
             html.slice(insertMainClose);
      changed = true;
      addedMain++;
    }
  }

  if (changed) {
    writeFileSync(file, html, 'utf8');
  }
}

console.log(`\nDone. Fixed ${fixedPremature} premature </html> tags, added <main> to ${addedMain} pages.`);
