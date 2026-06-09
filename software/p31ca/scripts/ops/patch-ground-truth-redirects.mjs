#!/usr/bin/env node
/**
 * One-shot patch: update edgeRedirects in p31.ground-truth.json to match
 * the cleaned _redirects (Phase 2 sweep — HTML files deleted, all short-path
 * aliases now point to Astro routes instead of .html files).
 *
 * Run: node scripts/ops/patch-ground-truth-redirects.mjs
 * Safe to delete this file after running once.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const gtPath = path.join(root, 'ground-truth', 'p31.ground-truth.json');
const gt = JSON.parse(fs.readFileSync(gtPath, 'utf8'));

// ── 1. Update changed edgeRedirects entries ────────────────────────────────
const UPDATES = {
  // key = from; value = new { to, status }
  '/demos-public':    { to: '/demo-labs',      status: 301 },
  '/glass':           { to: '/dome',           status: 301 },
  '/lab':             { to: '/ops',            status: 301 },
  '/lab2':            { to: '/ops',            status: 301 },
  '/slicer':          { to: '/ops',            status: 301 },
  '/journey':         { to: '/research',       status: 301 },
  '/oqe':             { to: '/dome#d20',       status: 301 },
  '/branding':        { to: '/p31-canon-demo', status: 301 },
  '/kofi-forge':      { to: '/ops#forge',      status: 301 },
  '/oracle':          { to: '/dome#oracle',    status: 301 },
  '/manifesto':       { to: '/phosphorus',     status: 301 },
  '/code-of-conduct': { to: '/',               status: 301 },
  '/coc':             { to: '/',               status: 301 },
  '/roadmap':         { to: '/research',       status: 301 },
  '/status':          { to: '/god',            status: 301 },
  '/financials':      { to: '/grants',         status: 301 },
  '/security-policy': { to: '/',               status: 301 },
  '/telemetry-policy':{ to: '/',               status: 301 },
  '/canon':           { to: '/p31-canon-demo', status: 301 },
  '/tokens':          { to: '/p31-canon-demo', status: 301 },
  '/dev':             { to: '/god',            status: 301 },
  '/build':           { to: '/',               status: 301 },
  '/hiring':          { to: '/ops',            status: 301 },
  '/messages':        { to: '/messaging-hub',  status: 301 },
  '/comms':           { to: '/messaging-hub',  status: 301 },
  '/contracts':       { to: '/ops',            status: 301 },
  '/composer':        { to: '/ops',            status: 301 },
  '/family-pack':     { to: '/connect#family', status: 301 },
  '/oss':             { to: '/research',       status: 301 },
  '/security':        { to: '/',               status: 301 },
  '/fleet':           { to: '/god',            status: 301 },
  '/demos':           { to: '/demo-labs',      status: 301 },
  '/visuals':         { to: '/demo-labs',      status: 301 },
};

const NEW_ENTRIES = [
  { from: '/spaceship-earth.html',       to: '/spaceship-earth/', status: 301 },
  { from: '/spaceship-earth-about.html', to: '/spaceship-earth/', status: 301 },
  { from: '/node-zero-about.html',       to: '/node-zero',        status: 301 },
];

let updated = 0;
for (const entry of gt.edgeRedirects || []) {
  if (UPDATES[entry.from]) {
    Object.assign(entry, UPDATES[entry.from]);
    updated++;
  }
}

// Add only if not already present
for (const ne of NEW_ENTRIES) {
  const exists = gt.edgeRedirects.some(e => e.from === ne.from);
  if (!exists) {
    gt.edgeRedirects.push(ne);
    updated++;
  }
}

console.log(`edgeRedirects: ${updated} entries updated/added`);

// ── 2. Remove fileSnippets for deleted HTML files ──────────────────────────
const DELETED_PATHS = new Set([
  'public/open-doc-suite.html',
  'public/initial-build.html',
  'public/passport-generator.html',
  'public/fleet-agents.html',
]);

const before = (gt.fileSnippets || []).length;
gt.fileSnippets = (gt.fileSnippets || []).filter(s => !DELETED_PATHS.has(s.path));
console.log(`fileSnippets: removed ${before - gt.fileSnippets.length} entries for deleted HTML files`);

// ── 3. Remove threejs pin for deleted connect.html ────────────────────────
if (gt.threejs && gt.threejs['connect.html']) {
  delete gt.threejs['connect.html'];
  console.log('threejs: removed connect.html pin (file deleted)');
}

// ── 4. Write ───────────────────────────────────────────────────────────────
fs.writeFileSync(gtPath, JSON.stringify(gt, null, 2) + '\n', 'utf8');
console.log('Done — p31.ground-truth.json updated');
