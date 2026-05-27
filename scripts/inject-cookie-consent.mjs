#!/usr/bin/env node
/**
 * inject-cookie-consent.mjs
 *
 * Injects cookie-consent.css + cookie-consent.js into all HTML files,
 * and adds a "Cookie Preferences" link to footers.
 *
 * Run from repo root:  node scripts/inject-cookie-consent.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const ROOT = decodeURIComponent(new URL('..', import.meta.url).pathname).replace(/\/$/, '')

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'scripts', 'opticwise-mcp-bundle'].includes(entry.name)) continue
      files.push(...(await walk(full)))
    } else if (entry.name.endsWith('.html')) {
      files.push(full)
    }
  }
  return files
}

const CONSENT_TAGS = `<link rel="stylesheet" href="/cookie-consent.css"/>\n<script src="/cookie-consent.js"></script>`

const files = await walk(ROOT)
let injected = 0
let footerUpdated = 0

for (const file of files) {
  let html = await readFile(file, 'utf-8')
  let changed = false
  const rel = relative(ROOT, file)

  // 1. Inject consent CSS + JS before site.js (if not already present)
  if (!html.includes('cookie-consent.js')) {
    // Insert before the site.js script tag
    const siteJsPattern = '<script src="/site.js" defer></script>'
    if (html.includes(siteJsPattern)) {
      html = html.replace(
        siteJsPattern,
        CONSENT_TAGS + '\n' + siteJsPattern
      )
      changed = true
      injected++
    }
  }

  // 2. Add "Cookie Preferences" link to footer (if not already present)
  if (!html.includes('Cookie Preferences') && !html.includes('cookie-preferences')) {
    // Pattern A: marketing pages with Privacy Policy · Terms of Use
    const footerPattern1 = /(<a[^>]*href="\/terms\/"[^>]*>Terms of Use<\/a>)/
    // Pattern B: blog posts with only "© 2026 OpticWise. All rights reserved."
    const footerPattern2 = /(© (?:<!-- -->)?2026(?:<!-- -->)? OpticWise\. All rights reserved\.)/

    if (footerPattern1.test(html)) {
      html = html.replace(
        footerPattern1,
        '$1 · <a class="hover:text-white transition-colors" href="#" data-ow-cookie-prefs>Cookie Preferences</a>'
      )
      changed = true
      footerUpdated++
    } else if (footerPattern2.test(html)) {
      html = html.replace(
        footerPattern2,
        '$1 · <a class="hover:text-white transition-colors" href="/privacy/">Privacy Policy</a> · <a class="hover:text-white transition-colors" href="/terms/">Terms of Use</a> · <a class="hover:text-white transition-colors" href="#" data-ow-cookie-prefs>Cookie Preferences</a>'
      )
      changed = true
      footerUpdated++
    }
  }

  if (changed) {
    await writeFile(file, html, 'utf-8')
  }
}

console.log(`Done. Injected consent tags into ${injected} files, updated footer in ${footerUpdated} files.`)
