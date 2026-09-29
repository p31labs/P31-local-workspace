#!/usr/bin/env node
/**
 * Negative control for gate:pickle-names.
 *
 * A gate that cannot be shown to fail is furniture. This control builds a
 * sabotaged fixture (passportInvariants reports a duplicate pickle name),
 * runs the REAL gate against it via the PICKLE_NC_FIXTURE injection point,
 * and asserts the gate exits 1. Emits NEGATIVE_CONTROL_OK on success.
 */
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const gate = resolve('/home/p31/P31-local-workspace/tools/family/pickle-names-gate.mjs');

let dir;
try {
  dir = mkdtempSync(join(tmpdir(), 'govern-nc-pickle-'));
  mkdirSync(join(dir, 'pickle-names'), { recursive: true });

  // Sabotaged module: passportInvariants reports a duplicate pickle name.
  writeFileSync(
    join(dir, 'pickle-names', 'export.js'),
    `export function pickleInvariants() { return { ok: true, failures: [] }; }\n` +
    `export function passportInvariants() { return { ok: false, failures: ["duplicate pickle name (sabotaged fixture)"] }; }\n`,
  );

  let exit = 0;
  try {
    execFileSync(process.execPath, [gate], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PICKLE_NC_FIXTURE: join(dir, 'pickle-names', 'export.js') },
    });
  } catch (e) {
    exit = (e && e.status !== undefined ? e.status : 1);
  }

  if (exit === 1) {
    console.log('NEGATIVE_CONTROL_OK: pickle gate rejected the sabotaged invariants (exit 1)');
    process.exit(0);
  }
  console.error(`NC_FAILED: gate exited ${exit}, expected 1 — pickle gate could not be shown to fail`);
  process.exit(1);
} finally {
  if (dir) rmSync(dir, { recursive: true, force: true });
}