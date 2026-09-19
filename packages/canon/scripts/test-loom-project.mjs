#!/usr/bin/env node
/**
 * @p31/canon — test-loom-project.mjs
 *
 * The Weft, unit-tested. `project()` is the paradigm function: same warp,
 * same weft, different viewer → different projection. `view.save` is a
 * canonical warp event that enters LoomState and canonicalize. The weft is
 * operational telemetry with its own gate and retention.
 *
 * Run: node scripts/test-loom-project.mjs  (from packages/canon)
 */
import { ReplayGate, canonicalize } from '../src/loom/gate.ts';
import { replay } from '../src/loom/events.ts';
import { WeftGate, pruneWeft } from '../src/loom/weft.ts';
import { project } from '../src/loom/project.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

// ── build a small warp: propose + approve + view.save ───────────────────
const warpGate = new ReplayGate();
warpGate.append({ writer: 'agent', kind: 'propose', id: 'p1', node: '.badge', body: { draft: true }, author: 'contract-agent' }); // seq 0
warpGate.append({ writer: 'human', kind: 'approve', proposal: 'p1', humanId: 'alice' }); // seq 1
warpGate.append({ writer: 'human', kind: 'view.save', label: 'badge review pass', from: 0, to: 1, humanId: 'alice' }); // seq 2
const warp = warpGate.getLog();

// ── 1. view.save enters canonicalize ────────────────────────────────────
{
  const canon = canonicalize(replay(warp));
  ok(canon.includes('badge review pass'), 'view.save label appears in canonicalize');
  ok(canon.includes('saves'), 'canonicalize has a saves section');

  const noSave = canonicalize(replay(warp.filter((e) => e.kind !== 'view.save')));
  ok(noSave !== canon, 'a saved read changes the canonical identity');
}

// ── 2. view.save gate validation ────────────────────────────────────────
{
  const g = new ReplayGate();
  g.append({ writer: 'agent', kind: 'propose', id: 'p1', node: '.badge', body: {} }); // seq 0
  const emptyLabel = g.append({ writer: 'human', kind: 'view.save', label: '  ', from: 0, to: 0 });
  ok(!emptyLabel.valid, 'empty label rejected');
  const reversed = g.append({ writer: 'human', kind: 'view.save', label: 'x', from: 5, to: 2 });
  ok(!reversed.valid, 'from > to rejected');
  const beyondHead = g.append({ writer: 'human', kind: 'view.save', label: 'x', from: 0, to: 5 });
  ok(!beyondHead.valid, 'to beyond head rejected');
  const negative = g.append({ writer: 'human', kind: 'view.save', label: 'x', from: -1, to: 0 });
  ok(!negative.valid, 'negative from rejected');
  const good = g.append({ writer: 'human', kind: 'view.save', label: 'ok', from: 0, to: 0 });
  ok(good.valid, 'valid save accepted');
}

// ── 3. weft gate + prune ────────────────────────────────────────────────
{
  const w = new WeftGate();
  ok(w.append({ kind: 'view.mode', mode: 'explore', warpSeq: 0 }).valid, 'view.mode accepted');
  ok(!w.append({ kind: 'view.mode', mode: 'nonsense', warpSeq: 0 }).valid, 'bad mode rejected');
  ok(!w.append({ kind: 'view.pin', node: '', pinned: true, warpSeq: 0 }).valid, 'empty pin rejected');
  ok(!w.append({ kind: 'view.scrub', at: -1, warpSeq: 0 }).valid, 'negative scrub rejected');
  ok(!w.append({ kind: 'view.pin', node: '.badge', pinned: true, warpSeq: -1 }).valid, 'negative warpSeq rejected');

  const pruned = pruneWeft(Array.from({ length: 100_005 }, (_, i) => ({ seq: i, ts: 't', kind: 'view.scrub', at: i, warpSeq: i })));
  ok(pruned.length === 100_000, 'pruneWeft caps at MAX_WEFT_EVENTS');
  ok(pruned[0].seq === 5, 'pruneWeft keeps the newest window');
}

// ── 4. project(): same logs, different viewer, different projection ─────
{
  const weftGate = new WeftGate();
  weftGate.append({ kind: 'view.mode', mode: 'timeline', warpSeq: 1, humanId: 'alice' });
  weftGate.append({ kind: 'view.pin', node: '.badge', pinned: true, warpSeq: 1, humanId: 'alice' });
  weftGate.append({ kind: 'view.scrub', at: 0, warpSeq: 1, humanId: 'alice' });
  weftGate.append({ kind: 'view.mode', mode: 'diff', warpSeq: 1, humanId: 'bob' });
  weftGate.append({ kind: 'view.pin', node: '.topbar', pinned: true, warpSeq: 1, humanId: 'bob' });
  const weft = weftGate.getLog();

  const alice = project(warp, weft, 'alice', { warpSeq: 2 });
  const bob = project(warp, weft, 'bob', { warpSeq: 2 });

  ok(alice.mode === 'timeline', 'alice sees timeline');
  ok(bob.mode === 'diff', 'bob sees diff');
  ok(alice.pins.includes('.badge'), 'alice pinned .badge');
  ok(bob.pins.includes('.topbar'), 'bob pinned .topbar');
  ok(alice.saves.length === 1 && alice.saves[0].label === 'badge review pass', 'alice has her saved read');
  ok(bob.saves.length === 0, 'bob has no saved read');

  const aliceStr = JSON.stringify(alice);
  const bobStr = JSON.stringify(bob);
  ok(aliceStr !== bobStr, 'two viewers of the same logs project differently');
}

// ── 5. project(): warpSeq horizon and weftAt horizon ────────────────────
{
  const weftGate = new WeftGate();
  weftGate.append({ kind: 'view.mode', mode: 'explore', warpSeq: 0, humanId: 'alice' });
  weftGate.append({ kind: 'view.mode', mode: 'review', warpSeq: 1, humanId: 'alice' });
  const weft = weftGate.getLog();

  // warpSeq 0 → only the explore read is in view (review read was emitted at warpSeq 1).
  const atZero = project(warp, weft, 'alice', { warpSeq: 0 });
  ok(atZero.mode === 'explore', 'warpSeq horizon filters reads by their stamp');

  // weftAt 0 → only the first read, even though warpSeq allows more.
  const atWeftHead = project(warp, weft, 'alice', { warpSeq: 2, weftAt: 0 });
  ok(atWeftHead.mode === 'explore', 'weftAt horizon filters reads by their weft seq');

  // warpSeq 2, weftAt omitted → weft head, both reads visible, latest wins.
  const full = project(warp, weft, 'alice', { warpSeq: 2 });
  ok(full.mode === 'review', 'omitting weftAt reads the weft head');
}

if (fails.length) {
  console.error(`\n❌ LOOM PROJECT FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ loom project — view.save is canonical; project() projects warp × weft × viewer; weft gates and prunes.');
