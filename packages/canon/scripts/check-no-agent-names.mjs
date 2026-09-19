#!/usr/bin/env node
/**
 * @p31/canon — check-no-agent-names.mjs
 *
 * The Loom is agent-agnostic: roles, not models. A model or vendor name in the
 * Loom surface is doctrine drift, and the surface spans three trees, so it is
 * enforced rather than trusted. This gate fails the build on any occurrence in
 * source (comments included — the original drift was in comments).
 *
 * Run from packages/canon: node scripts/check-no-agent-names.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..', '..', '..');

const SCAN_DIRS = [
  join(repo, 'packages', 'canon', 'src', 'loom'),
  join(repo, 'packages', 'canon', 'scripts'),
  join(repo, 'packages', 'canon-mcp', 'src'),
  join(repo, 'apps', 'loom'),
];

/** Root instruction files — where a stray model name is most likely to land
 *  and least likely to be noticed. */
const SCAN_FILES = [
  join(repo, 'AGENT_INSTRUCTIONS.md'),
  join(repo, 'AGENTS.md'),
];

/** This file necessarily names the forbidden tokens to forbid them. */
const ALLOWED = new Set(['check-no-agent-names.mjs']);
const EXTS = /\.(ts|tsx|mjs|js|md)$/;
/** Extend here if more vendor names must stay out. */
const NAMES = /\b(deepseek|gemini|claude)\b/i;

function walk(dir) {
  let out = [];
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(full));
    else if (EXTS.test(e.name)) out.push(full);
  }
  return out;
}

const hits = [];
const targets = [];
for (const dir of SCAN_DIRS) targets.push(...walk(dir));
targets.push(...SCAN_FILES);

for (const file of targets) {
  const base = file.slice(file.lastIndexOf('/') + 1);
  if (ALLOWED.has(base)) continue;
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    const m = line.match(NAMES);
    if (m) hits.push(`${file.replace(repo + '/', '')}:${i + 1}  [${m[1]}]  ${line.trim().slice(0, 90)}`);
  });
}

if (hits.length) {
  console.error(`\n❌ LOOM DOCTRINE: ${hits.length} model name(s) in the agent-agnostic surface.`);
  for (const h of hits) console.error(`   • ${h}`);
  console.error('\n   Use role language (substrate / presence / canvas), not model names.');
  console.error('   See AGENT_INSTRUCTIONS.md.');
  process.exit(1);
}
console.log('✅ no-agent-names — the Loom surface names roles, not models.');
