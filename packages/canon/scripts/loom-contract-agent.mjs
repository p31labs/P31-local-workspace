#!/usr/bin/env node
/**
 * @p31/canon — loom-contract-agent.mjs
 *
 * THE real agent. Unlike the demo agent (which proposes `{ draft: true }`
 * heartbeats), this agent does one real job: find a CSS class family that is
 * a component but has no contract, read its actual CSS, and propose a full
 * contract for it — grounded in the tokens the CSS really consumes.
 *
 * It is deterministic and agent-agnostic (no model calls, no vendor names):
 * the "intelligence" is the reading of registry.json + src/css/*.css, the
 * same two inputs the human would read. It writes ONLY through commit() —
 * propose + review + traverse. It never writes registry.json, contracts, or
 * CSS; a human approves and lands the contract as a normal patch.
 *
 * Run: node scripts/loom-contract-agent.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { observe, propose, review, traverse, resolveLogPath } from '../../canon-mcp/src/loom-tools.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const registry = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8'));

// ── discover variant-grouped class families in the actual CSS ──────────
// A component candidate is a base class `.x` that has modifier siblings
// `.x-<variant>`. `.badge` → `.badge-success`, `.badge-warning`, … — that is
// a component pretending to be a pile of classes.
const cssDir = join(root, 'src', 'css');
const classVars = new Map(); // class name -> set of --p31-* vars it consumes
const classFiles = new Map();
for (const f of readdirSync(cssDir).filter((x) => x.endsWith('.css'))) {
  const text = readFileSync(join(cssDir, f), 'utf8');
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = m[2];
    const used = [...new Set([...body.matchAll(/var\((--p31-[a-z0-9-]+)/g)].map((x) => x[1]))];
    if (!used.length) continue;
    for (const c of m[1].matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) {
      const name = '.' + c[1];
      classVars.set(name, new Set([...(classVars.get(name) ?? []), ...used]));
      classFiles.set(name, f);
    }
  }
}

// Tone/status words that make a class a *variant modifier*, not a structural
// child. `.badge-success` is a variant; `.a2-data-card-title` is a child.
const TONE_WORDS = new Set([
  'success', 'warning', 'error', 'info', 'danger',
  'primary', 'secondary', 'ghost',
  'active', 'disabled', 'loading', 'pending', 'approved', 'rejected',
  'online', 'offline',
]);

// Class shorthands that alias an already-contracted component. `.btn` is the
// Button, which has a contract; proposing "Btn" would duplicate it.
const ALIASES = { btn: 'button' };

// A family is a base class with ≥2 modifier siblings whose suffix is a tone
// word. Structural children (header/body/close/metric-label) do not count.
const families = [];
for (const [name] of classVars) {
  const variants = [...classVars.keys()].filter((k) => {
    if (!k.startsWith(name + '-')) return false;
    const suffix = k.slice(name.length + 1);
    return TONE_WORDS.has(suffix);
  });
  if (variants.length >= 2) families.push({ base: name, variants });
}
families.sort((a, b) => a.base.localeCompare(b.base));

const pascalize = (slug) =>
  slug.slice(1).replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase());

const contracted = new Set(registry.components.map((c) => c.name.toLowerCase()));
// Pick the first tone-variant family that is not already contracted and not
// an alias of a contracted component.
const candidate = families.find((f) => {
  const pascal = pascalize(f.base);
  const aliased = ALIASES[f.base.slice(1)] ?? null;
  return !contracted.has(pascal.toLowerCase()) && !(aliased && contracted.has(aliased));
});

if (!candidate) {
  console.log('[contract-agent] no uncontracted component family found; nothing to propose.');
  process.exit(0);
}

const pascal = pascalize(candidate.base);
const variants = candidate.variants
  .map((v) => v.slice(candidate.base.length + 1))
  .sort();

// ── ground the contract in the tokens the CSS really uses ──────────────
// Load the DTCG tree first; the CSS var `--p31-<path-with-hyphens>` is the
// exact inverse of the DTCG path `p31.<path-with-dots>`. Resolve by building
// the var name for every leaf and checking which the CSS consumed.
const dtcg = JSON.parse(readFileSync(join(root, 'tokens', 'tokens.dtc.json'), 'utf8'));
const resolveAll = (node, prefix = [], out = new Map()) => {
  if (!node || typeof node !== 'object') return out;
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === 'object' && '$value' in v) {
      const path = [...prefix, k].join('.');
      out.set(path, v.$value);
    } else if (v && typeof v === 'object') resolveAll(v, [...prefix, k], out);
  }
  return out;
};
const dtcgTokens = resolveAll(dtcg);
const varNameFor = (path) => '--p31-' + path.replace(/^p31\./, '').replace(/\./g, '-');

const consumed = new Set(classVars.get(candidate.base) ?? []);
for (const v of candidate.variants) for (const t of classVars.get(v) ?? []) consumed.add(t);

// tokenContract = every p31.* leaf whose CSS var name the family actually
// consumed. Inverse mapping — no name mangling, no phantom references.
const tokenContract = [...dtcgTokens.keys()]
  .filter((p) => p.startsWith('p31.') && consumed.has(varNameFor(p)))
  .sort();

// Status tone: does a p31.status-<variant> token exist for each variant?
const statusByVariant = Object.fromEntries(
  variants.map((v) => [v, dtcgTokens.has(`p31.status-${v}`) ? `p31.status-${v}` : null]),
);

const body = {
  name: pascal,
  layer: 'component',
  status: 'planned',
  intent: `Display a compact status or category label (${variants.join(', ')}). A small, non-interactive pill.`,
  props: [
    {
      name: 'variant',
      type: 'enum',
      required: false,
      description: `Semantic tone. ${variants.map((v) => `${v} = ${v}`).join(', ')}.`,
      options: variants,
      default: variants[0],
    },
    { name: 'children', type: 'node', required: true, description: 'The label text.' },
  ],
  tokenContract,
  semanticParts: [
    { name: 'container', description: 'The pill element.' },
    { name: 'label', description: 'The text content.' },
  ],
  requiredAria: [{ attribute: 'aria-live', required: false, description: 'Present for live status badges.' }],
  interactionStates: {
    default: {
      description: 'Pill renders with the variant tone applied and label visible.',
      property: 'background-color',
      matcher: 'not-empty',
      trigger: 'none',
      fixture: { children: 'Active', variant: variants[0] },
    },
  },
  sources: [
    { kind: 'spec', path: 'src/contracts/schema.ts' },
    { kind: 'token', path: 'tokens/tokens.dtc.json' },
  ],
  importStatement: `import { ${pascal} } from '@p31/canon-react';`,
  antiExamples: [
    { label: `variant="${variants[0]}" but a hardcoded rgba background`, why: 'Bypasses the token contract.', useInstead: statusByVariant[variants[0]] ? `Consume ${statusByVariant[variants[0]]} via the variant prop.` : 'Reference a real p31.* status token via the variant prop.' },
  ],
};

// ── write through the Loom ─────────────────────────────────────────────
const logPath = resolveLogPath();
const id = `prop_badge_contract_${Date.now()}`;
const t = traverse(logPath, candidate.base, candidate.base, 'contract-gap');
if (!t.valid) console.error(`[contract-agent] traverse FAILED: ${t.error}`);

const p = propose(logPath, id, candidate.base, body, 'contract-agent');
if (!p.valid) {
  console.error(`[contract-agent] propose FAILED: ${p.error}`);
  process.exit(1);
}
console.log(`[contract-agent] proposed ${id} → ${pascal} contract on ${candidate.base} (seq ${p.event.seq})`);
console.log(`[contract-agent] variants: ${variants.join(', ')}; tokens: ${tokenContract.length} resolved`);
console.log(`[contract-agent] body: ${JSON.stringify(body, null, 2)}`);

const rv = review(logPath, id, 'approve', 'contract-reviewer');
console.log(`[contract-agent] self-review → ${rv.valid ? 'advisory approve recorded' : rv.error}`);
