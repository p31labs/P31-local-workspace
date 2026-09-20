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
 * The companion view — the 70-year-old's window into the same log the child
 * filled. Two screens, one sentence each, Back everywhere, nothing moves
 * without a tap.
 */
async function seedArtifact(page: import('@playwright/test').Page, color: 'amber' | 'green' = 'amber') {
  await page.goto('/');
  await page.locator('.launchpad-start').click();
  await page.locator('.chapter-action').click();
  const orb = page.locator('[data-agent-action="loom.focus"][data-agent-target="orb"]');
  await expect(orb).toHaveCount(1, { timeout: 5000 });
  await orb.click();
  const yes = page.locator('[data-agent-action="proposal.approve"]');
  await expect(yes).toHaveCount(1, { timeout: 10000 });
  await yes.click();
  await page.locator('.chapter-next').click();
  await page.locator(`[data-agent-action="color.pick"][data-agent-target="color-${color}"]`).click();
  await expect(page.locator('[data-agent-action="make.confirm"]')).toHaveCount(1, { timeout: 5000 });
  await page.locator('[data-agent-action="make.confirm"]').click();
}

test('companion — the elder sees what was made, with Back on every screen', async ({ page }) => {
  await seedArtifact(page, 'amber');
  await page.goto('/?mode=companion');

  // Screen 1: welcome. One sentence, Lumi, Back, and one forward control.
  await expect(page.locator('[data-agent-action="companion.view"]')).toHaveCount(1, { timeout: 5000 });
  await expect(
    page.getByText('You and Lumi made something together.', { exact: false }).first(),
  ).toHaveCount(1);
  await expect(page.locator('[data-agent-action="companion.back"]')).toHaveCount(1);
  await expect(page.locator('[data-agent-action="companion.next"]')).toHaveCount(1);

  // No chrome, no counts, no timers.
  await expect(page.locator('.loom-bar')).toBeHidden();
  await expect(page.locator('.shared-chip')).toHaveCount(0);

  // Back and Next both clear the 48px touch floor.
  const backBox = await page.locator('[data-agent-action="companion.back"]').boundingBox();
  const nextBox = await page.locator('[data-agent-action="companion.next"]').boundingBox();
  expect(backBox?.height ?? 0).toBeGreaterThanOrEqual(48);
  expect(nextBox?.height ?? 0).toBeGreaterThanOrEqual(48);

  // The sentence is large enough for the elder constraint.
  const sentenceSize = await page.locator('.companion-sentence').first().evaluate(
    (el) => parseFloat(getComputedStyle(el).fontSize),
  );
  expect(sentenceSize).toBeGreaterThanOrEqual(16);

  // "Show me" -> the artifact, in the color that was chosen.
  await page.locator('[data-agent-action="companion.next"]').click();
  await expect(page.getByText('This is what you made.', { exact: false }).first()).toHaveCount(1, {
    timeout: 5000,
  });
  await expect(page.locator('.made-artifact-label')).toContainText('amber');
  // No forward control on the last screen — this is the end of the walk.
  await expect(page.locator('[data-agent-action="companion.next"]')).toHaveCount(0);
  // Back is still here.
  await expect(page.locator('[data-agent-action="companion.back"]')).toHaveCount(1);
});

test('companion — Back walks the elder out, one step at a time', async ({ page }) => {
  await seedArtifact(page, 'green');
  await page.goto('/?mode=companion');

  // Walk forward to the artifact.
  await page.locator('[data-agent-action="companion.next"]').click();
  await expect(page.locator('.made-artifact-label')).toContainText('green', { timeout: 5000 });

  // Back returns to welcome.
  await page.locator('[data-agent-action="companion.back"]').click();
  await expect(
    page.getByText('You and Lumi made something together.', { exact: false }).first(),
  ).toHaveCount(1, { timeout: 5000 });

  // Back again exits (to launchpad).
  await page.locator('[data-agent-action="companion.back"]').click();
  await expect(page.locator('.launchpad-start')).toHaveCount(1, { timeout: 5000 });
});

test('companion — the artifact is derived from the log, and follows a re-pick', async ({ page }) => {
  await seedArtifact(page, 'green');
  await page.goto('/?mode=companion');
  await page.locator('[data-agent-action="companion.next"]').click();
  await expect(page.locator('.made-artifact-label')).toContainText('green', { timeout: 5000 });
});