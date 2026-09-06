#!/usr/bin/env node
/**
 * Structural checks: every role's WCD id exists; rubric weights sum to ~1.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const rolePath = join(root, 'src/data/role-packets.json');
const workPath = join(root, 'src/data/work-samples.json');

const roles = JSON.parse(await readFile(rolePath, 'utf8'));
const work = JSON.parse(await readFile(workPath, 'utf8'));

let errors = 0;

for (const r of roles.roles) {
  const id = r.workSample?.wcdId;
  if (!id || !work.samples[id]) {
    console.error(`Missing work sample for role ${r.id}: ${id}`);
    errors++;
  } else {
    const s = work.samples[id];
    if (!s.goodLookLike?.length) {
      console.error(`WCD ${id}: goodLookLike must be non-empty`);
      errors++;
    }
    if (!s.antiPatterns?.length) {
      console.error(`WCD ${id}: antiPatterns must be non-empty`);
      errors++;
    }
    if (Array.isArray(s.rubric)) {
      const sum = s.rubric.reduce((a, x) => a + (x.weight ?? 0), 0);
      if (Math.abs(sum - 1) > 0.02) {
        console.error(`Rubric weights for ${id} sum to ${sum}, expected 1.0`);
        errors++;
      }
    }
  }
}

if (errors) {
  console.error(`verify: ${errors} error(s)`);
  process.exit(1);
}
console.log('p31-delta-hiring: data OK (WCD map + rubric weights)');
process.exit(0);
