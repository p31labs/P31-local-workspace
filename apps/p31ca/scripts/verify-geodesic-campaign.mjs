#!/usr/bin/env node
/**
 * Verifies the inline CAMPAIGN object in geodesic.html matches the canonical
 * source in ground-truth/geodesic-campaign.json.
 *
 * Fails (exit 1) if:
 *   - ground-truth/geodesic-campaign.json is missing
 *   - public/geodesic.html is missing
 *   - the CAMPAIGN block cannot be extracted from geodesic.html
 *   - structural content differs (any track id/label/emoji/unlock/steps field)
 *
 * Run: npm run verify:geodesic-campaign
 * Also called from prebuild.
 *
 * To update after changing ground-truth/geodesic-campaign.json, manually
 * mirror the tracks into the `const CAMPAIGN = { ... }` block in geodesic.html.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');

let failed = false;
function fail(msg) { console.error('[FAIL] verify-geodesic-campaign:', msg); failed = true; }
function ok(msg)   { console.log( '[ OK ] verify-geodesic-campaign:', msg); }

const CANONICAL_PATH = resolve(ROOT, 'ground-truth/geodesic-campaign.json');
const HTML_PATH      = resolve(ROOT, 'public/geodesic.html');

if (!existsSync(CANONICAL_PATH)) { fail('ground-truth/geodesic-campaign.json missing'); process.exit(1); }
// geodesic.html deleted Phase 2 housekeeping — campaign now lives inside /dome#geodesic (dome.astro)
if (!existsSync(HTML_PATH)) { console.log('[ OK ] verify-geodesic-campaign: geodesic.html archived (Phase 2) — skipping inline check'); process.exit(0); }

let canonical;
try {
  canonical = JSON.parse(readFileSync(CANONICAL_PATH, 'utf8'));
} catch (e) {
  fail('JSON parse error in geodesic-campaign.json: ' + e.message);
  process.exit(1);
}

const html = readFileSync(HTML_PATH, 'utf8');

// ── Extract inline CAMPAIGN via brace-balancing parser ──────────────────────
function extractInlineCampaign(src) {
  const marker = 'const CAMPAIGN = ';
  const start = src.indexOf(marker);
  if (start === -1) return null;

  let i = start + marker.length;
  let depth = 0;
  let inString = false;
  let strChar = '';

  while (i < src.length) {
    const c = src[i];
    if (inString) {
      if (c === '\\') { i += 2; continue; }
      if (c === strChar) inString = false;
    } else {
      if (c === '"' || c === "'" || c === '`') { inString = true; strChar = c; }
      else if (c === '{' || c === '[') depth++;
      else if (c === '}' || c === ']') {
        depth--;
        if (depth === 0) { i++; break; }
      }
    }
    i++;
  }

  return src.slice(start + marker.length, i);
}

const rawBlock = extractInlineCampaign(html);
if (!rawBlock) {
  fail('cannot find "const CAMPAIGN = {" block in geodesic.html — was it renamed or moved?');
  process.exit(1);
}

let inlineObj;
try {
  // eslint-disable-next-line no-new-func
  inlineObj = new Function(`return (${rawBlock})`)();
} catch (e) {
  fail('cannot eval inline CAMPAIGN block: ' + e.message);
  process.exit(1);
}

// ── Normalize both to a deterministic structure ─────────────────────────────
function normalizeStep(s) {
  return {
    id:           String(s.id ?? ''),
    msg:          String(s.msg ?? ''),
    emoji:        String(s.emoji ?? ''),
    waitFor:      String(s.waitFor ?? ''),
    celebration:  String(s.celebration ?? ''),
  };
}

function normalizeTrack(t) {
  return {
    id:     String(t.id ?? ''),
    label:  String(t.label ?? ''),
    emoji:  String(t.emoji ?? ''),
    unlock: (t.unlock ?? []).map(String),
    steps:  (t.steps ?? []).map(normalizeStep),
  };
}

function normalize(c) {
  if (!c?.tracks || !Array.isArray(c.tracks)) return null;
  return { tracks: c.tracks.map(normalizeTrack) };
}

const normCanon  = normalize(canonical);
const normInline = normalize(inlineObj);

if (!normCanon)  { fail('ground-truth/geodesic-campaign.json has no .tracks array'); process.exit(1); }
if (!normInline) { fail('inline CAMPAIGN in geodesic.html has no .tracks array'); process.exit(1); }

const strCanon  = JSON.stringify(normCanon,  null, 2);
const strInline = JSON.stringify(normInline, null, 2);

if (strCanon !== strInline) {
  fail('inline CAMPAIGN in geodesic.html does not match ground-truth/geodesic-campaign.json');
  // Show first diff line
  const canon  = strCanon.split('\n');
  const inline = strInline.split('\n');
  const maxLen = Math.max(canon.length, inline.length);
  for (let i = 0; i < maxLen; i++) {
    if (canon[i] !== inline[i]) {
      console.error(`  First diff at normalized line ${i + 1}:`);
      console.error(`  canonical: ${canon[i]  ?? '(missing)'}`);
      console.error(`  geodesic:  ${inline[i] ?? '(missing)'}`);
      break;
    }
  }
  console.error('  Mirror changes from ground-truth/geodesic-campaign.json into the');
  console.error('  `const CAMPAIGN = { ... }` block in public/geodesic.html.');
  process.exit(1);
}

ok(`${normCanon.tracks.length} tracks, ${normCanon.tracks.reduce((n, t) => n + t.steps.length, 0)} steps — inline matches ground-truth ✓`);
