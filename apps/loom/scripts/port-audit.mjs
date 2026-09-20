#!/usr/bin/env node
/**
 * port-audit — inventory the live Loom for the React + canon port.
 *
 * Walks apps/loom/src, extracts every design-system surface (tokens, AAF
 * actions, class-name prefixes, event kinds), and compares against the
 * canon's declared surfaces. Emits a markdown report.
 *
 * Zero dependencies. Reads:
 *   packages/canon/dist/tokens.css             (canonical tokens)
 *   packages/canon/src/loom/events.ts          (canonical event kinds)
 *   apps/loom/public/.well-known/agent-manifest.json (canonical AAF actions)
 *
 * Usage (from the monorepo root or apps/loom):
 *   node apps/loom/scripts/port-audit.mjs
 *   node apps/loom/scripts/port-audit.mjs --out /tmp/report.md
 *   node apps/loom/scripts/port-audit.mjs --json
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOOM_ROOT = dirname(dirname(fileURLToPath(import.meta.url))); // apps/loom
const MONOREPO = dirname(dirname(LOOM_ROOT)); // repo root
const SRC = join(LOOM_ROOT, 'src');
const CANON_TOKENS = join(MONOREPO, 'packages/canon/dist/tokens.css');
const CANON_EVENTS = join(MONOREPO, 'packages/canon/src/loom/events.ts');
const MANIFEST = join(LOOM_ROOT, 'public/.well-known/agent-manifest.json');
const DEFAULT_OUT = join(LOOM_ROOT, 'docs/PORTING_INVENTORY.md');

const argv = process.argv.slice(2);
const OUT = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : null;
const AS_JSON = argv.includes('--json');

// ── File walk ────────────────────────────────────────────────────────────────
function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const FILES = walk(SRC).filter((f) => ['.ts', '.tsx', '.css'].includes(extname(f)));

// ── Canonical surfaces ───────────────────────────────────────────────────────
function readCanonTokens() {
  if (!existsSync(CANON_TOKENS)) return new Set();
  const css = readFileSync(CANON_TOKENS, 'utf8');
  const names = new Set();
  for (const m of css.matchAll(/--(p31|loom|motion)-[a-z0-9-]+/g)) names.add(m[0]);
  return names;
}

function readCanonEventKinds() {
  if (!existsSync(CANON_EVENTS)) return new Set();
  const ts = readFileSync(CANON_EVENTS, 'utf8');
  const names = new Set();
  // The canon event union declares kinds as `kind: 'focus'` inside each member.
  for (const m of ts.matchAll(/kind:\s*'([a-z][a-z0-9.-]*)'/g)) names.add(m[1]);
  return names;
}

function readManifestActions() {
  if (!existsSync(MANIFEST)) return new Set();
  try {
    const json = JSON.parse(readFileSync(MANIFEST, 'utf8'));
    const names = new Set();
    const walkActions = (node) => {
      if (Array.isArray(node)) return node.forEach(walkActions);
      if (node && typeof node === 'object') {
        if (typeof node.name === 'string') names.add(node.name);
        if (typeof node.action === 'string') names.add(node.action);
        for (const v of Object.values(node)) walkActions(v);
      }
    };
    walkActions(json);
    return names;
  } catch {
    return new Set();
  }
}

const canonTokens = readCanonTokens();
const canonKinds = readCanonEventKinds();
const canonActions = readManifestActions();

// ── Extraction ───────────────────────────────────────────────────────────────
const usedTokens = new Map(); // token -> [file]
const usedActions = new Map(); // action -> [file]
const usedKinds = new Map(); // kind -> [file]
const usedPrefixes = new Map(); // prefix -> Set<class>
const rawValues = new Map(); // file -> [raw hit]

/** Strip block comments and (for TS/TSX) whole-line comments so the scan
 *  only sees real usages — a comment mentioning `var(--p31-*)` is not drift. */
function stripComments(text, isTs) {
  let t = text.replace(/\/\*[\s\S]*?\*\//g, '');
  if (isTs) t = t.replace(/^\s*\/\/.*$/gm, '');
  return t;
}

/** Collect var(--x) tokens, AAF actions, event kinds, class prefixes. */
function scanFile(file, text) {
  const rel = relative(MONOREPO, file);
  const isTs = extname(file) === '.ts' || extname(file) === '.tsx';
  text = stripComments(text, isTs);

  for (const m of text.matchAll(/var\((--(?:p31|loom|motion)-[a-z0-9-]+)/g)) {
    if (!usedTokens.has(m[1])) usedTokens.set(m[1], []);
    usedTokens.get(m[1]).push(rel);
  }

  for (const m of text.matchAll(/data-agent-action="([^"]+)"/g)) {
    if (!usedActions.has(m[1])) usedActions.set(m[1], []);
    usedActions.get(m[1]).push(rel);
  }

  // Event kinds only count when they appear in an object that also declares a
  // writer — that is the LoomEventInput shape. `kind: 'component'` in a node
  // datum or `view.read` in a weft call are not warp event kinds.
  for (const m of text.matchAll(/writer:\s*'(human|agent)'[\s\S]{0,120}?kind:\s*'([a-z][a-z0-9.-]*)'/g)) {
    if (!usedKinds.has(m[2])) usedKinds.set(m[2], []);
    usedKinds.get(m[2]).push(rel);
  }

  const PREFIX = /\.(loom|lumi|chapter|launchpad|companion|made|orb|sound|shared|proposal|color|jb)-?([a-z0-9-]*)/g;
  for (const m of text.matchAll(PREFIX)) {
    const key = `${m[1]}-`;
    if (!usedPrefixes.has(key)) usedPrefixes.set(key, new Set());
    usedPrefixes.get(key).add(`.${m[1]}${m[2] ? '-' + m[2] : ''}`);
  }

  // Raw value scan. Skip :root declarations (token defs), strip var(...)
  // references (including their fallback hex) and calc(...) blocks so the
  // scan only sees values that are genuinely hardcoded, not token-derived.
  if (extname(file) === '.css') {
    const body = text
      .replace(/:root\s*{[^}]*}/g, '')
      .replace(/var\([^)]*\)/g, 'var()')
      .replace(/calc\([^)]*\)/g, 'calc()');
    const hits = [];
    for (const m of body.matchAll(/(#[0-9a-fA-F]{3,8})\b/g)) hits.push(m[0]);
    for (const m of body.matchAll(/(?:padding|margin|gap|inset|width|height|min-width|min-height)\s*:\s*(\d+px)/g))
      hits.push(m[0]);
    for (const m of body.matchAll(/(?:transition|animation)[^;]*?(\d+(?:\.\d+)?)(ms|s)\b/g))
      hits.push(`${m[1]}${m[2]}`);
    if (hits.length) {
      if (!rawValues.has(rel)) rawValues.set(rel, []);
      rawValues.get(rel).push(...hits);
    }
  }
}

for (const file of FILES) scanFile(file, readFileSync(file, 'utf8'));

// ── Report ───────────────────────────────────────────────────────────────────
const uniq = (arr) => [...new Set(arr)];
const missing = (from, against) => [...from.keys()].filter((k) => !against.has(k)).sort();
const unused = (from, used) => [...from].filter((k) => !used.has(k)).sort();

const report = {
  generatedAt: new Date().toISOString(),
  fileCount: FILES.length,
  manifestExists: existsSync(MANIFEST),

  tokens: {
    used: usedTokens.size,
    inCanon: [...usedTokens.keys()].filter((t) => canonTokens.has(t)).length,
    usedNotInCanon: missing(usedTokens, canonTokens),
    inCanonNeverUsed: unused(canonTokens, usedTokens),
  },

  actions: {
    used: usedActions.size,
    inManifest: [...usedActions.keys()].filter((a) => canonActions.has(a)).length,
    usedNotInManifest: missing(usedActions, canonActions),
    inManifestNeverUsed: unused(canonActions, usedActions),
  },

  eventKinds: {
    used: usedKinds.size,
    inCanon: [...usedKinds.keys()].filter((k) => canonKinds.has(k)).length,
    usedNotInCanon: missing(usedKinds, canonKinds),
    inCanonNeverUsed: unused(canonKinds, usedKinds),
  },

  prefixes: Object.fromEntries(
    [...usedPrefixes.entries()].map(([k, v]) => [k, uniq([...v]).sort()]),
  ),

  rawValues,
};

if (AS_JSON) {
  const out = JSON.stringify(
    { ...report, rawValues: Object.fromEntries(report.rawValues) },
    null,
    2,
  );
  if (OUT) writeFileSync(OUT, out);
  else console.log(out);
  process.exit(0);
}

const md = [];
md.push(`# Porting inventory — ${report.generatedAt}`);
md.push('');
md.push(`Scanned **${report.fileCount} files** under \`apps/loom/src\`.`);
md.push('');

md.push('## Tokens');
md.push(`- Used: **${report.tokens.used}**`);
md.push(`- Resolve against canon: **${report.tokens.inCanon}**`);
md.push(`- Used but not declared in canon: **${report.tokens.usedNotInCanon.length}**`);
if (report.tokens.usedNotInCanon.length) {
  md.push('');
  md.push('  Drift — either typos, or gaps the canon needs to close:');
  for (const t of report.tokens.usedNotInCanon) md.push(`  - \`${t}\`  ← ${uniq(usedTokens.get(t)).join(', ')}`);
}
md.push(`- Declared in canon but never used: **${report.tokens.inCanonNeverUsed.length}**`);
if (report.tokens.inCanonNeverUsed.length) {
  md.push('');
  md.push('  Dead tokens — safe to prune, or a signal of an unfinished area:');
  for (const t of report.tokens.inCanonNeverUsed) md.push(`  - \`${t}\``);
}
md.push('');

md.push('## AAF actions');
if (!report.manifestExists) {
  md.push(`> \`.well-known/agent-manifest.json\` not found at \`${MANIFEST}\` — every action reports as unmanifested.`);
  md.push('');
}
md.push(`- Used: **${report.actions.used}**`);
md.push(`- In manifest: **${report.actions.inManifest}**`);
md.push(`- Used but not in manifest: **${report.actions.usedNotInManifest.length}**`);
if (report.actions.usedNotInManifest.length) {
  md.push('');
  md.push('  Add these to the manifest before merge:');
  for (const a of report.actions.usedNotInManifest) md.push(`  - \`${a}\`  ← ${uniq(usedActions.get(a)).join(', ')}`);
}
md.push(`- In manifest but never used: **${report.actions.inManifestNeverUsed.length}**`);
md.push('');

md.push('## Event kinds');
md.push(`- Used: **${report.eventKinds.used}**`);
md.push(`- In canon: **${report.eventKinds.inCanon}**`);
md.push(`- Used but not in canon: **${report.eventKinds.usedNotInCanon.length}**`);
if (report.eventKinds.usedNotInCanon.length) {
  for (const k of report.eventKinds.usedNotInCanon) md.push(`  - \`${k}\`  ← ${uniq(usedKinds.get(k)).join(', ')}`);
}
md.push(`- In canon but never used: **${report.eventKinds.inCanonNeverUsed.length}**`);
md.push('');

md.push('## Class-name prefixes in use');
for (const [prefix, classes] of Object.entries(report.prefixes).sort()) {
  md.push(`- \`${prefix}\` — ${classes.length} classes`);
}
md.push('');

md.push('## Raw values that should be tokens');
if (report.rawValues.size === 0) {
  md.push('None. Every color / spacing / duration resolves to a token.');
} else {
  for (const [file, hits] of report.rawValues) {
    md.push(`- \`${file}\` — ${uniq(hits).slice(0, 12).join(', ')}${hits.length > 12 ? ` (+${hits.length - 12} more)` : ''}`);
  }
}
md.push('');

const out = md.join('\n');
if (OUT) {
  writeFileSync(OUT, out);
  console.error(`wrote ${OUT} (${out.length} bytes)`);
} else {
  console.log(out);
}