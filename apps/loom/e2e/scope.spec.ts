import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
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

test.setTimeout(60000);

/**
 * Scope — the enforcement, proven through the real dev middleware.
 *
 * The green-light design: scope is enforced at the read path ALWAYS (a D1/JS
 * query, never a prompt), and at the write path when identity is present.
 *  1. a personal event authored by Alice is invisible to Bob's /events read;
 *  2. a shared event is visible to everyone;
 *  3. provenance redacts Alice's personal record from Bob (data:null,
 *     redacted:true) while keeping the chain link;
 *  4. a shared event with a humanId is rejected by the gate (shape).
 *
 * Identity flows through the X-Human-Id header — the interim affordance the
 * production Function resolves when Access is OFF (SECURITY.md documents that
 * this is a promise, not proof).
 */
test('scope — a personal event is invisible to another humanId; shared is visible to all', async ({ request }) => {
  // Alice writes a personal focus.
  const alicePost = await request.post('/api/loom/event', {
    headers: { 'X-Human-Id': 'alice' },
    data: { input: { writer: 'human', kind: 'focus', node: 'color-amber', scope: 'personal', humanId: 'alice' } },
  });
  expect(alicePost.status()).toBe(200);

  // Alice writes a shared focus.
  const sharedPost = await request.post('/api/loom/event', {
    headers: { 'X-Human-Id': 'alice' },
    data: { input: { writer: 'human', kind: 'focus', node: 'orb', scope: 'shared' } },
  });
  expect(sharedPost.status()).toBe(200);

  // Alice sees her own personal + the shared.
  const aliceEvents = await (await request.get('/api/loom/events', { headers: { 'X-Human-Id': 'alice' } })).json();
  const aliceNodes = aliceEvents.map((e: { node?: string }) => e.node);
  expect(aliceNodes).toContain('color-amber'); // her personal
  expect(aliceNodes).toContain('orb'); // shared

  // Bob sees ONLY the shared.
  const bobEvents = await (await request.get('/api/loom/events', { headers: { 'X-Human-Id': 'bob' } })).json();
  const bobNodes = bobEvents.map((e: { node?: string }) => e.node);
  expect(bobNodes).toContain('orb');
  expect(bobNodes).not.toContain('color-amber'); // Alice's personal is invisible

  // Anonymous sees shared only.
  const anonEvents = await (await request.get('/api/loom/events')).json();
  const anonNodes = anonEvents.map((e: { node?: string }) => e.node);
  expect(anonNodes).toContain('orb');
  expect(anonNodes).not.toContain('color-amber');
});

test('scope — provenance redacts another humanId\'s personal record', async ({ request }) => {
  // Alice: personal at seq 0, shared at seq 1.
  await request.post('/api/loom/event', {
    headers: { 'X-Human-Id': 'alice' },
    data: { input: { writer: 'human', kind: 'focus', node: 'color-amber', scope: 'personal', humanId: 'alice' } },
  });
  await request.post('/api/loom/event', {
    headers: { 'X-Human-Id': 'alice' },
    data: { input: { writer: 'human', kind: 'focus', node: 'orb', scope: 'shared' } },
  });

  // Alice's provenance: full data on both.
  const aliceP = await (await request.get('/api/loom/provenance/1', { headers: { 'X-Human-Id': 'alice' } })).json();
  expect(aliceP.chain[0].data.node).toBe('color-amber');
  expect(aliceP.chain[0].redacted).toBeUndefined();
  expect(aliceP.chain[1].data.node).toBe('orb');

  // Bob's provenance: seq 0 is redacted (data:null, redacted:true) but the
  // chain link (prev_hash) is preserved — the log is still verifiable.
  const bobP = await (await request.get('/api/loom/provenance/1', { headers: { 'X-Human-Id': 'bob' } })).json();
  expect(bobP.chain[0].redacted).toBe(true);
  expect(bobP.chain[0].data).toBeNull();
  expect(bobP.chain[0].prev_hash).toBe('');
  expect(bobP.chain[1].data.node).toBe('orb');
  expect(bobP.chain[1].prev_hash).toMatch(/^[0-9a-f]{64}$/);
  expect(bobP.verified).toBe(true); // chain integrity is scope-blind
});

test('scope — the gate rejects a shared event that carries a humanId', async ({ request }) => {
  const res = await request.post('/api/loom/event', {
    headers: { 'X-Human-Id': 'alice' },
    data: { input: { writer: 'human', kind: 'focus', node: 'orb', scope: 'shared', humanId: 'alice' } },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(String(body.error)).toContain('shared');
});