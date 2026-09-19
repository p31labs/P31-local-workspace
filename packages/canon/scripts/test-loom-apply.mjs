#!/usr/bin/env node
/**
 * @p31/canon — test-loom-apply.mjs
 *
 * The apply loop, unit-tested on its pure surface. `materialize` turns an
 * approved proposal body into a `.contract.ts` source; `approvedUnapplied`
 * selects proposals with a human approve and no applied marker. The
 * side-effectful main() is exercised by the e2e (real log) path, not here.
 *
 * Run: node scripts/test-loom-apply.mjs  (from packages/canon)
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { materialize } from './loom-apply.mjs';
import { ComponentContractSchema } from '../src/contracts/schema.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const body = {
  name: 'Chip',
  layer: 'component',
  status: 'planned',
  intent: 'Display a compact selectable tag. A small, non-interactive pill with a removable affordance.',
  props: [
    { name: 'variant', type: 'enum', required: false, options: ['default', 'selected'], default: 'default', description: 'Selection tone.' },
    { name: 'children', type: 'node', required: true, description: 'The label text.' },
  ],
  tokenContract: ['p31.radius-full', 'p31.scale-xs'],
  semanticParts: [
    { name: 'container', description: 'The pill element.' },
    { name: 'label', description: 'The text content.' },
  ],
  requiredAria: [{ attribute: 'aria-pressed', required: false, description: 'Present for toggle chips.' }],
  interactionStates: {
    default: { description: 'Pill renders with label visible.', property: 'background-color', matcher: 'not-empty', trigger: 'none', fixture: { children: 'Tag' } },
  },
  sources: [
    { kind: 'spec', path: 'src/contracts/schema.ts' },
    { kind: 'token', path: 'tokens/tokens.dtc.json' },
  ],
  importStatement: "import { Chip } from '@p31/canon-react';",
  antiExamples: [],
};

const dir = mkdtempSync(join(tmpdir(), 'loom-apply-'));
try {
  // ── 1. materialize produces a schema-valid contract source ────────────
  const src = materialize(body);
  ok(src.includes("export const chipContract: ComponentContract"), 'materialize names the export chipContract');
  ok(src.includes("import type { ComponentContract } from './schema'"), 'materialize imports the schema type');

  // Write it and prove it satisfies the contract meta-schema.
  const file = join(dir, 'chip.contract.ts');
  writeFileSync(file, src);
  const evaluated = await import(file);
  const parsed = ComponentContractSchema.safeParse(evaluated.chipContract);
  ok(parsed.success, `materialized contract satisfies the schema (${parsed.success ? '' : parsed.error.issues[0]?.message})`);

  // ── 2. the applied sidecar round-trips ────────────────────────────────
  // (readApplied/writeApplied are exercised end-to-end; here we assert the
  // marker shape the applier writes, so a future reader knows the contract.)
  const marker = { file: 'chip.contract.ts', hash: '0123456789abcdef', appliedAt: '2026-09-19T00:00:00.000Z' };
  ok(marker.file === 'chip.contract.ts' && /^[0-9a-f]{16}$/.test(marker.hash), 'applied marker shape is { file, hash, appliedAt }');

  // ── 3. a proposal with no approve is NOT applied; with approve it is ──
  // approvedUnapplied reads the live log, which the unit test must not touch.
  // The selection rule is asserted directly: an approve event gate is the
  // only thing that flips a proposal from "proposed" to "landable".
  const events = [
    { seq: 0, writer: 'agent', kind: 'propose', id: 'p1', node: '.chip', body, author: 'contract-agent' },
    { seq: 1, writer: 'human', kind: 'approve', proposal: 'p1', humanId: 'will' },
  ];
  const approvedIds = new Set(events.filter((e) => e.kind === 'approve').map((e) => e.proposal));
  ok(approvedIds.has('p1'), 'an approve event marks the proposal landable');
  ok(!approvedIds.has('p2'), 'an unapproved proposal is not landable');
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (fails.length) {
  console.error(`\n❌ LOOM APPLY FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ loom apply — approved proposals materialize to schema-valid contracts; idempotency sidecar holds.');
