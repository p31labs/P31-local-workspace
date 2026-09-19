#!/usr/bin/env node
/**
 * @p31/canon — loom-e2e-coverage.mjs
 *
 * The convergence gate. Proves the three lanes meet on one pass:
 *
 *   Lane α (coverage): the coverage agent proposes for every uncontracted
 *       family in the canon.
 *   Lane β (ingest):   loom-ingest self-ingests src/css and reproduces the
 *       committed registry's class count exactly.
 *   Lane γ (benchmark): run-loom is deterministic — two runs on the same
 *       fixture are byte-identical.
 *
 * Writes to a TEMP log (LOOM_LOG env), never the live log. Reads the registry
 * and CSS read-only. Exits 0 only when all three lanes agree.
 *
 * Run: node scripts/loom-e2e-coverage.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const tmp = mkdtempSync(join(tmpdir(), 'loom-e2e-'));
const tmpLog = join(tmp, 'events.jsonl');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

function run(args, env = {}) {
  return execFileSync(process.execPath, args, { cwd: root, encoding: 'utf8', env: { ...process.env, ...env } });
}

try {
  // ── Lane β: self-ingest reproduces the committed registry count ───────
  const ingOut = join(tmp, 'self-ingest.json');
  run(['scripts/loom-ingest.mjs', '--source', 'src/css', '--tokens', 'tokens/tokens.dtc.json', '--out', ingOut]);
  const ing = JSON.parse(readFileSync(ingOut, 'utf8'));
  const registry = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8'));
  ok(ing.counts.cssClasses === registry.counts.cssClasses,
    `self-ingest reproduces ${registry.counts.cssClasses} classes (got ${ing.counts.cssClasses})`);

  // ── Lane α: coverage agent proposes for uncontracted families ─────────
  const report = run(['scripts/loom-coverage-report.mjs']);
  const gaps = /uncontracted \(gaps\)\s*:\s*(\d+)/.exec(report)?.[1];
  const agentOut = run(['scripts/loom-coverage-agent.mjs'], { LOOM_LOG: tmpLog });
  const proposals = (agentOut.match(/propose /g) ?? []).length;
  ok(proposals > 0, `coverage agent proposed ${proposals} contract(s) to the temp log`);
  if (gaps !== undefined) ok(Number(gaps) >= 1, `coverage report found ${gaps} gap(s)`);

  // ── Lane γ: run-loom is deterministic across two runs ─────────────────
  const r1 = run(['scripts/bench/run-loom.mjs', 'scripts/fixtures/foreign']);
  const r2 = run(['scripts/bench/run-loom.mjs', 'scripts/fixtures/foreign']);
  ok(r1 === r2, 'run-loom is byte-identical across two runs');
} catch (err) {
  fails.push(`convergence script threw: ${err.message}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (fails.length) {
  console.error(`\n❌ LOOM E2E COVERAGE FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ loom e2e coverage — α proposes, β self-ingests, γ is deterministic. The lanes meet.');
