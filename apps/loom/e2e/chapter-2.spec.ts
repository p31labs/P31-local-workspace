import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const logPath = resolve(here, '..', '.loom', 'ci-events.jsonl');

test.beforeEach(() => {
  mkdirSync(dirname(logPath), { recursive: true });
  writeFileSync(logPath, '');
});

/**
 * Chapter 3 — Lumi has an idea. After the child has made something happen
 * (tapped the field orb), Lumi proposes in plain language. The child decides:
 * both answers are completions — each commits an event, each celebrates.
 */
async function reachProposal(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('.launchpad-start').click();
  await page.locator('.chapter-action').click();
  const orb = page.locator('[data-agent-action="loom.focus"][data-agent-target="orb"]');
  await expect(orb).toHaveCount(1, { timeout: 5000 });
  await orb.click();
}

test('chapter 3 — Yes, do it: a completion, and the loop closes', async ({ page }) => {
  await reachProposal(page);

  // Lumi's idea renders in plain language, with two equal-weight buttons.
  const yes = page.locator('[data-agent-action="proposal.approve"]');
  const notYet = page.locator('[data-agent-action="proposal.defer"]');
  await expect(page.locator('.proposal-card')).toHaveCount(1, { timeout: 10000 });
  await expect(yes).toHaveCount(1);
  await expect(notYet).toHaveCount(1);
  await expect(page.locator('.proposal-text')).toContainText(
    'I want to add a warm color to the field',
  );

  // Neither button is smaller than the 48px touch floor.
  const yesBox = await yes.boundingBox();
  const noBox = await notYet.boundingBox();
  expect(yesBox?.height ?? 0).toBeGreaterThanOrEqual(48);
  expect(noBox?.height ?? 0).toBeGreaterThanOrEqual(48);

  // "Yes, do it" lands the celebrated phase and the hand-off.
  await yes.click();
  await expect(page.getByText('Great! Let\u2019s make it.', { exact: false }).first()).toHaveCount(1, {
    timeout: 5000,
  });
  await expect(page.locator('.chapter-next')).toHaveCount(1, { timeout: 5000 });

  // The approve event committed to the log — the log is the source of truth.
  const events = await (await page.request.get('/api/loom/events')).json();
  expect(events.some((e: { kind: string }) => e.kind === 'approve')).toBe(true);
});

test('chapter 3 — Not yet is a valid decision, not a failure', async ({ page }) => {
  await reachProposal(page);

  const notYet = page.locator('[data-agent-action="proposal.defer"]');
  await expect(notYet).toHaveCount(1, { timeout: 10000 });
  await notYet.click();

  // Same celebrated phase, gentler copy. The hand-off still appears.
  await expect(page.getByText('Okay. Maybe later.', { exact: false }).first()).toHaveCount(1, {
    timeout: 5000,
  });
  await expect(page.locator('.chapter-next')).toHaveCount(1, { timeout: 5000 });

  // No retry, no "are you sure", no re-prompt — the decision is respected.
  await expect(page.locator('[data-agent-action="proposal.approve"]')).toHaveCount(0);

  // The reject event committed with the friendly 'not-yet' reason.
  const events = await (await page.request.get('/api/loom/events')).json();
  expect(events.some((e: { kind: string; reason?: string }) => e.kind === 'reject' && e.reason === 'not-yet')).toBe(true);
});