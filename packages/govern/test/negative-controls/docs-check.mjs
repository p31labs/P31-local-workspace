#!/usr/bin/env node
/**
 * Negative control for the docs:check gate.
 *
 * Proves docs-check can FAIL on a doc suite that lies. Builds a temp docs
 * dir whose GOVERNANCE.md names a gate that does not exist (hallucinated),
 * runs docs-check --docs-dir <tmp>, and asserts it exits non-zero.
 *
 * STRONG CONTRACT: this must exit 0 AND emit NEGATIVE_CONTROL_OK to prove the
 * gate can fail. If docs-check accepts the hallucinated gate, exit 1 — the
 * docs:check gate is furniture.
 */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const docsCheck = resolve(here, '../../scripts/docs-check.mjs');

function resolve(...p) {
  return join(...p);
}

const dir = mkdtempSync(join(tmpdir(), 'govern-nc-docs-'));
try {
  const required = ['GOVERNANCE.md', 'COMPLIANCE.md', 'RUNBOOKS.md', 'EVIDENCE.md', 'DECISIONS.md'];
  for (const d of required) writeFileSync(join(dir, d), '# placeholder\n');
  // GOVERNANCE.md names a gate that does not exist → docs-check must fail.
  writeFileSync(
    join(dir, 'GOVERNANCE.md'),
    '# Test\nThis references gate:nonexistent-hallucinated-gate which is not real.\n',
  );

  let failedAsExpected = false;
  try {
    execSync(`node ${docsCheck} --docs-dir ${dir}`, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 });
  } catch {
    failedAsExpected = true;
  }

  if (!failedAsExpected) {
    console.error('docs:check ACCEPTED a doc referencing a nonexistent gate — it cannot fail, so it is furniture.');
    process.exit(1);
  }
  console.log('docs:check correctly failed on a hallucinated gate reference.');
  console.log('NEGATIVE_CONTROL_OK');
} finally {
  rmSync(dir, { recursive: true, force: true });
}