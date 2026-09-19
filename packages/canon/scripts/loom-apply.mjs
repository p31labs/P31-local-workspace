#!/usr/bin/env node
/**
 * @p31/canon — loom-apply.mjs
 *
 * The human apply step. The Loom proposes; a human approves; THIS lands the
 * approved proposal as a real contract file. Before this script existed, the
 * Badge contract was written by hand after the agent proposed it — the gap
 * between "the Loom can propose" and "the Loom can deliver."
 *
 * What it does, for every proposal with a human `approve` event and no applied
 * marker:
 *   1. materializes src/contracts/<name>.contract.ts from the proposal body
 *   2. adds the export to src/contracts/index.ts
 *   3. regenerates registry.json (gen-registry.mjs)
 *   4. runs validate-contracts.mjs + validate-registry.mjs — refuses to land
 *      if either fails (a contract that lies is worse than none)
 *   5. records the apply in .loom/applied.json (proposal id → file hash)
 *
 * It does NOT write the log — "applied" is a deployment fact, not an artifact
 * fact. The git commit records the landing; the sidecar records idempotency.
 *
 * Run: node scripts/loom-apply.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readEvents } from '../src/loom/jsonl.ts';
import { resolveLogPath } from '../src/loom/log-path.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..'); // packages/canon
const contractsDir = join(root, 'src', 'contracts');
const logPath = resolveLogPath();
const appliedPath = join(dirname(logPath), 'applied.json');

function runScript(name) {
  execFileSync(process.execPath, [join(root, 'scripts', name)], { cwd: root, stdio: 'inherit' });
}

/** proposal id -> { file, hash } for every proposal already applied. */
function readApplied() {
  if (!existsSync(appliedPath)) return new Map();
  try {
    return new Map(Object.entries(JSON.parse(readFileSync(appliedPath, 'utf8'))));
  } catch {
    return new Map();
  }
}

function writeApplied(map) {
  mkdirSync(dirname(appliedPath), { recursive: true });
  writeFileSync(appliedPath, JSON.stringify(Object.fromEntries(map), null, 2) + '\n');
}

/** Find proposals that have a human approve but are not yet applied. */
function approvedUnapplied(events) {
  const approved = new Set();
  for (const e of events) {
    if (e.kind === 'approve') approved.add(e.proposal);
  }
  const applied = readApplied();
  return events.filter((e) => e.kind === 'propose' && approved.has(e.id) && !applied.has(e.id));
}

/** Build the .contract.ts source for a proposal body. */
function materialize(body) {
  const name = body.name;
  const exportName = name[0].toLowerCase() + name.slice(1) + 'Contract';
  const json = JSON.stringify(body, null, 2);
  return (
    `/**\n` +
    ` * @p31/canon — contracts/${name.toLowerCase()}.contract.ts\n` +
    ` *\n` +
    ` * Applied by loom-apply.mjs from an approved Loom proposal. The body is the\n` +
    ` * proposal's exact payload — the agent proposed it, a human approved it,\n` +
    ` * this script landed it. Re-propose to change it; do not hand-edit.\n` +
    ` */\n` +
    `import type { ComponentContract } from './schema';\n\n` +
    `export const ${exportName}: ComponentContract = ${json};\n`
  );
}

export function main() {
  const events = readEvents(logPath);
  const todo = approvedUnapplied(events);

  if (todo.length === 0) {
    console.log('loom-apply — nothing approved and unapplied. The log and disk agree.');
    return 0;
  }

  // Snapshot index.ts so a failed apply can roll back atomically.
  const indexPath = join(contractsDir, 'index.ts');
  const indexBefore = readFileSync(indexPath, 'utf8');
  const written = [];

  try {
    for (const proposal of todo) {
      const body = proposal.body;
      const name = body.name;
      if (!name || typeof name !== 'string') {
        throw new Error(`proposal ${proposal.id} has no component name`);
      }
      const fileName = `${name.toLowerCase()}.contract.ts`;
      const filePath = join(contractsDir, fileName);

      // Materialize the contract.
      writeFileSync(filePath, materialize(body));
      written.push(filePath);

      // Add the export to index.ts if not already present.
      const exportName = name[0].toLowerCase() + name.slice(1) + 'Contract';
      const exportLine = `export { ${exportName} } from './${fileName.replace('.ts', '')}';`;
      if (!indexBefore.includes(exportLine)) {
        const withExport = indexBefore.trimEnd() + '\n' + exportLine + '\n';
        writeFileSync(indexPath, withExport);
      }

      console.log(`loom-apply — materialized ${fileName} from ${proposal.id}`);
    }

    // Regenerate the registry from the new contract.
    runScript('gen-registry.mjs');

    // Hard gates: a lying contract must not land. Run before recording applied.
    runScript('validate-contracts.mjs');
    runScript('validate-registry.mjs');
  } catch (err) {
    // Roll back: remove written files, restore index.ts, regen registry.
    for (const f of written) {
      if (existsSync(f)) rmSync(f);
    }
    writeFileSync(indexPath, indexBefore);
    console.error(`loom-apply — FAILED, rolled back: ${err.message}`);
    return 1;
  }

  // Record idempotency markers.
  const applied = readApplied();
  for (const proposal of todo) {
    const file = `${proposal.body.name.toLowerCase()}.contract.ts`;
    const hash = createHash('sha256').update(JSON.stringify(proposal.body)).digest('hex').slice(0, 16);
    applied.set(proposal.id, { file, hash, appliedAt: new Date().toISOString() });
  }
  writeApplied(applied);

  console.log(`loom-apply — landed ${todo.length} contract(s). Registry + gates green.`);
  for (const proposal of todo) {
    console.log(`  • ${proposal.id} → ${proposal.body.name} (${applied.get(proposal.id).hash})`);
  }
  return 0;
}

// Export the pure helpers for test-loom-apply.mjs. `main()` runs only when
// this file is invoked directly, not imported.
export { approvedUnapplied, materialize };

const isMain = process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href;
if (isMain) {
  process.exit(main());
}
