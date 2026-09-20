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
 * "Continue where you left off" — the ADHD working-memory affordance. A named
 * `view.save` (a warp event, folded into `state.saves`) surfaces as a topbar
 * chip when the log head has advanced past it; clicking scrubs back to it.
 */
test('continue where you left off restores the saved position', async ({ page }) => {
  await page.goto('/?mode=canvas');

  // Seed: focus (seq 0), save at seq 0 (seq 1), traverse (seq 2 → head).
  await page.request.post('/api/loom/event', { data: { input: { writer: 'human', kind: 'focus', node: 'seed-node' } } });
  await page.request.post('/api/loom/event', { data: { input: { writer: 'human', kind: 'view.save', label: 'seed-node', from: 0, to: 0 } } });
  await page.request.post('/api/loom/event', { data: { input: { writer: 'agent', kind: 'traverse', from: 'a', to: 'b', reason: 'test' } } });

  const chip = page.locator('.loom-continue');
  await expect(chip).toHaveCount(1, { timeout: 5000 });
  await chip.click();
  // Scrubbing back to the saved point hides the chip (you're now "there").
  await expect(chip).toHaveCount(0, { timeout: 5000 });
});
