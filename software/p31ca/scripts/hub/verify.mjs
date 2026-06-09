#!/usr/bin/env node
/**
 * Hub integrity: registry related[] ids, cockpit URLs, no duplicate ids.
 * Run: node scripts/hub/verify.mjs
 * Part of p31.alignment verifyPipeline (p31ca prebuild); see P31 home p31-alignment.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registry } from './registry.mjs';
import { HUB_ALL_CARD_ORDER, HUB_COCKPIT_ORDER, HUB_PROTOTYPE_ORDER } from './hub-app-ids.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const P31CA = path.join(__dirname, '../..');
const PUBLIC = path.join(P31CA, 'public');
const LANDING = path.join(P31CA, 'src', 'data', 'hub-landing.json');

const byId = new Map(registry.map((r) => [r.id, r]));
let errors = 0;

// Build set of about-page paths covered by _redirects (Phase 2: static files deleted)
const redirectsText = fs.readFileSync(path.join(PUBLIC, '_redirects'), 'utf8');
const redirectedAbout = new Set(
  [...redirectsText.matchAll(/^(\/[\w-]+-about\.html)\s/gm)].map((m) => m[1])
);

/** Returns true if the about page exists as a file OR is covered by _redirects */
function aboutOk(id) {
  const file = path.join(PUBLIC, `${id}-about.html`);
  if (fs.existsSync(file)) return true;
  return redirectedAbout.has(`/${id}-about.html`);
}

const regSet = new Set(registry.map((r) => r.id));
const hubSet = new Set(HUB_ALL_CARD_ORDER);
if (regSet.size !== hubSet.size) {
  fail(`registry length ${regSet.size} != hub card list ${hubSet.size} — keep registry.mjs and hub-app-ids.mjs in lockstep`);
}
for (const id of HUB_ALL_CARD_ORDER) {
  if (!regSet.has(id)) {
    fail(`hub-app-ids: "${id}" not in registry`);
  }
}
for (const id of regSet) {
  if (!hubSet.has(id)) {
    fail(`registry id "${id}" not in hub-app-ids.mjs — add to HUB_COCKPIT_ORDER or HUB_PROTOTYPE_ORDER`);
  }
}
if (HUB_COCKPIT_ORDER.length + HUB_PROTOTYPE_ORDER.length !== HUB_ALL_CARD_ORDER.length) {
  fail('HUB_ALL_CARD_ORDER must equal COCKPIT + PROTOTYPES');
}

function fail(msg) {
  console.error('hub:verify:', msg);
  errors++;
}

for (const item of registry) {
  for (const rid of item.related || []) {
    if (!byId.has(rid)) {
      fail(`registry[${item.id}].related: unknown id "${rid}"`);
    }
  }
}

for (const item of registry) {
  if (item.status === 'concept' || item.status === 'draft') continue;
  if (!aboutOk(item.id)) {
    fail(`missing about page for registry id "${item.id}" (${item.id}-about.html — add to public/ or _redirects)`);
  }
}

if (fs.existsSync(LANDING)) {
  const data = JSON.parse(fs.readFileSync(LANDING, 'utf8'));
  const seen = new Set();
  for (const p of data.coreProducts || []) {
    if (seen.has(p.id)) fail(`duplicate cockpit id: ${p.id}`);
    seen.add(p.id);
    const item = byId.get(p.id);
    if (item && (item.status === 'concept' || item.status === 'draft')) continue;
    if (!aboutOk(p.id)) {
      fail(`cockpit card "${p.id}" has no ${p.id}-about.html`);
    }
  }
  for (const p of data.prototypes || []) {
    const item = byId.get(p.id);
    if (item && (item.status === 'concept' || item.status === 'draft')) continue;
    if (!aboutOk(p.id)) {
      fail(`prototype "${p.id}" has no ${p.id}-about.html`);
    }
  }
} else {
  fail('missing src/data/hub-landing.json — run: npm run hub:build');
}

if (errors > 0) {
  console.error(`hub:verify: ${errors} error(s)`);
  process.exit(1);
}
console.log('hub:verify: OK');
