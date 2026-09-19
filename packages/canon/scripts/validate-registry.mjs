#!/usr/bin/env node
/**
 * @p31/canon — validate-registry.mjs
 *
 * The coverage gate. The portal can only show what this registry contains, so
 * "the portal shows everything" is only true if the registry is complete and
 * consistent. Hard failures:
 *
 *   - a contract file with no registry entry
 *   - a registry component whose contract file is missing
 *   - a component marked status:"shipped" with no implementation on disk
 *   - a contract tokenContract entry that does not resolve in dist/tokens.css
 *   - duplicate component slugs
 *
 * Soft report (exit 0): CSS classes that reference tokens but are not bound to
 * any component contract — the portal's component worklist.
 *
 * Run: node scripts/validate-registry.mjs  (from packages/canon)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const repo = resolve(root, '..', '..');

const registry = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8'));
const tokenNames = new Set(registry.tokens.map((t) => t.name));
const componentByContract = new Map(registry.components.map((c) => [c.contract, c]));

const failures = [];

// 1. every contract file has a registry entry
const contractsDir = join(root, 'src', 'contracts');
const contractFiles = existsSync(contractsDir)
  ? readdirSync(contractsDir).filter((f) => f.endsWith('.contract.ts') && !f.startsWith('__'))
  : [];
for (const f of contractFiles) {
  const rel = `src/contracts/${f}`;
  if (!componentByContract.has(rel)) failures.push(`contract with no registry entry: ${rel}`);
}

// 2. every registry component maps to an existing contract file
for (const c of registry.components) {
  if (!existsSync(join(root, c.contract))) failures.push(`${c.name}: contract file missing: ${c.contract}`);
}

// 3. shipped components must be implemented
for (const c of registry.components) {
  const impl = join(repo, 'packages', 'canon-react', 'src', c.name, `${c.name}.tsx`);
  if (c.status === 'shipped' && !existsSync(impl)) failures.push(`${c.name}: status shipped but no implementation at ${impl}`);
}

// 4. every contract token resolves (contracts use DTCG dotted paths
//    `p31.color.action.primary`; the registry holds CSS vars
//    `--p31-color-action-primary`)
for (const c of registry.components) {
  for (const t of c.tokens) {
    const cssName = '--' + t.replace(/\./g, '-');
    if (!tokenNames.has(cssName)) failures.push(`${c.name}: tokenContract "${t}" (${cssName}) does not resolve in dist/tokens.css`);
  }
}

// 5. no duplicate slugs
const seen = new Set();
for (const c of registry.components) {
  if (seen.has(c.slug)) failures.push(`duplicate component slug: ${c.slug}`);
  seen.add(c.slug);
}

// soft report — classes not bound to any component contract
const contractedTokens = new Set(registry.components.flatMap((c) => c.tokens));
const candidates = registry.cssClasses.filter(
  (cl) => cl.tokens.length && !cl.tokens.some((t) => contractedTokens.has(t)),
);

console.log('validate-registry — ' + JSON.stringify(registry.counts));
if (candidates.length) {
  console.log(`\n${candidates.length} CSS classes reference tokens but belong to no component contract (portal worklist):`);
  for (const c of candidates.slice(0, 40)) console.log(`   ${c.name.padEnd(28)} ${c.files.join(', ')}`);
  if (candidates.length > 40) console.log(`   … and ${candidates.length - 40} more`);
}

if (failures.length) {
  console.error(`\n❌ REGISTRY INVALID — ${failures.length} failure(s):`);
  for (const f of failures) console.error(`   • ${f}`);
  process.exit(1);
}

console.log('\n✅ registry valid — every contract registered, every token resolves.');
