#!/usr/bin/env node
/**
 * @p31/canon-react — verify-contract.mjs
 *
 * Four deterministic scorers applied to Button against buttonContract:
 *   shape-completeness  every schema-declared top-level field is present
 *   prop-validity       every declared prop exists in the contract
 *   enum-validity       every enum union matches the contract's options
 *   import-match        the contract importStatement matches the canonical import
 *
 * Static analysis — it reads source, not runtime. A runtime eval harness
 * comes in Phase 3; this catches source-level drift today.
 */
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const canonRoot = resolve(root, '..', 'canon');

const failures = [];
const fail = (msg) => failures.push(msg);

const contractModule = await import(
  join(canonRoot, 'src', 'contracts', 'button.contract.ts')
);
const contract = contractModule.buttonContract;
if (!contract) {
  console.error('⛔ verify-contract: buttonContract not exported from canon');
  process.exit(1);
}

const buttonSrc = readFileSync(join(root, 'src', 'Button', 'Button.tsx'), 'utf8');

// ── prop-validity ──────────────────────────────────────────────────
const ifaceMatch = buttonSrc.match(/interface\s+ButtonProps\s+extends[^{]*\{([\s\S]*?)\n\}/);
if (!ifaceMatch) {
  fail('prop-validity: could not locate ButtonProps interface');
} else {
  const declaredProps = [...ifaceMatch[1].matchAll(/^\s*([a-zA-Z][a-zA-Z0-9]*)\??:/gm)].map(
    (m) => m[1],
  );
  const contractPropNames = new Set(contract.props.map((p) => p.name));
  const allowedHtml = new Set(['className', 'onClick', 'type', 'asChild']);
  for (const p of declaredProps) {
    if (!contractPropNames.has(p) && !allowedHtml.has(p)) {
      fail(`prop-validity: Button declares "${p}" not in contract`);
    }
  }
  for (const p of contract.props) {
    if (!declaredProps.includes(p.name)) {
      fail(`prop-validity: contract declares "${p.name}" not in Button`);
    }
  }
}

// ── enum-validity ──────────────────────────────────────────────────
const enumProbes = [
  { name: 'ButtonVariant', prop: 'variant' },
  { name: 'ButtonSize', prop: 'size' },
];
for (const { name, prop } of enumProbes) {
  const typeMatch = buttonSrc.match(new RegExp(`export type ${name} = ([^;]+);`));
  if (!typeMatch) {
    fail(`enum-validity: could not locate "export type ${name}"`);
    continue;
  }
  const declaredValues = [...typeMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const contractPropDef = contract.props.find((p) => p.name === prop);
  if (!contractPropDef?.options) {
    fail(`enum-validity: contract has no options for "${prop}"`);
    continue;
  }
  for (const v of declaredValues) {
    if (!contractPropDef.options.includes(v)) {
      fail(`enum-validity: Button accepts ${name}="${v}" not in contract`);
    }
  }
  for (const v of contractPropDef.options) {
    if (!declaredValues.includes(v)) {
      fail(`enum-validity: contract declares ${prop}="${v}" not in Button`);
    }
  }
}

// ── import-match ───────────────────────────────────────────────────
const expectedImport = "import { Button } from '@p31/canon-react';";
if (contract.importStatement !== expectedImport) {
  fail(`import-match: contract says "${contract.importStatement}", expected "${expectedImport}"`);
}

// ── state-record gate ──────────────────────────
if (Array.isArray(contract.interactionStates)) {
  fail('interactionStates is still the legacy array shape');
}
if (typeof contract.interactionStates !== 'object' || contract.interactionStates === null) {
  fail('interactionStates is not a record of observable predicates');
}
for (const [state, spec] of Object.entries(contract.interactionStates)) {
  if (!spec?.property) {
    fail(`interactionStates.${state} has no observable.property`);
  }
  if (!spec?.matcher) {
    fail(`interactionStates.${state} has no observable.matcher`);
  }
}

// ── shape-completeness ─────────────────────────────────────────────
// The contract is the only input to the derived-state harness. If a
// top-level field is dropped — e.g. during a file reconstruction — the
// schema can still accept the remainder because `caveats`, `antiExamples`,
// and `status` are defaulted. This scorer makes "structurally complete"
// machine-checked instead of a prose claim.
const requiredFields = [
  'name', 'layer', 'status', 'intent', 'props', 'tokenContract',
  'semanticParts', 'requiredAria', 'interactionStates',
  'caveats', 'sources', 'importStatement', 'antiExamples',
];
for (const field of requiredFields) {
  if (!(field in contract)) {
    fail(`shape-completeness: contract is missing top-level field "${field}"`);
    continue;
  }
  const value = contract[field];
  const empty =
    value === undefined ||
    value === null ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);
  if (empty) {
    fail(`shape-completeness: field "${field}" is present but empty`);
  }
}

if (failures.length) {
  console.error('\n❌ canon-react verify-contract FAILED:');
  for (const f of failures) console.error(`   • ${f}`);
  console.error('');
  process.exit(1);
}

console.log(`✅ canon-react verify-contract: Button matches contract`);
console.log(`   shape-completeness ✓ (${requiredFields.length} fields)`);
console.log(`   prop-validity  ✓ (${contract.props.length} props)`);
console.log(`   enum-validity  ✓ (${enumProbes.length} enums)`);
console.log(`   import-match   ✓ ("${expectedImport}")`);
console.log(`   state-record   ✓ (${Object.keys(contract.interactionStates).length} states)`);