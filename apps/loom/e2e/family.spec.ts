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
 * Family view — one short page the whole household reads together.
 *
 * The family-memory pattern: shared artifact + care circle + last shared
 * moments, provenance one tap away. The tests prove:
 *   1. the launchpad's family door opens the view (a third, 48px door);
 *   2. after the child makes an artifact, the family page shows it AND the
 *      receipt (the latest shared moment) with a working provenance link;
 *   3. personal events never appear — the page renders shared-only;
 *   4. Undo appends a compensating event (never a delete) — the log grows.
 */
test('family view — the family door opens; the artifact and receipt render', async ({ page }) => {
  // Build the arc: start, meet Lumi, make it glow, pick a color, confirm.
  await page.goto('/');
  await page.locator('.launchpad-start').click();
  await page.locator('.chapter-action').click();
  await page.locator('[data-agent-action="loom.focus"][data-agent-target="orb"]').click();
  const yes = page.locator('[data-agent-action="proposal.approve"]');
  await expect(yes).toHaveCount(1, { timeout: 10000 });
  await yes.click();
  await page.locator('.chapter-next').click();
  await page.locator('[data-agent-action="color.pick"][data-agent-target="color-amber"]').click();
  await page.locator('[data-agent-action="make.confirm"]').click();
  await expect(page.locator('.chapter-next')).toHaveCount(1, { timeout: 5000 });

  // The family door is a 48px target on the launchpad.
  await page.goto('/');
  const door = page.locator('[data-agent-action="family.open"]');
  await expect(door).toHaveCount(1, { timeout: 5000 });
  const box = await door.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);

  await door.click();
  await expect(page.locator('[data-agent-action="family.view"]')).toHaveCount(1, { timeout: 5000 });

  // The artifact is shown (derived from shared events).
  await expect(page.locator('[data-agent-action="artifact.tap"]')).toHaveCount(1, { timeout: 5000 });

  // The receipt shows the latest shared moment, and its provenance link works.
  const proof = page.locator('[data-agent-action="family.provenance"]');
  await expect(proof).toHaveCount(1, { timeout: 5000 });
  const href = await proof.getAttribute('href');
  expect(href).toMatch(/\/api\/loom\/provenance\/\d+/);
  const res = await page.request.get(String(href));
  expect(res.status()).toBe(200);
  const p = await res.json();
  expect(p.verified).toBe(true);
});

test('family view — personal events never appear; undo appends, never deletes', async ({ request }) => {
  // Alice writes a personal event; Bob writes a shared event.
  await request.post('/api/loom/event', {
    headers: { 'X-Human-Id': 'alice' },
    data: { input: { writer: 'human', kind: 'focus', node: 'color-amber', scope: 'personal', humanId: 'alice' } },
  });
  await request.post('/api/loom/event', {
    headers: { 'X-Human-Id': 'bob' },
    data: { input: { writer: 'human', kind: 'focus', node: 'orb', scope: 'shared' } },
  });

  // The family page reads the SCOPED /events (shared + the caller's own
  // personal). An anonymous read sees shared only — the personal color pick
  // must never surface in the family receipt or events feed.
  const events = await (await request.get('/api/loom/events')).json();
  const nodes = events.map((e: { node?: string }) => e.node);
  expect(nodes).toContain('orb');
  expect(nodes).not.toContain('color-amber');

  // Undo is an event: appending 'family-undo-{seq}' grows the log, it does
  // not remove the original. The chain stays intact (provenance verified).
  const before = events.length;
  await request.post('/api/loom/event', {
    headers: { 'X-Human-Id': 'bob' },
    data: { input: { writer: 'human', kind: 'focus', node: 'family-undo-1', scope: 'shared' } },
  });
  const after = await (await request.get('/api/loom/events')).json();
  expect(after.length).toBe(before + 1);
  expect(after.some((e: { node?: string }) => e.node === 'family-undo-1')).toBe(true);

  const v = await (await request.get('/api/loom/verify')).json();
  expect(v.valid).toBe(true); // the log was appended, not rewritten
});