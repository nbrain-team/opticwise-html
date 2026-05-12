#!/usr/bin/env node
/*
 * Ping IndexNow (Bing, Yandex, Naver, Seznam, ...) after deploy so search
 * engines refresh indexed URLs sooner than crawl-only discovery.
 *
 * Prerequisites (IndexNow protocol):
 *   - A verification file at https://www.opticwise.com/{key}.txt whose body
 *     is ONLY the raw key string (committed at repo root).
 *
 * Behaviour:
 *   - Reads URLs from ./sitemap.xml (<loc>...</loc>).
 *   - Optionally waits until the verification file is reachable on the live
 *     site (Render publishes *after* this build finishes, so retries cover
 *     propagation and the chicken-and-egg of the very first deploy).
 *   - POSTs batches to https://api.indexnow.org/IndexNow
 *
 * Env:
 *   INDEXNOW_KEY           — overrides auto-discovery of repo-root {key}.txt
 *   INDEXNOW_HOST          — default www.opticwise.com
 *   INDEXNOW_SITE_ORIGIN    — default https://www.opticwise.com
 *   INDEXNOW_SKIP=1       — noop (exit 0)
 *   INDEXNOW_DRY_RUN=1   — parse sitemap + key only; skip verify POST
 *   INDEXNOW_BATCH=9000    — max URLs per request (protocol max 10000)
 *   INDEXNOW_VERIFY_RETRIES — default 24 (attempts before giving up verify GET)
 *   INDEXNOW_VERIFY_DELAY_MS — default 15000 ms between retries
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const HOST =
  process.env.INDEXNOW_HOST?.trim()?.replace(/^https?:\/\//, '') ||
  'www.opticwise.com';
const SITE_ORIGIN = (
  process.env.INDEXNOW_SITE_ORIGIN || `https://${HOST}`
).replace(/\/$/, '');

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function discoverKeyFromRoot() {
  const envKey = process.env.INDEXNOW_KEY?.trim();
  if (envKey) return envKey;

  const files = readdirSync(ROOT);
  /* IndexNow keys: 8–128 chars [a-zA-Z0-9-]; we generated 32 hex chars */
  const re = /^[a-fA-F0-9]{32}\.txt$/;
  const candidates = files.filter((f) => re.test(f));
  if (candidates.length === 0)
    throw new Error(
      'No INDEXNOW_KEY env and no 32-char-hex *.txt verification file at repo root.'
    );
  if (candidates.length > 1)
    throw new Error(
      `Multiple candidate IndexNow key files (${candidates.join(', ')}). Set INDEXNOW_KEY.`
    );

  const name = candidates[0];
  const key = name.replace(/\.txt$/, '');
  const body = readFileSync(resolve(ROOT, name), 'utf8').trim();
  if (body !== key)
    throw new Error(
      `${name}: expected file contents to equal the filename stem (the key)`
    );
  return key;
}

function parseUrlsFromSitemap(xml) {
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const seen = new Set();
  const out = [];
  for (const u of urls) {
    if (!/^https:\/\/www\.opticwise\.com\//i.test(u)) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

async function verifyKeyHosted(key, maxAttempts, pauseMs) {
  const verifyUrl = `${SITE_ORIGIN}/${key}.txt`;
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const res = await fetch(verifyUrl, {
        redirect: 'follow',
        headers: { Accept: 'text/plain', 'User-Agent': 'OpticWise-IndexNow-verify/1' },
      });
      if (res.ok) {
        const text = await res.text();
        if (text.trim() === key)
          return { ok: true, verifyUrl };
      }
    } catch (_) {
      /* network / DNS — retry */
    }
    if (i < maxAttempts) {
      console.warn(
        `[indexnow] key not reachable yet (${i}/${maxAttempts}): ${verifyUrl}`
      );
      await delay(pauseMs);
    }
  }
  return { ok: false, verifyUrl };
}

async function submitBatch(urlList, key) {
  const keyLocation = `${SITE_ORIGIN}/${key}.txt`;
  const endpoint = 'https://api.indexnow.org/IndexNow';
  const payload = JSON.stringify({
    host: HOST,
    key,
    keyLocation,
    urlList,
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: payload,
  });

  const snippet = `${res.status} ${res.statusText}`.trim();
  if (!res.ok && res.status !== 202) {
    const text = await res.text().catch(() => '');
    throw new Error(`${endpoint} → ${snippet} ${text ? `(${text.slice(0, 200)})` : ''}`);
  }

  console.log(
    `[indexnow] ✓ Posted ${urlList.length} URL(s); ${endpoint} responded ${snippet}`
  );
}

async function main() {
  if (/^1|true|yes$/i.test(process.env.INDEXNOW_SKIP || '')) {
    console.log('[indexnow] INDEXNOW_SKIP=1 — skipping');
    return;
  }

  const dryRun = /^1|true|yes$/i.test(process.env.INDEXNOW_DRY_RUN || '');

  const key = discoverKeyFromRoot();
  const sitemapXml = readFileSync(resolve(ROOT, 'sitemap.xml'), 'utf8');
  const urls = parseUrlsFromSitemap(sitemapXml);
  if (urls.length === 0) throw new Error('No URLs extracted from sitemap.xml');

  const batchMax = Number.parseInt(process.env.INDEXNOW_BATCH ?? '9000', 10);

  const retries = Number.parseInt(process.env.INDEXNOW_VERIFY_RETRIES ?? '24', 10);
  const pauseMs = Number.parseInt(process.env.INDEXNOW_VERIFY_DELAY_MS ?? '15000', 10);

  if (dryRun) {
    console.log(
      `[indexnow] INDEXNOW_DRY_RUN=1 — parsed ${urls.length} URL(s) in ${Math.ceil(urls.length / batchMax)} batch(es); skipping verify GET and POST`
    );
    process.exitCode = 0;
    return;
  }

  const verified = await verifyKeyHosted(key, retries, pauseMs);
  if (!verified.ok) {
    console.warn(
      `[indexnow] Verification URL not reachable after ${retries} attempts: ${verified.verifyUrl}\n[indexnow] Skipping ping this run (often the first deploy with a new key; next deploy or manual run will succeed).`
    );
    process.exitCode = 0;
    return;
  }

  let anyFailed = false;
  for (let i = 0; i < urls.length; i += batchMax) {
    const chunk = urls.slice(i, i + batchMax);
    try {
      await submitBatch(chunk, key);
    } catch (e) {
      anyFailed = true;
      console.warn('[indexnow] Batch failed:', e.message || e);
    }
  }

  if (anyFailed)
    console.warn('[indexnow] One or more batches failed — site still deployed.');
  else console.log(`[indexnow] Done — submitted ${urls.length} unique URL(s) from sitemap`);

  process.exitCode = 0;
}

main().catch((err) => {
  console.error('[indexnow] Fatal:', err.message || err);
  /* Do not fail the static deploy */
  process.exitCode = 0;
});
