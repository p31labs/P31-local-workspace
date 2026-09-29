#!/usr/bin/env node
/**
 * validate.mjs — P31 Quantum Material DTCG token validation gate.
 *
 * Verifies packages/design-core/tokens/tokens.dtc.json against the W3C DTCG
 * 2025.10 schema + model correctness (unresolved refs, missing/invalid
 * $type, type/value mismatch) using @design-token-kit/cli.
 *
 * Also regenerates tokens.dtc.json from the CSS-native tokens.json via
 * convert-css-to-dtcg.mjs so the portable file can never drift from source.
 *
 * Usage:
 *   node validate.mjs          # regenerate + validate
 *   node validate.mjs --only   # validate only (no regenerate)
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..'); // tools/token-validation
const WORKSPACE = resolve(ROOT, '..', '..'); // workspace root
const DESIGN_CORE = resolve(WORKSPACE, 'packages', 'design-core');
const CANON = resolve(WORKSPACE, 'packages', 'canon', 'tokens', 'tokens.dtc.json');
const TOKENS_SRC = resolve(DESIGN_CORE, 'tokens', 'tokens.json');
const TOKENS_DTC = resolve(DESIGN_CORE, 'tokens', 'tokens.dtc.json');
const CONVERTER = resolve(DESIGN_CORE, 'scripts', 'convert-css-to-dtcg.mjs');
const DTOKENS = resolve(ROOT, 'node_modules', '.bin', 'dtokens');

const only = process.argv.includes('--only');

function run(cmd, args) {
  const out = execFileSync(cmd, args, { encoding: 'utf8', cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
  return out;
}

try {
  if (!only) {
    console.log('▶ regenerating tokens.dtc.json from tokens.json …');
    run(process.execPath, [CONVERTER]);
  }

  console.log(`▶ validating ${TOKENS_DTC} …`);
  run(DTOKENS, ['check', TOKENS_DTC]);
  console.log('✅ design-core tokens.dtc.json — PASSED');

  // The canon token file is also CSS-string-shaped; report its status so the
  // gap is visible until the canon converter lands.
  console.log(`\n▶ validating ${CANON} …`);
  try {
    run(DTOKENS, ['check', CANON]);
    console.log('✅ canon tokens.dtc.json — PASSED');
  } catch (e) {
    const count = String(e.stdout ?? '').split('\n').filter((l) => l.includes('[schema] error')).length;
    console.log(`⚠️  canon tokens.dtc.json — NOT YET DTCG-VALID (${count} schema errors; CSS-string values need the canon converter).`);
  }

  console.log('\n✅ DTCG token validation PASSED (design-core).');
  process.exit(0);
} catch (e) {
  console.error(`\n❌ DTCG token validation FAILED.\n${e.stdout ?? ''}${e.message}`);
  process.exit(1);
}