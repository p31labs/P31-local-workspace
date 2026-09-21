import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const logPath = resolve(here, '..', '.loom', 'ci-events.jsonl');
const chainPath = logPath.replace(/\.jsonl$/, '.chain.jsonl');

test.beforeEach(() => {
  mkdirSync(dirname(logPath), { recursive: true });
  writeFileSync(logPath, '');
  writeFileSync(chainPath, '');
});

/**
 * The cross-anchor — one provable root.
 *
 * GET /api/loom/anchor computes the exact LOOM_HEAD entry this log would
 * occupy in the LOVE chain: entryType, payload (the /verify head), prevHash
 * (the LIVE LOVE chain head), entryHash, and the exact message that was hashed.
 *
 * The promise: the LOVE chain commits to the Loom's head; a later /verify whose
 * head matches the anchored value proves the design log is the same log the
 * care ledger committed to.
 */
test('cross-anchor — an honest log produces a LOOM_HEAD anchor against the live LOVE head', async ({ request }) => {
  await request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'focus', node: 'anchor-probe-1' } },
  });
  await request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'focus', node: 'anchor-probe-2' } },
  });

  const verify = await (await request.get('/api/loom/verify')).json();
  expect(verify.valid).toBe(true);

  const anchor = await (await request.get('/api/loom/anchor')).json();
  expect(anchor.entryType).toBe('LOOM_HEAD');
  expect(anchor.payload.loomHead).toBe(verify.head);
  expect(anchor.payload.verified).toBe(true);
  expect(anchor.payload.brokenAt).toBeNull();
  expect(anchor.prevHash).toMatch(/^[0-9a-f]{64}$/);
  expect(anchor.entryHash).toMatch(/^[0-9a-f]{64}$/);
  expect(anchor.status).toBe('dry-run');

  // The message is exactly the LOVE chainAppend format: `type|json|prev`.
  expect(anchor.message).toBe(`LOOM_HEAD|${JSON.stringify(anchor.payload)}|${anchor.prevHash}`);
});

test('cross-anchor — a tampered log anchors as broken, honestly', async ({ request }) => {
  await request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'focus', node: 'anchor-tamper-1' } },
  });
  await request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'focus', node: 'anchor-tamper-2' } },
  });
  await request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'focus', node: 'anchor-tamper-3' } },
  });

  const before = await (await request.get('/api/loom/verify')).json();
  expect(before.valid).toBe(true);

  // Tamper seq 1 directly on disk.
  const chainLines = readFileSync(chainPath, 'utf8').split('\n').filter((l) => l.trim());
  const records = chainLines.map((l) => JSON.parse(l));
  const tampered = records.map((r) =>
    r.seq === 1 ? { ...r, data: JSON.stringify({ seq: 1, ts: r.ts, writer: 'human', kind: 'focus', node: 'EVIL' }) } : r,
  );
  writeFileSync(chainPath, tampered.map((r) => JSON.stringify(r)).join('\n') + '\n');

  const after = await (await request.get('/api/loom/verify')).json();
  expect(after.valid).toBe(false);

  // An honest anchor of a broken log: it records the break, it does not hide it.
  const anchor = await (await request.get('/api/loom/anchor')).json();
  expect(anchor.payload.verified).toBe(false);
  expect(anchor.payload.brokenAt).toBe(2);
  expect(anchor.payload.loomHead).toBe(after.head);
  expect(anchor.entryHash).toMatch(/^[0-9a-f]{64}$/);
});