#!/usr/bin/env node
/**
 * @p31/canon — bench/run-baseline.mjs
 *
 * The direct-model baseline. The actual model call is manual (no API key in
 * this repo) — this harness accepts a PRE-RECORDED model output JSON and
 * normalizes it into the same scored shape the Loom emits. It is a stub until
 * someone records real output; the harness is what ships, not the result.
 *
 * Run: node scripts/bench/run-baseline.mjs <recorded-output.json>
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const path = resolve(process.argv[2] ?? '');
let output;
try {
  output = JSON.parse(readFileSync(path, 'utf8'));
} catch {
  console.log(JSON.stringify({ error: 'no recorded baseline output at ' + path }));
  process.exit(0);
}
// Normalize: a recorded model response may wrap the contract in prose/keys.
const body = output.contract ?? output.body ?? output;
console.log(JSON.stringify(body, null, 2));
