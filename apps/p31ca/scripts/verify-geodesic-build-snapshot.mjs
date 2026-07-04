#!/usr/bin/env node
/**
 * Triple-lock: ground-truth/geodesic-build-snapshot.json ↔ public/geodesic.html
 * inline constants ↔ @p31/shared/geodesic-build-snapshot.
 *
 * Run: npm run verify:geodesic-build-snapshot
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const P31CA = resolve(__dir, '..');
const SOFTWARE = resolve(P31CA, '..');

const CANONICAL = resolve(P31CA, 'ground-truth/geodesic-build-snapshot.json');
const HTML_PATH = resolve(P31CA, 'public/geodesic.html');
const SHARED_TS = resolve(SOFTWARE, 'packages/shared/src/geodesic-build-snapshot.ts');

function fail(msg) {
  console.error('[FAIL] verify-geodesic-build-snapshot:', msg);
  process.exit(1);
}
function ok(msg) {
  console.log('[ OK ] verify-geodesic-build-snapshot:', msg);
}

if (!existsSync(CANONICAL)) { fail(`missing ${CANONICAL}`); process.exit(1); }
// geodesic.html deleted Phase 2 housekeeping — dome.astro hosts the geodesic route
if (!existsSync(HTML_PATH)) { console.log('[ OK ] verify-geodesic-build-snapshot: geodesic.html archived (Phase 2) — skipping'); process.exit(0); }
if (!existsSync(SHARED_TS)) { fail(`missing ${SHARED_TS}`); process.exit(1); }

let canonical;
try {
  canonical = JSON.parse(readFileSync(CANONICAL, 'utf8'));
} catch (e) {
  fail('JSON parse error: ' + e.message);
  process.exit(1);
}

const html = readFileSync(HTML_PATH, 'utf8');
const sharedSrc = readFileSync(SHARED_TS, 'utf8');

const mHtmlSchema = html.match(
  /const GEODESIC_BUILD_SNAPSHOT_SCHEMA = ['"]([^'"]+)['"]/,
);
const mHtmlCap = html.match(/const GEODESIC_BUILD_SHAPE_CAP = (\d+)/);
const mHtmlStrutCap = html.match(/const GEODESIC_BUILD_STRUT_CAP = (\d+)/);

const mTsSchema = sharedSrc.match(
  /export const GEODESIC_BUILD_SNAPSHOT_SCHEMA = ['"]([^'"]+)['"]/,
);
const mTsCap = sharedSrc.match(/export const GEODESIC_BUILD_SHAPE_CAP = (\d+)/);
const mTsStrutCap = sharedSrc.match(/export const GEODESIC_BUILD_STRUT_CAP = (\d+)/);

if (!mHtmlSchema || !mHtmlCap || !mHtmlStrutCap) {
  fail('could not parse GEODESIC_BUILD_* constants in public/geodesic.html');
  process.exit(1);
}
if (!mTsSchema || !mTsCap || !mTsStrutCap) {
  fail('could not parse GEODESIC_BUILD_* in packages/shared geodesic-build-snapshot.ts');
  process.exit(1);
}

const schema = canonical.schema;
const cap = canonical.shapeCap;
const strutCap = canonical.strutCap;

if (typeof schema !== 'string' || schema !== mHtmlSchema[1] || schema !== mTsSchema[1]) {
  fail(
    `schema drift: ground-truth=${schema} html=${mHtmlSchema[1]} shared=${mTsSchema[1]}`,
  );
  process.exit(1);
}
if (
  typeof cap !== 'number' ||
  cap !== Number(mHtmlCap[1]) ||
  cap !== Number(mTsCap[1])
) {
  fail(
    `shapeCap drift: ground-truth=${cap} html=${mHtmlCap[1]} shared=${mTsCap[1]}`,
  );
  process.exit(1);
}
if (
  typeof strutCap !== 'number' ||
  strutCap !== Number(mHtmlStrutCap[1]) ||
  strutCap !== Number(mTsStrutCap[1])
) {
  fail(
    `strutCap drift: ground-truth=${strutCap} html=${mHtmlStrutCap[1]} shared=${mTsStrutCap[1]}`,
  );
  process.exit(1);
}

ok(
  `schema ${schema}; shapeCap ${cap}; strutCap ${strutCap} — canonical, geodesic.html, shared match ✓`,
);
