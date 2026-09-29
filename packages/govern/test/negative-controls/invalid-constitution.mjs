#!/usr/bin/env node
/**
 * Negative control for the `govern-validate` gate.
 *
 * Proves the validator can reject a broken constitution. Feeds a fixture that
 * is missing required fields (genesisTimestamp, aspirational, auditLog) and
 * asserts validateConstitution returns invalid.
 *
 * STRONG CONTRACT: this must exit 0 AND emit NEGATIVE_CONTROL_OK to prove the
 * gate can fail. If the validator accepts the broken fixture, exit 1 — the
 * validate gate is furniture.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const { validateConstitution } = await import(join(here, '../../dist/index.js'));

const broken = {
  schema: 'https://p31ca.org/schemas/govern/constitution/0.3.0.json',
  domain: 'broken',
  version: '0.0.1',
  // missing genesisTimestamp, aspirational, auditLog, review.abdication
  canonicalSource: { path: 'x', description: 'x' },
  mirrors: [],
  gates: [],
  ratchets: [],
  runbooks: [],
  lessons: [],
  fleet: [],
  review: { who: [{ type: 'role', id: 'b' }], cadence: 'c', onFailure: 'f' },
};

const r = validateConstitution(broken);
if (r.valid) {
  console.error('VALIDATOR ACCEPTED A BROKEN CONSTITUTION — the validate gate cannot fail, so it is furniture.');
  process.exit(1);
}
console.log('NEGATIVE_CONTROL_OK');