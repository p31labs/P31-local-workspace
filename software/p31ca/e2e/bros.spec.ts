/**
 * BROS (Bidirectional Resilience Operator System) — E2E Tests
 *
 * Covers:
 *   1. PersonaSwitcher UI (rendering, selection, CustomEvent dispatch)
 *   2. BrosPhase persona engine (switch, history, state)
 *   3. Worker loopback (SSE signaling) — SKIPPED without VITE_BROS_WORKER_URL
 *
 * Run:
 *   pnpm exec playwright test software/p31ca/e2e/bros.spec.ts
 *   VITE_BROS_WORKER_URL=http://localhost:8787 pnpm exec playwright test software/p31ca/e2e/bros.spec.ts --grep @worker
 */

import { test, expect } from '@playwright/test';
import { BrosPhase } from '../src/phos-v2/phase2-bros/BrosPhase';

// ── 1. PersonaSwitcher component render + interaction ──────────────────────

test.describe('BROS — PersonaSwitcher UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/phos/week1');
  });

  test('renders 4 persona buttons', async ({ page }) => {
    const buttons = page.locator('[data-persona]');
    await expect(buttons).toHaveCount(4);
    await expect(buttons.nth(0)).toHaveAttribute('data-persona', 'wj');
    await expect(buttons.nth(1)).toHaveAttribute('data-persona', 'sj');
    await expect(buttons.nth(2)).toHaveAttribute('data-persona', 'cj');
    await expect(buttons.nth(3)).toHaveAttribute('data-persona', 'wij');
  });

  test('W.J. is active by default', async ({ page }) => {
    const wj = page.locator('[data-persona="wj"]');
    await expect(wj).toHaveAttribute('data-active', 'true');
  });

  test('clicking S.J. persona switches active state', async ({ page }) => {
    const sj = page.locator('[data-persona="sj"]');
    await sj.click();

    await expect(sj).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-persona="wj"]')).toHaveAttribute('data-active', 'false');
  });

  test('dispatches phos:persona:switch CustomEvent on click', async ({ page }) => {
    const received: Record<string, unknown> = {};
    page.on('console', (msg) => {
      if (msg.type() === 'log') received.log = msg.text();
    });

    page.evaluate(() => {
      window.addEventListener('phos:persona:switch', (e: Event) => {
        (window as unknown as Record<string, unknown>).__brosEvent = (e as CustomEvent).detail;
      });
    });

    await page.locator('[data-persona="cj"]').click();

    const detail = await page.evaluate(() => (window as unknown as Record<string, unknown>).__brosEvent);
    expect(detail).toEqual({ persona: 'cj', from: 'wj', switchCount: 1 });
  });
});

// ── 2. BrosPhase class contract ─────────────────────────────────────────────

test.describe('BROS — BrosPhase engine', () => {
  let phase: BrosPhase;
  let emitted: unknown[];

  test.beforeEach(() => {
    phase = new BrosPhase();
    // initialize must be called before activate to setup personas
    const cfg = {} as Parameters<BrosPhase['initialize']>[0];
    phase['initialize'](cfg);
    emitted = [];
    // monkey-patch emit to capture persona change events
    const emit = (phase as unknown as Record<string, unknown>).emit as (...args: unknown[]) => void;
    (phase as unknown as Record<string, unknown>).emit = (...args: unknown[]) => {
      emitted.push(...args);
      emit.apply(phase, args as never);
    };
  });

  test('defaults to W.J. persona', () => {
    phase.activate();
    expect(phase.getCurrentPersona()).toBe('wj');
    expect(phase.getState().status).toBe('active');
  });

  test('switchPersona records history + increments count', () => {
    phase.activate();
    phase.switchPersona('sj');
    expect(phase.getCurrentPersona()).toBe('sj');
    expect(phase.getSwitchHistory()).toHaveLength(1);
    expect(phase.getSwitchHistory()[0]).toMatchObject({ from: 'wj', to: 'sj' });
    expect((phase as unknown as Record<string, unknown>).switchCount as number).toBe(1);
  });

  test('switchPersona is idempotent for same persona', () => {
    phase.activate();
    phase.switchPersona('wj');
    expect(phase.getSwitchHistory()).toHaveLength(0);
  });

  test('getPersonaConfig returns per-persona metadata', () => {
    phase.activate();
    const sj = phase.getPersonaConfig('sj');
    expect(sj).toBeDefined();
    expect(sj!.mode).toBe('youth');
    expect(sj!.color).toBe('emerald');
    expect(sj!.features).toContain('voice');
    expect(sj!.voiceTrigger).toContain('bash mode');
  });

  test('matchVoiceTrigger maps text to persona | null', () => {
    phase.activate();
    expect(phase.matchVoiceTrigger('operator mode')).toBe('wj');
    expect(phase.matchVoiceTrigger('bash mode')).toBe('sj');
    expect(phase.matchVoiceTrigger('parent mode')).toBe('cj');
    expect(phase.matchVoiceTrigger('willow mode')).toBe('wij');
    expect(phase.matchVoiceTrigger('gibberish')).toBeNull();
  });

  test('onConvergence populates deliverables', () => {
    phase.activate();
    const data = { deliverables: [] as string[], dependencies: [] as string[], blockers: [] as string[], confidence: 0 };
    phase.onConvergence(2, data as never);
    expect(data.deliverables.length).toBeGreaterThan(0);
    expect(data.confidence).toBeGreaterThanOrEqual(0);
    expect(data.dependencies).toContain('voice');
  });

  test('destroy clears active personas map', () => {
    phase.activate();
    const before = (phase as unknown as Record<string, unknown>).personas as Map<string, unknown>;
    expect(before.size).toBeGreaterThan(0);
    phase.destroy();
    expect(((phase as unknown) as { personas: Map<string, unknown> }).personas.size).toBe(0);
  });
});

// ── 3. Worker loopback (requires VITE_BROS_WORKER_URL) ────────────────────

const WORKER_URL = process.env.VITE_BROS_WORKER_URL;

if (WORKER_URL) {
  test.describe('BROS — Worker loopback', () => {
    test('worker responds to ping', async ({ request }) => {
      const res = await request.get(`${WORKER_URL}/api/ping/will/sj`, {
        data: { emoji: '💚' },
      });
      expect(res.ok()).toBeTruthy();
    });

    test('worker returns 400 for invalid DID', async ({ request }) => {
      const res = await request.get(`${WORKER_URL}/api/ping/invalid`);
      expect(res.status()).toBe(400);
    });

    test('SSE endpoint streams keep-alive', async ({ request }) => {
      const res = await request.get(`${WORKER_URL}/api/events`, {
        headers: { Accept: 'text/event-stream' },
      });
      expect(res.ok()).toBeTruthy();
      expect(res.headers()['content-type']).toContain('text/event-stream');
    });
  });
}
