#!/usr/bin/env node
/**
 * @p31/canon — migrate-contract.mjs
 *
 * ONE-TIME migration tool. Rewrites the legacy `interactionStates: [...]`
 * array shape to the record-of-observables shape required by the schema
 * (schema.ts: InteractionStatesSchema = z.partialRecord(enum,
 * ObservablePredicateSchema)).
 *
 * WHY: a harness derives assertions from observable predicates. An array of
 * state names gives the harness names — nothing to run. Answers "does the
 * component have a hover state?" not "what happens on hover?". The record
 * shape carries the property/matcher/trigger that BECOME the Playwright test.
 *
 * Usage:
 *   node scripts/migrate-contract.mjs <relative-or-absolute/contract-file.ts>
 *
 * It will:
 *   1. Read the file
 *   2. Detect `interactionStates: ['a', 'b', ...]` (legacy) or
 *      `interactionStates: [ {name: 'a'}, ... ]` (transitional)
 *   3. Replace with the record shape using conservative default predicates
 *   4. Print the diff and a REVIEW notice — the defaults are placeholders
 *      that pass the matcher gate but carry no component-specific meaning.
 *      A maintainer MUST review each predicate before shipping.
 *
 * Conservative defaults (raw, `trigger: 'none'`, matcher 'not-empty' on the
 * p31 semantic background) are used because the migrator cannot know what
 * the component actually changes per state. Choosing nothing would fail the
 * build; choosing the wrong observable would fake a pass. These defaults
 * PASS the gate but loudly instruct the maintainer to review.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , rawPath] = process.argv;
if (!rawPath) {
  console.error('usage: node scripts/migrate-contract.mjs <contract-file.ts>');
  process.exit(1);
}

const file = resolve(rawPath);
let src;
try {
  src = readFileSync(file, 'utf8');
} catch {
  console.error(`migrate-contract: cannot read ${file}`);
  process.exit(1);
}

// ── detect legacy array shape ─────────────────────────────────────────
const LEGACY_RE = /interactionStates:\s*\[\s*((?:'[^']*'\s*,\s*)*)(?:'[^']*')\s*\]/;
const TRANSITIONAL_RE = /interactionStates:\s*\[\s*((?:\{[^}]*\}\s*,\s*)*)\{[^}]*\}\s*\]/;

let match = src.match(LEGACY_RE);

// Transitional object-with-name entries (came before the record shape).
if (!match) {
  const t = src.match(TRANSITIONAL_RE);
  if (t) {
    const names = [...t[1].matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1]);
    names.push(
      ...(src.match(/interactionStates:\s*\[\s*\{[^}]*name:\s*'([^']+)'/)?.slice(1) ?? []),
    );
    if (names.length > 0) {
      match = null; // handled below
      replaceLegacy(t[0], [...new Set(names)], src, file);
      process.exit(0);
    }
  }
}

if (!match) {
  console.error(`migrate-contract: no legacy interactionStates array found in ${file}`);
  console.error('  (the record-of-observables shape is already in use — nothing to do)');
  process.exit(0);
}

function defaultPredicate(state) {
  const prop = state === 'focus-visible' ? 'outline-style' : 'background-color';
  const matcher = state === 'focus-visible' ? 'not-equals' : 'not-empty';
  const expected = state === 'focus-visible' ? 'none' : undefined;
  return {
    description: `REVIEW NEEDED: conservative default for "${state}" — a maintainer must state what is observable in this state.`,
    property: prop,
    ...(expected ? { expected } : {}),
    matcher,
    trigger: state === 'focus-visible' ? 'focus' : 'none',
    fixture: {},
  };
}

function legacyNames(match) {
  const block = match[0];
  return [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const names = legacyNames(match);
if (names.length === 0) {
  console.error(`migrate-contract: could not extract state names from ${file}`);
  process.exit(1);
}

function quoteKey(n) {
  // Unquoted when a valid JS identifier, quoted otherwise (e.g. 'focus-visible').
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(n) ? n : JSON.stringify(n);
}

function buildRecord(names) {
  const entries = names.map((n) => {
    const pred = defaultPredicate(n);
    const fields = [
      `      description: ${JSON.stringify(pred.description)},`,
      `      property: ${JSON.stringify(pred.property)},`,
    ];
    if (pred.expected) fields.push(`      expected: ${JSON.stringify(pred.expected)},`);
    fields.push(`      matcher: ${JSON.stringify(pred.matcher)},`);
    fields.push(`      trigger: ${JSON.stringify(pred.trigger)},`);
    fields.push(`      fixture: ${JSON.stringify(pred.fixture)},`);
    return `    ${quoteKey(n)}: {\n${fields.join('\n')}\n    },`;
  });
  return `  interactionStates: {\n${entries.join('\n')}\n  },`;
}

function replaceLegacy(oldBlock, names, source, file) {
  const record = buildRecord(names);
  const next = source.replace(oldBlock, record);
  writeFileSync(file, next);
  console.log(`migrate-contract: rewrote interactionStates in ${file}`);
  console.log('');
  console.log('  legacy array shape   → record-of-observables');
  for (const n of names) console.log(`    • ${n}`);
  console.log('');
  console.log('  ⚠ REVIEW REQUIRED — the migrated predicates are CONSERVATIVE DEFAULTS:');
  console.log('    they pass the gate (property + matcher + fixture present) but do not yet');
  console.log('    say what the component actually does per state. Each `fixture` is {} —');
  console.log('    the render props (e.g. { children, disabled }) must be filled in or the');
  console.log('    harness will render the bare component. Before shipping, edit the contract');
  console.log('    and make each description/property/matcher/trigger/fixture precise.');
  console.log('    "prove or caveat, never fake" — a placeholder that passes without meaning');
  console.log('    is a soft lie.');
}

replaceLegacy(match[0], names, src, file);