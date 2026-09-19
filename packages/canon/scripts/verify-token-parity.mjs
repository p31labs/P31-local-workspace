#!/usr/bin/env node
/**
 * @p31/canon — verify-token-parity.mjs
 *
 * The no-regression guarantee for making canon the SOLE token source.
 *
 * Baseline:  packages/design-core/src/css/tokens.css   (what ships today)
 * Candidate: packages/canon/dist/tokens.css            (what will ship)
 *
 * It asserts, using postcss (design-core nests conditional rules inside
 * :root, which a regex cannot parse):
 *
 *   1. COVERAGE — every --p31-* name design-core defines anywhere exists
 *      somewhere in canon.
 *   2. PARITY   — for every selector context BOTH files share (:root,
 *      [data-brand=*], [data-spoons=*], [data-dark-mode], [data-theme="light"],
 *      [data-portal=*]), each shared token declares the SAME value.
 *
 * Any missing name or divergent value exits 1. Until the 19 known shared-name
 * divergences are reconciled, this gate is RED by design — it is the switch
 * that blocks the Phase 3 flip.
 *
 * Usage: node scripts/verify-token-parity.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..', '..');
const BASELINE = resolve(root, 'packages', 'design-core', 'src', 'css', 'tokens.css');
const CANDIDATE = resolve(root, 'packages', 'canon', 'dist', 'tokens.css');

/** selector -> Map(token -> value), using each rule's DIRECT declarations. */
function parse(css) {
  const tree = postcss.parse(css);
  const contexts = new Map();
  tree.walkRules((rule) => {
    const selector = rule.selector.replace(/\s+/g, ' ').trim();
    let vars = contexts.get(selector);
    if (!vars) contexts.set(selector, (vars = new Map()));
    rule.each((node) => {
      if (node.type === 'decl' && node.prop.startsWith('--p31-')) {
        vars.set(node.prop, node.value.replace(/\s+/g, ' ').trim());
      }
    });
  });
  return contexts;
}

function tokenUnion(contexts) {
  const out = new Map();
  for (const vars of contexts.values()) for (const [k, v] of vars) if (!out.has(k)) out.set(k, v);
  return out;
}

/** Evaluate an innermost calc() of the form `A op B` in px. */
function evalInnermostCalc(expr) {
  const m = expr.trim().match(/^(-?[\d.]+)px\s*([+\-*/])\s*(-?[\d.]+)(?:px)?$/);
  if (!m) return null;
  const a = parseFloat(m[1]);
  const b = parseFloat(m[3]);
  const r = m[2] === '+' ? a + b : m[2] === '-' ? a - b : m[2] === '*' ? a * b : a / b;
  return Number.isFinite(r) ? `${r}px` : null;
}

/** Resolve var(--p31-*) chains and simple px calc() so `calc(x/2)` and its
 *  computed literal compare equal. Unknown/unsupported forms pass through. */
function resolveValue(value, vars) {
  let v = value;
  for (let i = 0; i < 25; i++) {
    const m = v.match(/var\((--p31-[a-z0-9-]+)\)/);
    if (!m || !vars.has(m[1])) break;
    v = v.replace(m[0], vars.get(m[1]));
  }
  for (let i = 0; i < 25; i++) {
    const m = v.match(/calc\(([^()]+)\)/);
    if (!m) break;
    const r = evalInnermostCalc(m[1]);
    if (r === null) break;
    v = v.replace(m[0], r);
  }
  return v;
}

const baseline = parse(readFileSync(BASELINE, 'utf8'));
const candidate = parse(readFileSync(CANDIDATE, 'utf8'));

const baseTokens = tokenUnion(baseline);
const candTokens = tokenUnion(candidate);

const missing = [...baseTokens.keys()].filter((t) => !candTokens.has(t));

const baseRoot = baseline.get(':root') ?? new Map();
const candRoot = candidate.get(':root') ?? new Map();

const divergences = [];
for (const [selector, vars] of baseline) {
  const cand = candidate.get(selector);
  if (!cand) continue; // context absent from candidate; coverage catches its tokens
  const bVars = new Map([...baseRoot, ...vars]);
  const cVars = new Map([...candRoot, ...cand]);
  for (const [token, value] of vars) {
    if (!cand.has(token)) continue;
    const bResolved = resolveValue(value, bVars);
    const cResolved = resolveValue(cand.get(token), cVars);
    if (bResolved !== cResolved) {
      divergences.push({ selector, token, baseline: value, candidate: cand.get(token) });
    }
  }
}

console.log('token parity — design-core (baseline) vs canon (candidate)\n');
console.log(`  baseline tokens: ${baseTokens.size}`);
console.log(`  candidate tokens: ${candTokens.size}`);
console.log(`  missing from canon: ${missing.length}`);
console.log(`  shared-context divergences: ${divergences.length}`);

if (missing.length) {
  console.error('\n❌ MISSING TOKENS (canon cannot replace design-core):');
  for (const t of missing) console.error(`   • ${t}`);
}

if (divergences.length) {
  console.error('\n❌ VALUE DIVERGENCES (would change rendering after the flip):');
  for (const d of divergences) {
    console.error(`   • ${d.selector}  ${d.token}`);
    console.error(`       design-core: ${d.baseline}`);
    console.error(`       canon:       ${d.candidate}`);
  }
}

if (missing.length || divergences.length) {
  console.error('\n❌ PARITY FAILED — canon is not yet a drop-in for design-core.');
  process.exit(1);
}

console.log('\n✅ PARITY OK — canon is a drop-in for design-core.');
