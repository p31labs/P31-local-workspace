import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const logPath = resolve(here, '..', '.loom', 'ci-events.jsonl');

test.beforeEach(() => {
  mkdirSync(dirname(logPath), { recursive: true });

test.setTimeout(60000);

  writeFileSync(logPath, '');
});

/**
 * Reduced-motion — the phase machines must still land when --motion-scale
 * collapses to 0.01.
 *
 * The Loom's chapter state machines are driven by the celebration pulse's
 * `animationend`. Under `prefers-reduced-motion`, index.css sets
 * --motion-scale: 0.01, so the pulse resolves in ~12ms and `animationend`
 * fires almost instantly — the celebrated phase lands with no separate
 * code path. If someone "fixes" reduced motion with `animation: none`, the
 * `animationend` event stops firing and every chapter would stall at the
 * celebrating phase. This test proves that does not happen.
 *
 * test.use({ reducedMotion }) silently no-ops on Playwright 1.61.1, so the
 * emulation is applied with page.emulateMedia BEFORE goto and asserted from
 * inside the page rather than assumed.
 */
test('reduced motion — chapter phase machines still advance', async ({ page }) => {
  // Emulate before the page loads, then prove it is actually in effect.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  expect(reduced).toBe(true);

  // Meet Lumi: the orb stage must land. Under reduced motion the pulse
  // collapses to ~12ms, so the transient "Hi! I'm Lumi." celebrating title is
  // a flash too short to assert reliably — the orb appearing is the stable
  // proof the lumi->orb transition landed via animationend.
  await page.locator('.launchpad-start').click();
  await page.locator('.chapter-action').click();
  const orb = page.locator('[data-agent-action="loom.focus"][data-agent-target="orb"]');
  await expect(orb).toHaveCount(1, { timeout: 5000 });

  // Make something happen: the spent orb must land (pulse-driven).
  await orb.click();
  await expect(page.getByText('You made it glow!', { exact: false }).first()).toHaveCount(1, {
    timeout: 5000,
  });
  await expect(orb).toBeDisabled();

  // Lumi has an idea: Lumi proposes (a 3.5s JS timer — reduced-motion cannot
  // touch JS timers, only CSS), the child decides, and the celebrated phase
  // must land (pulse-driven).
  const yes = page.locator('[data-agent-action="proposal.approve"]');
  await expect(yes).toHaveCount(1, { timeout: 10000 });
  await yes.click();
  await expect(page.getByText('Great! Let\u2019s make it.', { exact: false }).first()).toHaveCount(1, {
    timeout: 5000,
  });
  await expect(page.locator('.chapter-next')).toHaveCount(1, { timeout: 5000 });

  // You have an idea: pick a color, confirm, and the celebrated phase must
  // land. Then the Workshop's artifact is visible.
  await page.locator('.chapter-next').click();
  await page.locator('[data-agent-action="color.pick"][data-agent-target="color-amber"]').click();
  await expect(page.locator('[data-agent-action="make.confirm"]')).toHaveCount(1, { timeout: 5000 });
  await page.locator('[data-agent-action="make.confirm"]').click();
  await expect(page.locator('.chapter-next')).toHaveCount(1, { timeout: 5000 });
  await page.locator('.chapter-next').click();
  await expect(page.locator('[data-agent-action="artifact.tap"]')).toHaveCount(1, { timeout: 5000 });
});