/**
 * audit — constitution validation test.
 * Generated scaffold. Replace with behavior tests as the domain matures.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateConstitution } from '@p31ca/govern';

const here = dirname(fileURLToPath(import.meta.url));
const constitution = JSON.parse(readFileSync(join(here, '..', 'constitution.json'), 'utf8'));

test('audit: constitution validates against schema 0.3.0', () => {
  const r = validateConstitution(constitution);
  assert.equal(r.valid, true, r.violations.join('\n'));
});
