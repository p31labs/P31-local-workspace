/**
 * spike-appshell helpers — shared by spike-appshell-persistence.spec.ts and
 * spike-appshell-field.spec.ts.
 *
 * The persistence spec exercises the architectural pass criteria
 * (canvasAttachCount, ctx loss/restore, healthy at end). The field spec
 * exercises operational conditions (device emulation, network, visibility,
 * GC pressure, long-duration). Both share the same singleton introspection
 * surface (window.__p31AppShell) and the same per-nav sample shape.
 */
import { expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export interface ShellStats {
  canvasId: string;
  navCount: number;
  canvasAttachCount: number;
  ctxLost: number;
  ctxRestored: number;
  ctxHealthy: boolean;
  fps: number;
  route: 'home' | 'dome' | null;
  bytes: number;
}

export interface NavSample {
  index: number;
  route: 'home' | 'dome';
  canvasId: string;
  navCount: number;
  canvasAttachCount: number;
  ctxLost: number;
  ctxRestored: number;
  ctxHealthy: boolean;
  fps: number;
  jsHeapMb: number | null;
  url: string;
  elapsedMs: number;
}

export interface ReportSummary {
  schema: 'p31.spike.appshell/1.0.0';
  scenario: string;
  ranAt: string;
  navCount: number;
  canvasId: string;
  result: 'green' | 'red';
  thresholds: {
    fpsFloorHeadless: number;
    memoryDeltaBudgetMb: number;
  };
  summary: {
    avgFps: number;
    minFps: number;
    canvasAttachCountFinal: number;
    ctxLostTotal: number;
    ctxRestoredTotal: number;
    ctxHealthyFinal: boolean;
    heapDeltaMb: number | null;
    durationMs: number;
  };
  samples: NavSample[];
  context?: Record<string, unknown>;
}

export const FPS_FLOOR_HEADLESS = 5;
export const MEMORY_DELTA_BUDGET_MB = 25;
export const SAMPLE_PER_NAV_TIMEOUT = 10_000;

declare global {
  interface Window {
    __p31AppShell: ShellStats;
  }
}

export async function readStats(page: Page): Promise<ShellStats> {
  return await page.evaluate(() => window.__p31AppShell);
}

export async function readJsHeapMb(page: Page): Promise<number | null> {
  return await page.evaluate(() => {
    const perf = performance as Performance & {
      memory?: { usedJSHeapSize: number };
    };
    return perf.memory ? Math.round(perf.memory.usedJSHeapSize / (1024 * 1024)) : null;
  });
}

export async function landOnHome(
  page: Page
): Promise<{ canvasId: string; baseHeap: number | null; startedAt: number }> {
  const startedAt = Date.now();
  await page.goto('/spike/appshell/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => Boolean(window.__p31AppShell && window.__p31AppShell.canvasId),
    null,
    { timeout: 15_000 }
  );
  await page.waitForTimeout(300);
  const initial = await readStats(page);
  expect(initial.canvasId, 'canvasId set after first paint').toBeTruthy();
  const baseHeap = await readJsHeapMb(page);
  return { canvasId: initial.canvasId, baseHeap, startedAt };
}

export async function captureSample(
  page: Page,
  index: number,
  expectedRoute: 'home' | 'dome',
  startedAt: number
): Promise<NavSample> {
  const stats = await readStats(page);
  const heap = await readJsHeapMb(page);
  return {
    index,
    route: expectedRoute,
    canvasId: stats.canvasId,
    navCount: stats.navCount,
    canvasAttachCount: stats.canvasAttachCount,
    ctxLost: stats.ctxLost,
    ctxRestored: stats.ctxRestored,
    ctxHealthy: stats.ctxHealthy,
    fps: stats.fps,
    jsHeapMb: heap,
    url: page.url(),
    elapsedMs: Date.now() - startedAt,
  };
}

export function assertSampleHealthy(s: NavSample, baseCanvasId: string, idx: number): void {
  expect(
    s.canvasAttachCount,
    `canvas DOM node must persist across nav ${idx} (${s.route})`
  ).toBe(1);
  expect(s.canvasId, `canvas data-id must remain ${baseCanvasId} after nav ${idx}`).toBe(
    baseCanvasId
  );
  expect(
    s.ctxRestored,
    `ctxRestored must >= ctxLost (nav ${idx}: lost ${s.ctxLost}, restored ${s.ctxRestored})`
  ).toBeGreaterThanOrEqual(s.ctxLost);
  expect(s.ctxHealthy, `GL context must be healthy at end of nav ${idx}`).toBe(true);
}

export async function navigateClickRouter(
  page: Page,
  target: 'home' | 'dome',
  perNavTimeoutMs: number = SAMPLE_PER_NAV_TIMEOUT
): Promise<void> {
  await page.getByRole('link', { name: target, exact: true }).click();
  await page.waitForFunction(
    (route) => {
      const s = window.__p31AppShell;
      if (!s) return false;
      if (s.route !== route) return false;
      return s.ctxHealthy && (s.fps > 0 || s.ctxRestored >= s.ctxLost);
    },
    target,
    { timeout: perNavTimeoutMs }
  );
  await page.waitForTimeout(200);
}

export function summariseSamples(samples: NavSample[]): ReportSummary['summary'] {
  const fpsSamples = samples.map((s) => s.fps).filter((f) => f > 0);
  const minFps = fpsSamples.length ? Math.min(...fpsSamples) : 0;
  const avgFps = fpsSamples.length
    ? Math.round(fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length)
    : 0;
  const heapSamples = samples
    .map((s) => s.jsHeapMb)
    .filter((h): h is number => typeof h === 'number');
  const heapDelta =
    heapSamples.length > 1 ? Math.max(...heapSamples) - Math.min(...heapSamples) : null;
  const last = samples[samples.length - 1];
  return {
    avgFps,
    minFps,
    canvasAttachCountFinal: last?.canvasAttachCount ?? 0,
    ctxLostTotal: last?.ctxLost ?? 0,
    ctxRestoredTotal: last?.ctxRestored ?? 0,
    ctxHealthyFinal: last?.ctxHealthy ?? false,
    heapDeltaMb: heapDelta,
    durationMs: last?.elapsedMs ?? 0,
  };
}

export function writeReport(
  scenario: string,
  body: Omit<ReportSummary, 'scenario' | 'schema' | 'ranAt'>
): string {
  const outDir = path.join(process.cwd(), 'e2e', 'results');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `spike-appshell-${scenario}.json`);
  const report: ReportSummary = {
    schema: 'p31.spike.appshell/1.0.0',
    scenario,
    ranAt: new Date().toISOString(),
    ...body,
  };
  fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`spike-appshell[${scenario}]: wrote ${out}`);
  return out;
}
