import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const logPath = resolve(here, '..', '.loom', 'ci-events.jsonl');
// The dev middleware's chain sidecar sits next to the log.
const chainPath = logPath.replace(/\.jsonl$/, '.chain.jsonl');

test.beforeEach(() => {
  mkdirSync(dirname(logPath), { recursive: true });
  writeFileSync(logPath, '');
  writeFileSync(chainPath, '');
});

test.setTimeout(60000);

/**
 * The trust layer — the prev_hash chain exposed as /verify and /provenance.
 *
 * The whole promise is one sentence: rewrite one record, and /verify names the
 * break. This test proves that promise through the real dev middleware (which
 * mirrors the D1 adapter), the same way the Cloudflare Functions do:
 *   1. an honest chain verifies and its head is stable across reads;
 *   2. provenance returns the chain from genesis with each prev_hash;
 *   3. tampering with a stored record breaks the chain at the next seq.
 *
 * The tamper is a disk edit to the sidecar (the D1-row equivalent), not an API
 * call — because the whole point of the chain is that no API call can forge it.
 */
test('trust layer — an honest chain verifies with a stable head', async ({ request }) => {
  await request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'focus', node: 'trust-probe-1' } },
  });
  await request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'focus', node: 'trust-probe-2' } },
  });
  await request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'focus', node: 'trust-probe-3' } },
  });

  const v1 = await (await request.get('/api/loom/verify')).json();
  expect(v1.valid).toBe(true);
  expect(v1.brokenAt).toBeNull();
  expect(v1.head).toMatch(/^[0-9a-f]{64}$/);

  // Stable across a second read with no interleaved writes.
  const v2 = await (await request.get('/api/loom/verify')).json();
  expect(v2.head).toBe(v1.head);

  // Provenance for seq 1 returns genesis + seq 0 + seq 1, each prev_hash linked.
  const p = await (await request.get('/api/loom/provenance/1')).json();
  expect(p.chain).toHaveLength(2);
  expect(p.chain[0].seq).toBe(0);
  expect(p.chain[0].prev_hash).toBe('');
  expect(p.chain[1].prev_hash).toMatch(/^[0-9a-f]{64}$/);
  expect(p.verified).toBe(true);
  expect(p.head).toBeDefined();
});

test('trust layer — tampering with a stored record breaks the chain at the next seq', async ({ request }) => {
  await request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'focus', node: 'tamper-probe-1' } },
  });
  await request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'focus', node: 'tamper-probe-2' } },
  });
  await request.post('/api/loom/event', {
    data: { input: { writer: 'human', kind: 'focus', node: 'tamper-probe-3' } },
  });

  const before = await (await request.get('/api/loom/verify')).json();
  expect(before.valid).toBe(true);

  // Rewrite seq 1's stored payload directly on disk — the tamper no API call
  // could make by accident.
  const chainLines = readFileSync(chainPath, 'utf8').split('\n').filter((l) => l.trim());
  const records = chainLines.map((l) => JSON.parse(l));
  const tampered = records.map((r) =>
    r.seq === 1 ? { ...r, data: JSON.stringify({ seq: 1, ts: r.ts, writer: 'human', kind: 'focus', node: 'EVIL' }) } : r,
  );
  writeFileSync(chainPath, tampered.map((r) => JSON.stringify(r)).join('\n') + '\n');

  const after = await (await request.get('/api/loom/verify')).json();
  expect(after.valid).toBe(false);
  // seq 1 was rewritten, so the chain breaks at seq 2.
  expect(after.brokenAt).toBe(2);
  expect(after.expected).not.toBe(after.found);
  expect(after.head).not.toBe(before.head);
});