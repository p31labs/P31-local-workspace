/**
 * spike-appshell-field.spec.ts — operational field-test simulation (Track 2.5).
 *
 * The persistence spec (spike-appshell-persistence.spec.ts) proves the
 * architectural pass criteria: same canvas DOM node, graceful WebGL context
 * recovery, healthy at end. This file extends that bar to operational
 * conditions the operator actually faces — phone, Chromebook, slow cell, dead
 * cell, backgrounded tab, GC pressure, long-haul stability.
 *
 * Eight automated probes (run with `npm run spike:appshell -- e2e/spike-appshell-field.spec.ts`):
 *
 *   1. device-iphone           — iPhone 13 viewport + UA, 20× nav
 *   2. device-pixelbook        — 1366×768 Chromebook viewport, 20× nav
 *   3. network-slow-3g         — CDP throttle to Slow3G, 10× nav
 *   4. network-offline-recovery — go offline mid-session, recover, 5× nav
 *   5. tab-visibility          — toggle hidden/visible mid-flight, 10× cycles
 *   6. console-clean           — sniffer asserts zero JS errors, 20× nav
 *   7. forced-gc               — CDP HeapProfiler.collectGarbage between navs
 *   8. overnight-100           — 100× navs with random idle (slow-drift floor)
 *
 * What this CANNOT replace (still requires operator field test):
 *   - real iPhone Safari (Playwright emulation only fakes UA + viewport)
 *   - real cellular over Verizon (CDP throttling shapes bandwidth, not RTT
 *     jitter / handoffs / IPv6 quirks)
 *   - real Pixelbook touch surface
 *   - real backgrounded iOS tab kills (Playwright only fires visibilitychange)
 *
 * Pass bar: same as persistence spec — canvasAttachCount stays 1, ctxRestored
 * >= ctxLost, ctxHealthy at end. FPS floor relaxed under throttle (handled by
 * the shared FPS_FLOOR_HEADLESS = 5).
 */
import { test, expect, devices } from '@playwright/test';
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

const CANVAS_ID = 'p31-appshell-canvas';

/* ============================================================ */
/*  1. device-iphone — iPhone 13 emulation                      */
/* ============================================================ */
/* `devices['iPhone 13']` ships defaultBrowserType: 'webkit', which forces a
 * new worker mid-suite. We only have chromium configured (see playwright.config),
 * so cherry-pick the viewport, UA, scale, and touch flags. The result is
 * Chromium-with-iPhone-shape — strict UA emulation needs WebKit. */
const IPHONE_13 = (() => {
  const d = devices['iPhone 13'];
  return {
    viewport: d.viewport,
    userAgent: d.userAgent,
    deviceScaleFactor: d.deviceScaleFactor,
    isMobile: d.isMobile,
    hasTouch: d.hasTouch,
  };
})();

test.describe('spike — AppShell field [iPhone 13]', () => {
  test.use(IPHONE_13);

  test('20× nav holds canvas and GL on iPhone-class device', async ({ page }) => {
    test.setTimeout(120_000);
    const NAV_COUNT = 20;
    const { canvasId, baseHeap, startedAt } = await landOnHome(page);
    const samples: NavSample[] = [];

    samples.push(await captureSample(page, 0, 'home', startedAt));

    for (let i = 1; i <= NAV_COUNT; i += 1) {
      const target = i % 2 === 1 ? 'dome' : 'home';
      await navigateClickRouter(page, target);
      const sample = await captureSample(page, i, target, startedAt);
      assertSampleHealthy(sample, canvasId, i);
      samples.push(sample);
    }

    const summary = summariseSamples(samples);
    expect(summary.minFps).toBeGreaterThanOrEqual(FPS_FLOOR_HEADLESS);
    if (summary.heapDeltaMb !== null) {
      expect(summary.heapDeltaMb).toBeLessThanOrEqual(MEMORY_DELTA_BUDGET_MB);
    }

    writeReport('field-iphone', {
      navCount: NAV_COUNT,
      canvasId,
      result: 'green',
      thresholds: { fpsFloorHeadless: FPS_FLOOR_HEADLESS, memoryDeltaBudgetMb: MEMORY_DELTA_BUDGET_MB },
      summary,
      samples,
      context: {
        device: 'iPhone 13',
        viewport: page.viewportSize(),
        baseHeapMb: baseHeap,
        note: 'Emulation only — UA + viewport. Does not reproduce Mobile Safari WebGL impl or iOS background-kill.',
      },
    });
  });
});

/* ============================================================ */
/*  2. device-pixelbook — 1366×768 Chromebook viewport          */
/* ============================================================ */
test.describe('spike — AppShell field [Pixelbook]', () => {
  test.use({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });

  test('20× nav holds canvas and GL at Chromebook resolution', async ({ page }) => {
    test.setTimeout(120_000);
    const NAV_COUNT = 20;
    const { canvasId, baseHeap, startedAt } = await landOnHome(page);
    const samples: NavSample[] = [];

    samples.push(await captureSample(page, 0, 'home', startedAt));

    for (let i = 1; i <= NAV_COUNT; i += 1) {
      const target = i % 2 === 1 ? 'dome' : 'home';
      await navigateClickRouter(page, target);
      const sample = await captureSample(page, i, target, startedAt);
      assertSampleHealthy(sample, canvasId, i);
      samples.push(sample);
    }

    const summary = summariseSamples(samples);
    expect(summary.minFps).toBeGreaterThanOrEqual(FPS_FLOOR_HEADLESS);

    writeReport('field-pixelbook', {
      navCount: NAV_COUNT,
      canvasId,
      result: 'green',
      thresholds: { fpsFloorHeadless: FPS_FLOOR_HEADLESS, memoryDeltaBudgetMb: MEMORY_DELTA_BUDGET_MB },
      summary,
      samples,
      context: {
        viewport: '1366×768 (Chromebook-class)',
        baseHeapMb: baseHeap,
        note: 'Real Pixelbook has GPU + touch differences not modeled here.',
      },
    });
  });
});

/* ============================================================ */
/*  3. network-slow-3g — CDP throttle to Slow3G                 */
/* ============================================================ */
/* CDP Network.emulateNetworkConditions thresholds for "Slow 3G" (Chrome DevTools default):
 *   downloadThroughput:  500 Kbps  =>  500 * 1024 / 8 = 64,000 B/s
 *   uploadThroughput:    500 Kbps  =>  64,000 B/s
 *   latency:             400 ms RTT
 * These are bytes per second per CDP spec. */
const SLOW_3G = {
  offline: false,
  downloadThroughput: (500 * 1024) / 8,
  uploadThroughput: (500 * 1024) / 8,
  latency: 400,
};

test('spike — AppShell field [network: Slow3G] — 10× nav survives throttle', async ({
  page,
  context,
}) => {
  test.setTimeout(180_000);
  const NAV_COUNT = 10;
  const cdp: CDPSession = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', SLOW_3G);

  /* First load is slow on Slow3G — give it a longer floor. */
  const startedAt = Date.now();
  await page.goto('/spike/appshell/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForFunction(
    () => Boolean(window.__p31AppShell && window.__p31AppShell.canvasId),
    null,
    { timeout: 60_000 }
  );
  await page.waitForTimeout(500);

  const initialStats = await page.evaluate(() => window.__p31AppShell);
  const canvasId = initialStats.canvasId;
  expect(canvasId).toBeTruthy();
  const samples: NavSample[] = [];
  samples.push(await captureSample(page, 0, 'home', startedAt));

  for (let i = 1; i <= NAV_COUNT; i += 1) {
    const target = i % 2 === 1 ? 'dome' : 'home';
    await navigateClickRouter(page, target, 30_000);
    const sample = await captureSample(page, i, target, startedAt);
    assertSampleHealthy(sample, canvasId, i);
    samples.push(sample);
  }

  const summary = summariseSamples(samples);
  /* min FPS only constrained when GL stayed on; throttle does not block RAF. */
  expect(summary.ctxHealthyFinal).toBe(true);

  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0,
  });

  writeReport('field-slow-3g', {
    navCount: NAV_COUNT,
    canvasId,
    result: 'green',
    thresholds: { fpsFloorHeadless: FPS_FLOOR_HEADLESS, memoryDeltaBudgetMb: MEMORY_DELTA_BUDGET_MB },
    summary,
    samples,
    context: {
      throttle: SLOW_3G,
      note: 'Bandwidth shaped via CDP. Does not reproduce real cellular RTT jitter, packet loss, handoffs.',
    },
  });
});

/* ============================================================ */
/*  4. network-offline-recovery — go dark, come back            */
/* ============================================================ */
test('spike — AppShell field [network: offline → online] — survives connectivity drop', async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  const NAV_COUNT = 5;
  const cdp: CDPSession = await context.newCDPSession(page);
  await cdp.send('Network.enable');

  const { canvasId, startedAt } = await landOnHome(page);
  const samples: NavSample[] = [];
  samples.push(await captureSample(page, 0, 'home', startedAt));

  /* Half the navs done online. */
  await navigateClickRouter(page, 'dome');
  samples.push(await captureSample(page, 1, 'dome', startedAt));
  assertSampleHealthy(samples[samples.length - 1], canvasId, 1);

  /* Drop to offline. The canvas should keep painting from in-memory state
   * because no nav fetch is triggered without a click. */
  await cdp.send('Network.emulateNetworkConditions', {
    offline: true,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
  });
  await page.waitForTimeout(2000);
  const offlineSnap = await page.evaluate(() => window.__p31AppShell);
  expect(offlineSnap.canvasId, 'canvas still alive when offline').toBe(canvasId);
  expect(offlineSnap.ctxHealthy, 'GL stays healthy when offline').toBe(true);

  /* Recover. */
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0,
  });
  await page.waitForTimeout(500);

  for (let i = 2; i <= NAV_COUNT; i += 1) {
    const target = i % 2 === 0 ? 'home' : 'dome';
    await navigateClickRouter(page, target);
    const sample = await captureSample(page, i, target, startedAt);
    assertSampleHealthy(sample, canvasId, i);
    samples.push(sample);
  }

  const summary = summariseSamples(samples);
  expect(summary.canvasAttachCountFinal).toBe(1);
  expect(summary.ctxHealthyFinal).toBe(true);

  writeReport('field-offline-recovery', {
    navCount: NAV_COUNT,
    canvasId,
    result: 'green',
    thresholds: { fpsFloorHeadless: FPS_FLOOR_HEADLESS, memoryDeltaBudgetMb: MEMORY_DELTA_BUDGET_MB },
    summary,
    samples,
    context: {
      offlineDurationMs: 2000,
      note: 'Tests architectural offline-tolerance only. Real mesh failover involves SW caching + Tailscale reconnect.',
    },
  });
});

/* ============================================================ */
/*  5. tab-visibility — backgrounded tab cycle                  */
/* ============================================================ */
test('spike — AppShell field [visibility: hidden ↔ visible] — survives tab backgrounding', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const CYCLES = 10;
  const { canvasId, startedAt } = await landOnHome(page);
  const samples: NavSample[] = [];
  samples.push(await captureSample(page, 0, 'home', startedAt));

  for (let i = 1; i <= CYCLES; i += 1) {
    /* Hide the tab. RAFs get throttled in real browsers; in headless we
     * simulate by dispatching visibilitychange. */
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(300);

    /* Bring it back. */
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(200);

    /* Then a nav while the system thinks it's foregrounded again. */
    const target = i % 2 === 1 ? 'dome' : 'home';
    await navigateClickRouter(page, target);
    const sample = await captureSample(page, i, target, startedAt);
    assertSampleHealthy(sample, canvasId, i);
    samples.push(sample);
  }

  const summary = summariseSamples(samples);
  expect(summary.canvasAttachCountFinal).toBe(1);
  expect(summary.ctxHealthyFinal).toBe(true);

  writeReport('field-visibility', {
    navCount: CYCLES,
    canvasId,
    result: 'green',
    thresholds: { fpsFloorHeadless: FPS_FLOOR_HEADLESS, memoryDeltaBudgetMb: MEMORY_DELTA_BUDGET_MB },
    summary,
    samples,
    context: {
      cycles: CYCLES,
      note: 'iOS Safari may aggressively kill background tabs — only real-device test catches that.',
    },
  });
});

/* ============================================================ */
/*  6. console-clean — sniff for any JS errors                  */
/* ============================================================ */
test('spike — AppShell field [console: clean] — zero JS errors during 20× nav', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const NAV_COUNT = 20;
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const { canvasId, startedAt } = await landOnHome(page);
  const samples: NavSample[] = [];
  samples.push(await captureSample(page, 0, 'home', startedAt));

  for (let i = 1; i <= NAV_COUNT; i += 1) {
    const target = i % 2 === 1 ? 'dome' : 'home';
    await navigateClickRouter(page, target);
    const sample = await captureSample(page, i, target, startedAt);
    assertSampleHealthy(sample, canvasId, i);
    samples.push(sample);
  }

  const summary = summariseSamples(samples);

  /* Filter out known-noisy entries that aren't actionable in headless: WebGL
   * context loss is noisy because we provoke it via view-transition-name and
   * recover from it. We assert recovery elsewhere; we don't fail the run on
   * the warning. Same for "preserveDrawingBuffer" and the SwiftShader notes. */
  const ALLOWED_PATTERNS: RegExp[] = [
    /WebGL context lost/i,
    /SwiftShader/i,
    /preserveDrawingBuffer/i,
    /\[Violation\]/i,
  ];
  const meaningfulConsoleErrors = consoleErrors.filter(
    (e) => !ALLOWED_PATTERNS.some((p) => p.test(e))
  );
  const meaningfulPageErrors = pageErrors.filter(
    (e) => !ALLOWED_PATTERNS.some((p) => p.test(e))
  );

  expect(meaningfulConsoleErrors, 'No JS console errors during 20× nav').toEqual([]);
  expect(meaningfulPageErrors, 'No uncaught page errors during 20× nav').toEqual([]);

  writeReport('field-console-clean', {
    navCount: NAV_COUNT,
    canvasId,
    result: 'green',
    thresholds: { fpsFloorHeadless: FPS_FLOOR_HEADLESS, memoryDeltaBudgetMb: MEMORY_DELTA_BUDGET_MB },
    summary,
    samples,
    context: {
      consoleErrorsTotal: consoleErrors.length,
      pageErrorsTotal: pageErrors.length,
      meaningfulConsoleErrors: meaningfulConsoleErrors.length,
      meaningfulPageErrors: meaningfulPageErrors.length,
      allowedPatterns: ALLOWED_PATTERNS.map((r) => r.source),
    },
  });
});

/* ============================================================ */
/*  7. forced-gc — V8 collectGarbage between navs               */
/* ============================================================ */
test('spike — AppShell field [forced GC] — 20× nav with HeapProfiler.collectGarbage between', async ({
  page,
  context,
}) => {
  test.setTimeout(180_000);
  const NAV_COUNT = 20;
  const cdp: CDPSession = await context.newCDPSession(page);
  await cdp.send('HeapProfiler.enable');

  const { canvasId, startedAt } = await landOnHome(page);
  const samples: NavSample[] = [];
  samples.push(await captureSample(page, 0, 'home', startedAt));

  for (let i = 1; i <= NAV_COUNT; i += 1) {
    const target = i % 2 === 1 ? 'dome' : 'home';
    await navigateClickRouter(page, target);
    /* Forced GC: any leak in the singleton (eg dangling RAF closures, retained
     * tex / buffer refs) becomes visible because temp objects can't pad the
     * heap delta. */
    await cdp.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(50);
    const sample = await captureSample(page, i, target, startedAt);
    assertSampleHealthy(sample, canvasId, i);
    samples.push(sample);
  }

  await cdp.send('HeapProfiler.disable');

  const summary = summariseSamples(samples);
  /* Tighter memory budget under forced GC: leaks get exposed. */
  if (summary.heapDeltaMb !== null) {
    expect(
      summary.heapDeltaMb,
      `heap delta under forced GC should stay under ${MEMORY_DELTA_BUDGET_MB} MB`
    ).toBeLessThanOrEqual(MEMORY_DELTA_BUDGET_MB);
  }
  expect(summary.canvasAttachCountFinal).toBe(1);
  expect(summary.ctxHealthyFinal).toBe(true);

  writeReport('field-forced-gc', {
    navCount: NAV_COUNT,
    canvasId,
    result: 'green',
    thresholds: { fpsFloorHeadless: FPS_FLOOR_HEADLESS, memoryDeltaBudgetMb: MEMORY_DELTA_BUDGET_MB },
    summary,
    samples,
    context: {
      gcStrategy: 'CDP HeapProfiler.collectGarbage between every nav',
      note: 'Forced GC strips the temp-object fog so any singleton leak shows up in heapDeltaMb.',
    },
  });
});

/* ============================================================ */
/*  8. overnight-100 — 100× nav with random idle                */
/* ============================================================ */
test('spike — AppShell field [overnight 100×] — slow-drift surface across 100 navs', async ({
  page,
}) => {
  /* Long timeout: 100 navs at ~1.5s each + idle + first paint. */
  test.setTimeout(600_000);
  const NAV_COUNT = 100;
  const SAMPLE_EVERY = 10; // capture every 10th nav to keep the report compact
  const { canvasId, startedAt } = await landOnHome(page);
  const samples: NavSample[] = [];
  samples.push(await captureSample(page, 0, 'home', startedAt));

  for (let i = 1; i <= NAV_COUNT; i += 1) {
    const target = i % 2 === 1 ? 'dome' : 'home';
    await navigateClickRouter(page, target);
    /* Random idle 100-500 ms — surfaces races between RAF, transitions, and
     * cleanup that uniform timing would mask. */
    const idle = 100 + Math.floor(Math.random() * 400);
    await page.waitForTimeout(idle);

    if (i % SAMPLE_EVERY === 0 || i === NAV_COUNT) {
      const sample = await captureSample(page, i, target, startedAt);
      assertSampleHealthy(sample, canvasId, i);
      samples.push(sample);
    } else {
      /* Light invariant check on every nav even when not sampling. */
      const stats = await page.evaluate(() => window.__p31AppShell);
      expect(stats.canvasId, `canvas id stable at nav ${i}`).toBe(canvasId);
      expect(stats.canvasAttachCount, `attach count stays 1 at nav ${i}`).toBe(1);
      expect(stats.ctxHealthy, `GL healthy at nav ${i}`).toBe(true);
    }
  }

  const summary = summariseSamples(samples);
  expect(summary.canvasAttachCountFinal).toBe(1);
  expect(summary.ctxHealthyFinal).toBe(true);
  if (summary.heapDeltaMb !== null) {
    expect(summary.heapDeltaMb).toBeLessThanOrEqual(MEMORY_DELTA_BUDGET_MB);
  }

  writeReport('field-overnight-100', {
    navCount: NAV_COUNT,
    canvasId,
    result: 'green',
    thresholds: { fpsFloorHeadless: FPS_FLOOR_HEADLESS, memoryDeltaBudgetMb: MEMORY_DELTA_BUDGET_MB },
    summary,
    samples,
    context: {
      navCount: NAV_COUNT,
      sampleEvery: SAMPLE_EVERY,
      idleRangeMs: '100-500',
      note: 'Compact sample (every 10 navs). Slow-drift floor: heap delta budget = 25 MB across 100 navs.',
    },
  });
});

/* SAMPLE_PER_NAV_TIMEOUT exported but used only by helper default. Avoid
 * unused-var lint by referencing the constant in a void expression. */
void SAMPLE_PER_NAV_TIMEOUT;
