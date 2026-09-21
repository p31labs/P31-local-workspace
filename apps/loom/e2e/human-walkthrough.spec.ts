import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const logPath = resolve(here, '..', '.loom', 'ci-events.jsonl');
const chainPath = logPath.replace(/\.jsonl$/, '.chain.jsonl');
const SHOTS = resolve(here, '..', 'test-results', 'human-walkthrough');

test.beforeEach(() => {
  mkdirSync(dirname(logPath), { recursive: true });
  writeFileSync(logPath, '');
  writeFileSync(chainPath, '');
});

test.setTimeout(120000);

/**
 * The scripted human walkthrough — HUMAN_TEST_PLAN.md, before the humans.
 *
 * Three roles, each with that role's presentation prefs:
 *   - child:   `literal=1` (plain labels — the child reads words, not icons)
 *   - builder: no prefs (the default advanced surface — the P31 engineer)
 *   - elder:   `motion=reduced&density=spacious&literal=1`
 *
 * Each role walks the full arc (launchpad → 5 chapters → artifact), screenshots
 * every beat, and audits the DOM against the master prompt's hard rules:
 *   48px targets, 16px text, reduced-motion collapse, no timers (nothing
 *   advances without a tap). It is not a human, but it is concrete evidence
 *   and it catches a broken step before a person sees it.
 */
const ROLES = [
  {
    name: 'child',
    qs: '?literal=1',
    reduced: false,
  },
  {
    name: 'builder',
    qs: '',
    reduced: false,
  },
  {
    name: 'elder',
    qs: '?motion=reduced&density=spacious&literal=1',
    reduced: true,
  },
] as const;

for (const role of ROLES) {
  test(`human walkthrough — ${role.name} completes the full arc, hard rules hold`, async ({ page }) => {
    // Reduced motion must be emulated BEFORE goto and proven from inside.
    if (role.reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${role.qs}`);

    // ── Launchpad ─────────────────────────────────────────────────────
    await page.locator('.launchpad-start').click();
    await page.screenshot({ path: `${SHOTS}/${role.name}-01-chapter1.png` });

    // ── Chapter 1: meet Lumi, "Say hello" ─────────────────────────────
    await page.locator('.chapter-action').click();
    await expect(page.locator('[data-agent-action="loom.focus"][data-agent-target="orb"]')).toHaveCount(1, { timeout: 5000 });
    await page.screenshot({ path: `${SHOTS}/${role.name}-02-orb.png` });

    // ── Chapter 2: make something happen (the orb is tappable) ────────
    await page.locator('[data-agent-action="loom.focus"][data-agent-target="orb"]').click();
    await expect(page.getByText('You made it glow!', { exact: false }).first()).toHaveCount(1, { timeout: 5000 });
    await page.screenshot({ path: `${SHOTS}/${role.name}-03-glow.png` });

    // ── Chapter 3: Lumi proposes, the child decides ───────────────────
    const yes = page.locator('[data-agent-action="proposal.approve"]');
    await expect(yes).toHaveCount(1, { timeout: 10000 });
    await yes.click();
    await expect(page.locator('.chapter-next')).toHaveCount(1, { timeout: 5000 });
    await page.screenshot({ path: `${SHOTS}/${role.name}-04-idea.png` });

    // ── Chapter 4: pick a color, confirm the make ─────────────────────
    await page.locator('.chapter-next').click();
    await page.locator('[data-agent-action="color.pick"][data-agent-target="color-amber"]').click();
    await expect(page.locator('[data-agent-action="make.confirm"]')).toHaveCount(1, { timeout: 5000 });
    await page.locator('[data-agent-action="make.confirm"]').click();
    await expect(page.locator('.chapter-next')).toHaveCount(1, { timeout: 5000 });
    await page.screenshot({ path: `${SHOTS}/${role.name}-05-color.png` });

    // ── Chapter 5: the artifact — the child taps it on their own ──────
    await page.locator('.chapter-next').click();
    await expect(page.locator('[data-agent-action="artifact.tap"]')).toHaveCount(1, { timeout: 5000 });
    await page.locator('[data-agent-action="artifact.tap"]').click();
    await page.screenshot({ path: `${SHOTS}/${role.name}-06-artifact.png` });

    // ── Hard rules audit across the whole arc ─────────────────────────
    // 1. No visible timers — nothing should have advanced on its own.
    const countdown = await page.locator('[data-testid="countdown"], .countdown').count();
    expect(countdown).toBe(0);

    // 2. Touch targets at the family floor (48px) on every REAL interactive
    // element. Decorative children (aria-hidden spans, icons inside buttons)
    // are excluded — the rule is the target, not its pixels.
    const targets = await page
      .locator(
        'button, [data-agent-action], .chapter-action, .chapter-next, .launchpad-start, .companion-next, .companion-back',
      )
      .evaluateAll((els) =>
        els.map((el) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          return { tag: (el as HTMLElement).className || (el as HTMLElement).getAttribute('data-agent-action') || 'button', w: r.width, h: r.height };
        }),
      )
      // Only visible, rendered targets count — hidden/empty boxes are not on screen.
      .then((arr) => arr.filter((t) => t.w > 0 && t.h > 0));
    const undersized = targets.filter((t) => t.w < 48 || t.h < 48);
    expect(undersized).toEqual([]);

    // 3. Text floor: 16px on readable content. Only visible text nodes count.
    const smallText = await page.locator('p, button, span, a').evaluateAll((els) =>
      els.filter((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return false; // hidden/empty
        const s = getComputedStyle(el).fontSize;
        return parseFloat(s) < 16;
      }).map((el) => (el as HTMLElement).outerHTML.slice(0, 60)),
    );
    expect(smallText).toEqual([]);

    // 4. Reduced motion is honored (when the role demands it).
    if (role.reduced) {
      const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
      expect(reduced).toBe(true);
      const scale = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--motion-scale'));
      expect(parseFloat(scale)).toBeLessThan(0.1);
    }

    // 5. The log recorded the arc (gate-validated events, none for role-side actions).
    const events = await (await page.request.get('/api/loom/events')).json();
    expect(events.length).toBeGreaterThan(0);
  });
}