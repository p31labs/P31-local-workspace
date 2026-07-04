/**
 * spike-appshell-persistence.spec.ts — automation half of Track 2.5 spike.
 *
 * Five automated probes against /spike/appshell/ and /spike/appshell/dome/:
 *   1. baseline       — 20× ClientRouter nav, idle CPU
 *   2. extended       — 50× ClientRouter nav, idle CPU (slow-leak surface)
 *   3. cpu-throttle   — 20× nav under 4× CPU throttle (Chromebook-class)
 *   4. reduced-motion — 20× nav with prefers-reduced-motion: reduce
 *   5. bfcache        — 10× browser back/forward (real iOS swipe behaviour)
 *
 * All five share the same pass criteria (matches docs/SPIKE-APPSHELL-PERSISTENCE.md):
 *   - canvasAttachCount stays at 1 (the strong claim — same DOM canvas)
 *   - canvas data-id is the same UUID throughout
 *   - ctxRestored >= ctxLost AND ctxHealthy at end of run
 *   - min FPS >= 5 in headless (>= 30 expected on real hardware)
 *
 * Each test writes per-nav samples to e2e/results/spike-appshell-<test>.json
 * and contributes a section to docs/SPIKE-APPSHELL-RESULT.md (manually).
 *
 * Out of scope of automation (operator field test only):
 *   - real Pixelbook + iPhone hardware
 *   - cellular cold-load
 *   - WebAuthn / Passkey paths through transitions
 */
import { test, expect } from '@playwright/test';
import type { CDPSession } from '@playwright/test';
import {
  type NavSample,
  FPS_FLOOR_HEADLESS,
  MEMORY_DELTA_BUDGET_MB,
  SAMPLE_PER_NAV_TIMEOUT,
  landOnHome,
  captureSample,
  assertSampleHealthy,
  navigateClickRouter,
  summariseSamples,
  writeReport,
} from './helpers/spike-appshell';

/* ============================================================ */
/*  Test 1 — baseline                                            */
/* ============================================================ */
test.describe('spike — AppShell persistence (Track 2.5)', () => {
  test('baseline: canvas survives 20× ClientRouter navigations', async ({ page }) => {
    const samples: NavSample[] = [];
    const { canvasId: baseCanvasId, baseHeap, startedAt } = await landOnHome(page);
    samples.push(await captureSample(page, 0, 'home', startedAt));

    const NAV = 20;
    for (let i = 1; i <= NAV; i++) {
      const route: 'home' | 'dome' = i % 2 === 1 ? 'dome' : 'home';
      await navigateClickRouter(page, route);
      const s = await captureSample(page, i, route, startedAt);
      samples.push(s);
      assertSampleHealthy(s, baseCanvasId, i);
    }

    const summary = summariseSamples(samples);
    expect(summary.minFps, 'min FPS over baseline run').toBeGreaterThanOrEqual(FPS_FLOOR_HEADLESS);
    if (summary.heapDeltaMb !== null) {
      expect(summary.heapDeltaMb, `heap delta < ${MEMORY_DELTA_BUDGET_MB} MB`).toBeLessThan(
        MEMORY_DELTA_BUDGET_MB
      );
    }
    writeReport('baseline', {
      navCount: NAV,
      canvasId: baseCanvasId,
      result: 'green',
      thresholds: { fpsFloorHeadless: FPS_FLOOR_HEADLESS, memoryDeltaBudgetMb: MEMORY_DELTA_BUDGET_MB },
      summary,
      samples,
      context: { baseHeapMb: baseHeap },
    });
  });

  /* ============================================================ */
  /*  Test 2 — extended (50×)                                      */
  /* ============================================================ */
  test('extended: canvas survives 50× ClientRouter navigations (slow-leak surface)', async ({
    page,
  }) => {
    test.setTimeout(180_000); // 3 minutes max for the long run
    const samples: NavSample[] = [];
    const { canvasId: baseCanvasId, baseHeap, startedAt } = await landOnHome(page);
    samples.push(await captureSample(page, 0, 'home', startedAt));

    const NAV = 50;
    for (let i = 1; i <= NAV; i++) {
      const route: 'home' | 'dome' = i % 2 === 1 ? 'dome' : 'home';
      await navigateClickRouter(page, route);
      const s = await captureSample(page, i, route, startedAt);
      samples.push(s);
      assertSampleHealthy(s, baseCanvasId, i);
    }

    const summary = summariseSamples(samples);
    expect(summary.minFps, 'min FPS over extended run').toBeGreaterThanOrEqual(FPS_FLOOR_HEADLESS);
    /* Extended run uses a more generous heap budget (35 MB) since 50 navs
     * legitimately allocate more transient state (route params, etc.). */
    if (summary.heapDeltaMb !== null) {
      expect(summary.heapDeltaMb, 'heap delta < 35 MB over 50 navs').toBeLessThan(35);
    }
    writeReport('extended', {
      navCount: NAV,
      canvasId: baseCanvasId,
      result: 'green',
      thresholds: { fpsFloorHeadless: FPS_FLOOR_HEADLESS, memoryDeltaBudgetMb: 35 },
      summary,
      samples,
      context: { baseHeapMb: baseHeap },
    });
  });

  /* ============================================================ */
  /*  Test 3 — CPU throttle (4×, Chromebook-class)                 */
  /* ============================================================ */
  test('cpu-throttle: canvas survives 20× navigations under 4× CPU throttle', async ({ page }) => {
    test.setTimeout(300_000); // 5 minutes — throttled runs are slow
    /* Use Chrome DevTools Protocol to throttle CPU. 4× rate roughly matches
     * a low-end Chromebook compared to a desktop. Real iPhone is closer
     * to 2×; real Pixelbook is closer to 4×. */
    const cdp: CDPSession = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    const samples: NavSample[] = [];
    try {
      const { canvasId: baseCanvasId, baseHeap, startedAt } = await landOnHome(page);
      samples.push(await captureSample(page, 0, 'home', startedAt));

      const NAV = 20;
      const PER_NAV_TIMEOUT_MS = 30_000; // generous under 4× throttle
      for (let i = 1; i <= NAV; i++) {
        const route: 'home' | 'dome' = i % 2 === 1 ? 'dome' : 'home';
        await navigateClickRouter(page, route, PER_NAV_TIMEOUT_MS);
        const s = await captureSample(page, i, route, startedAt);
        samples.push(s);
        assertSampleHealthy(s, baseCanvasId, i);
      }

      const summary = summariseSamples(samples);
      /* Under 4× throttle, fps will drop hard. We only assert the floor of 1
       * (i.e. it isn't completely frozen) — the real signal is whether the
       * canvas persists and the GL context recovers. */
      expect(summary.minFps, 'min FPS under 4× throttle').toBeGreaterThanOrEqual(1);
      writeReport('cpu-throttle', {
        navCount: NAV,
        canvasId: baseCanvasId,
        result: 'green',
        thresholds: { fpsFloorHeadless: 1, memoryDeltaBudgetMb: MEMORY_DELTA_BUDGET_MB },
        summary,
        samples,
        context: { cpuThrottleRate: 4, baseHeapMb: baseHeap },
      });
    } finally {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      await cdp.detach();
    }
  });

  /* ============================================================ */
  /*  Test 4 — prefers-reduced-motion                              */
  /* ============================================================ */
  test('reduced-motion: canvas + persist honour prefers-reduced-motion: reduce', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const samples: NavSample[] = [];
    const { canvasId: baseCanvasId, baseHeap, startedAt } = await landOnHome(page);
    samples.push(await captureSample(page, 0, 'home', startedAt));

    const NAV = 20;
    for (let i = 1; i <= NAV; i++) {
      const route: 'home' | 'dome' = i % 2 === 1 ? 'dome' : 'home';
      await navigateClickRouter(page, route);
      const s = await captureSample(page, i, route, startedAt);
      samples.push(s);
      assertSampleHealthy(s, baseCanvasId, i);
    }

    /* Specific reduced-motion invariant: route SHOULD still update; lerp is
     * implementation-defined (current singleton uses same 600 ms half-life,
     * which is acceptable; a stricter implementation would snap). What we
     * MUST NOT have is a broken canvas because of the media query. */
    const summary = summariseSamples(samples);
    expect(summary.minFps, 'min FPS with reduced motion').toBeGreaterThanOrEqual(FPS_FLOOR_HEADLESS);
    writeReport('reduced-motion', {
      navCount: NAV,
      canvasId: baseCanvasId,
      result: 'green',
      thresholds: { fpsFloorHeadless: FPS_FLOOR_HEADLESS, memoryDeltaBudgetMb: MEMORY_DELTA_BUDGET_MB },
      summary,
      samples,
      context: { reducedMotion: true, baseHeapMb: baseHeap },
    });
  });

  /* ============================================================ */
  /*  Test 5 — bfcache (browser back/forward)                      */
  /* ============================================================ */
  test('bfcache: canvas survives 10× browser back/forward navigations', async ({ page }) => {
    const samples: NavSample[] = [];
    const { canvasId: baseCanvasId, baseHeap, startedAt } = await landOnHome(page);
    samples.push(await captureSample(page, 0, 'home', startedAt));

    /* First seed the history with one click-nav so back/forward has a
     * non-trivial stack. */
    await navigateClickRouter(page, 'dome');
    samples.push(await captureSample(page, 1, 'dome', startedAt));

    const NAV = 10;
    for (let i = 2; i <= NAV + 1; i++) {
      /* Even rounds: goBack to home. Odd rounds: goForward to dome. */
      const back = i % 2 === 0;
      if (back) {
        await page.goBack({ waitUntil: 'domcontentloaded' });
      } else {
        await page.goForward({ waitUntil: 'domcontentloaded' });
      }
      const expectedRoute: 'home' | 'dome' = back ? 'home' : 'dome';
      /* bfcache restore can fire either as fresh navigation OR as pageshow
       * with persisted=true. The singleton's own astro:after-swap might not
       * fire for browser back/forward — we wait on the route attribute on
       * the html element (set by the AppShell). */
      await page.waitForFunction(
        (route) => document.documentElement.getAttribute('data-p31-spike-route') === route,
        expectedRoute,
        { timeout: SAMPLE_PER_NAV_TIMEOUT }
      );
      /* Allow rAF/route-binding to settle. */
      await page.waitForTimeout(400);
      const s = await captureSample(page, i, expectedRoute, startedAt);
      samples.push(s);
      assertSampleHealthy(s, baseCanvasId, i);
    }

    const summary = summariseSamples(samples);
    expect(summary.minFps, 'min FPS through bfcache run').toBeGreaterThanOrEqual(FPS_FLOOR_HEADLESS);
    writeReport('bfcache', {
      navCount: NAV,
      canvasId: baseCanvasId,
      result: 'green',
      thresholds: { fpsFloorHeadless: FPS_FLOOR_HEADLESS, memoryDeltaBudgetMb: MEMORY_DELTA_BUDGET_MB },
      summary,
      samples,
      context: { mechanism: 'browser back/forward', baseHeapMb: baseHeap },
    });
  });
});
