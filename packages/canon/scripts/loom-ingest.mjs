#!/usr/bin/env node
/**
 * @p31/canon — loom-ingest.mjs
 *
 * Ingestion CLI (Move 4). Reads a directory of CSS + a token file and writes a
 * Loom-compatible registry candidate. Does NOT touch the committed registry —
 * the output is a candidate the human reviews before consumption.
 *
 * Run: node scripts/loom-ingest.mjs --source <dir> --tokens <file> --out <file>
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { parseCss, parseTokens, toRegistry } from '../src/loom/ingest.ts';

function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0) return process.argv[i + 1];
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(`--${name}=`.length) : dflt;
}

const source = arg('source', null);
const tokensFile = arg('tokens', null);
const out = arg('out', 'ingested-registry.json');

if (!source) {
  console.error('usage: node scripts/loom-ingest.mjs --source <dir> [--tokens <file>] [--out <file>]');
  process.exit(2);
}

const classes = [];
for (const f of readdirSync(source).filter((x) => x.endsWith('.css'))) {
  classes.push(...parseCss(readFileSync(join(source, f), 'utf8'), f));
}
// Dedupe by class name (a class may be declared in multiple files).
const byName = new Map();
for (const c of classes) {
  const e = byName.get(c.name) ?? { name: c.name, files: new Set(), tokens: new Set() };
  c.files.forEach((f) => e.files.add(f));
  c.tokens.forEach((t) => e.tokens.add(t));
  byName.set(c.name, e);
}
const merged = [...byName.values()]
  .map((e) => ({ name: e.name, files: [...e.files].sort(), tokens: [...e.tokens].sort() }))
  .sort((a, b) => a.name.localeCompare(b.name));

let tokens = [];
if (tokensFile) tokens = parseTokens(readFileSync(resolve(tokensFile), 'utf8'));

const registry = toRegistry(merged, tokens, { source });
writeFileSync(out, JSON.stringify(registry, null, 2) + '\n');
console.log(`loom-ingest — ${registry.counts.cssClasses} classes, ${registry.counts.tokens} tokens → ${out}`);
