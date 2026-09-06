#!/usr/bin/env node
/**
 * Probes HTTPS URLs listed in docs connect-the-stack (fleet map).
 * Run from repo: node 04_SOFTWARE/scripts/verify-stack-links.mjs
 *
 * Optional:
 *   VERIFY_STACK_IGNORE_URLS — skip probe entirely (comma-separated).
 *   VERIFY_STACK_OPTIONAL_URLS — probe; failure is WARN only (comma-separated). Defaults include docs + bouncer until first deploy.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mdPath = join(
  __dirname,
  '..',
  'docs',
  'src',
  'content',
  'docs',
  'getting-started',
  'connect-the-stack.md',
);

const text = readFileSync(mdPath, 'utf8');
const re = /\]?\(https:\/\/[^)\s]+\)/g;
const urls = new Set();
for (const m of text.matchAll(re)) {
  const chunk = m[0];
  const inner = chunk.replace(/^[^(]*\(|\)$/g, '');
  urls.add(inner);
}

const ignore = new Set(
  (process.env.VERIFY_STACK_IGNORE_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

const defaultOptional = [
  'https://docs.phosphorus31.org',
  'https://p31-bouncer.trimtab-signal.workers.dev',
  'https://k4-hubs.trimtab-signal.workers.dev',
  'https://k4-hubs.trimtab-signal.workers.dev/viz',
  'https://k4-personal.trimtab-signal.workers.dev',
];
const optional = new Set([
  ...defaultOptional,
  ...(process.env.VERIFY_STACK_OPTIONAL_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
]);

const TIMEOUT_MS = 15000;
let failed = 0;
let warned = 0;

/**
 * GET with manual redirects: avoids undici "redirect count exceeded" when an edge
 * ping-pongs (e.g. /dome <-> /dome/). Detects cycles explicitly.
 * @param {string} url
 */
async function probe(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const visited = [];
  let current = url;
  const rangeHeaders = {
    Range: 'bytes=0-8191',
    Accept: 'text/html,application/json,*/*',
  };
  try {
    for (let hop = 0; hop < 24; hop++) {
      if (visited.includes(current)) {
        clearTimeout(timer);
        return { ok: false, status: 0, err: `redirect loop involving ${current}` };
      }
      visited.push(current);
      const res = await fetch(current, {
        method: 'GET',
        signal: ctrl.signal,
        redirect: 'manual',
        headers: rangeHeaders,
      });
      if (res.status >= 200 && res.status < 300) {
        clearTimeout(timer);
        return { ok: true, status: res.status };
      }
      if (res.status === 206 || res.status === 403 || res.status === 405) {
        clearTimeout(timer);
        return { ok: true, status: res.status };
      }
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) {
          clearTimeout(timer);
          return { ok: false, status: res.status, err: 'redirect without Location' };
        }
        current = new URL(loc, current).href;
        continue;
      }
      clearTimeout(timer);
      return { ok: false, status: res.status, err: `HTTP ${res.status}` };
    }
    clearTimeout(timer);
    return { ok: false, status: 0, err: 'too many redirects' };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, status: 0, err: /** @type {Error} */ (e).message };
  }
}

for (const url of [...urls].sort()) {
  if (ignore.has(url)) {
    console.log(`SKIP (VERIFY_STACK_IGNORE_URLS) ${url}`);
    continue;
  }
  const r = await probe(url);
  if (!r.ok) {
    if (optional.has(url)) {
      console.warn(`WARN (optional fleet URL) ${r.status || '—'} ${url}`, r.err || '');
      warned++;
    } else {
      console.error(`FAIL ${r.status || '—'} ${url}`, r.err || '');
      failed++;
    }
  } else {
    console.log(`OK ${r.status} ${url}`);
  }
}

if (failed) {
  console.error(`\n${failed} URL(s) failed`);
  process.exit(1);
}
if (warned) {
  console.warn(`\n${warned} optional URL(s) not reachable yet (non-blocking).`);
}
console.log(`\n${urls.size} URLs checked — required links OK.`);
