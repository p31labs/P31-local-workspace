#!/usr/bin/env node
/**
 * @p31/canon — loom-coverage-agent.mjs
 *
 * The coverage agent (Move 2). Where loom-contract-agent.mjs proposes ONE
 * contract for the first uncontracted family, this agent proposes for EVERY
 * uncontracted component family, batched, ranked by signal, with a single
 * `parentAgent` on each event so the run is one delegation chain.
 *
 * Deterministic, agent-agnostic — no model calls, no vendor names. Reads
 * registry.json + src/css/*.css + tokens/tokens.dtc.json; writes only through
 * commit() (traverse/propose). A human approves; loom-apply lands.
 *
 * Run: node scripts/loom-coverage-agent.mjs [--limit=N]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { propose, traverse, resolveLogPath } from '../../canon-mcp/src/loom-tools.ts';
import {
  detectFamilies,
  uncontractedFamilies,
  groundTokens,
  buildContractBody,
  pascalize,
} from './loom-coverage.mjs';
import { rankByField } from '../../field/src/loop.ts';
import { trust } from '../../field/src/trust.ts';
import { commitWeft } from '../src/loom/commitWeft.ts';

function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0) return process.argv[i + 1];
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(`--${name}=`.length) : dflt;
}

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const registry = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8'));
const limit = Number(arg('limit', '5'));
// Optional field traces (JSON array of @p31/field Trace objects). When present
// and non-empty, the coverage agent ranks by field attention instead of the
// static signal. Zone ids are the family base names (e.g. ".badge").
const tracesPath = arg('traces', null);

// ── scan CSS into class -> { files, tokens } ───────────────────────────
const cssDir = join(root, 'src', 'css');
const classVars = new Map();
for (const f of readdirSync(cssDir).filter((x) => x.endsWith('.css'))) {
  const text = readFileSync(join(cssDir, f), 'utf8');
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = m[2];
    const used = [...new Set([...body.matchAll(/var\((--p31-[a-z0-9-]+)/g)].map((x) => x[1]))];
    if (!used.length) continue;
    for (const c of m[1].matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) {
      const name = '.' + c[1];
      if (!classVars.has(name)) classVars.set(name, { files: new Set(), tokens: new Set() });
      classVars.get(name).files.add(f);
      used.forEach((t) => classVars.get(name).tokens.add(t));
    }
  }
}

// ── load the DTCG token tree ───────────────────────────────────────────
const dtcg = JSON.parse(readFileSync(join(root, 'tokens', 'tokens.dtc.json'), 'utf8'));
const resolveAll = (node, prefix = [], out = new Map()) => {
  if (!node || typeof node !== 'object') return out;
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === 'object' && '$value' in v) out.set([...prefix, k].join('.'), v.$value);
    else if (v && typeof v === 'object') resolveAll(v, [...prefix, k], out);
  }
  return out;
};
const dtcgTokens = resolveAll(dtcg);

// ── rank + filter ──────────────────────────────────────────────────────
const families = detectFamilies(classVars);
const contracted = registry.components.map((c) => c.name);
const candidates = uncontractedFamilies(families, contracted).slice(0, limit);

// Field-driven ranking. Traces are optional; when absent the field is empty
// and the ranking falls back to static signal. Either way, rankByField
// returns the per-zone pressure/hazard we stamp onto each field.decision
// event, so the loop records what it actually decided on.
const fieldTraces = tracesPath && existsSync(tracesPath)
  ? JSON.parse(readFileSync(tracesPath, 'utf8'))
  : [];
const atMs = Date.now();
const ranked = rankByField(
  candidates.map((f) => ({ id: f.base, signal: f.signal })),
  Array.isArray(fieldTraces) ? fieldTraces : [],
  atMs,
);
const order = new Map(ranked.map((r, i) => [r.id, i]));
const fieldByZone = new Map(ranked.map((r) => [r.id, r]));
if (ranked.length > 0 && Array.isArray(fieldTraces) && fieldTraces.length > 0) {
  console.log(`[coverage-agent] ranked by field (${fieldTraces.length} traces): ${ranked.map((r) => r.id).join(', ')}`);
}

// Re-sort candidates into field order (stable — untouched zones keep their
// relative static order because rankByField preserves signal as prior).
const ordered = [...candidates].sort((a, b) => (order.get(a.base) ?? 0) - (order.get(b.base) ?? 0));

if (ordered.length === 0) {
  console.log('[coverage-agent] no uncontracted component families; the canon is fully contracted.');
  process.exit(0);
}

const runId = `coverage-run-${Date.now()}`;
const logPath = resolveLogPath();
const weftPath = join(dirname(logPath), 'weft.jsonl');
let proposed = 0;

for (const family of ordered) {
  const tokenContract = groundTokens(classVars, family, dtcgTokens);
  const body = buildContractBody(family, tokenContract, dtcgTokens);
  const id = `prop_${pascalize(family.base).toLowerCase()}_${Date.now()}_${proposed}`;

  const t = traverse(logPath, family.base, family.base, 'coverage');
  if (t.valid) console.log(`[coverage-agent] traverse ${family.base} (seq ${t.event.seq})`);

  const p = propose(logPath, id, family.base, body, runId);
  if (p.valid) {
    proposed++;
    console.log(`[coverage-agent] propose ${id} → ${body.name} (${family.modifierCount} variants, ${tokenContract.length} tokens, signal ${family.signal})`);

    // Record the field's decision: what pressure/hazard/trust drove this
    // proposal. This is the trace outcomeCorrelation later pairs against
    // the human's approve/reject. The acting agent is `runId` — a fresh
    // actor, so trust is neutral; the field's snapshot is what matters.
    const zone = fieldByZone.get(family.base) ?? { pressure: 0, hazard: 0 };
    const r = commitWeft(weftPath, {
      kind: 'field.decision',
      zone: family.base,
      proposalId: id,
      pressure: zone.pressure,
      hazard: zone.hazard,
      trust: trust(runId, fieldTraces, atMs),
      warpSeq: p.event.seq,
    });
    if (!r.valid) console.error(`[coverage-agent] field.decision FAILED for ${family.base}: ${r.error}`);
  } else {
    console.error(`[coverage-agent] propose FAILED for ${family.base}: ${p.error}`);
  }
}

console.log(`[coverage-agent] done. ${proposed}/${ordered.length} proposals, parentAgent=${runId}`);
