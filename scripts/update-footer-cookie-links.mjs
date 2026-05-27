import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = decodeURIComponent(new URL('..', import.meta.url).pathname).replace(/\/$/, '');
const SKIP = ['.git', 'node_modules', 'scripts', '.audit'];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    if (SKIP.includes(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) files.push(...await walk(full));
    else if (e.name.endsWith('.html')) files.push(full);
  }
  return files;
}

let updated = 0;
let skipped = 0;

const files = await walk(ROOT);
for (const f of files) {
  let html = await readFile(f, 'utf8');
  let changed = false;

  // Pattern 1: Pages that already have Cookie Preferences but no Cookie Policy link
  // These have: Privacy Policy · Terms of Use · Cookie Preferences (data-ow-cookie-prefs)
  // Update to: Privacy Policy · Terms of Use · Cookie Policy · Cookie Settings

  // Skip files already updated (have cookie-policy link)
  if (html.includes('/cookie-policy/')) {
    skipped++;
    continue;
  }

  // Pattern A: Marketing pages footer pattern
  // "Cookie Preferences</a></p>" with data-ow-cookie-prefs
  const patA = /(<a[^>]*href="\/terms\/"[^>]*>Terms of Use<\/a>)\s*·\s*(<a[^>]*href="#"[^>]*data-ow-cookie-prefs[^>]*>)Cookie Preferences(<\/a>)/g;
  if (patA.test(html)) {
    html = html.replace(patA, '$1 · <a class="hover:text-white transition-colors" href="/cookie-policy/">Cookie Policy</a> · $2Cookie Settings$3');
    changed = true;
  }

  // Pattern B: Blog posts with different footer structure
  // Some blog posts have: Privacy Policy</a> · <a ... href="/terms/">Terms of Use</a> · <a ... data-ow-cookie-prefs>Cookie Preferences</a>
  if (!changed) {
    const patB = /(<a[^>]*href="\/terms\/"[^>]*>Terms of Use<\/a>)\s*·\s*(<a[^>]*data-ow-cookie-prefs[^>]*>)Cookie Preferences(<\/a>)/g;
    if (patB.test(html)) {
      html = html.replace(patB, '$1 · <a class="hover:text-white transition-colors" href="/cookie-policy/">Cookie Policy</a> · $2Cookie Settings$3');
      changed = true;
    }
  }

  // Fallback: just rename "Cookie Preferences" to "Cookie Settings" if still present
  if (!changed && html.includes('data-ow-cookie-prefs') && html.includes('Cookie Preferences')) {
    html = html.replace(/>Cookie Preferences</g, '>Cookie Settings<');
    // Insert Cookie Policy link before Cookie Settings
    html = html.replace(
      /(<a[^>]*data-ow-cookie-prefs[^>]*>Cookie Settings<\/a>)/g,
      '<a class="hover:text-white transition-colors" href="/cookie-policy/">Cookie Policy</a> · $1'
    );
    changed = true;
  }

  if (changed) {
    await writeFile(f, html, 'utf8');
    updated++;
  } else {
    skipped++;
  }
}

console.log(`Updated: ${updated}, Skipped: ${skipped}, Total: ${files.length}`);
