import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
// e2e/ -> apps/loom -> apps -> repo root
const demoAgentPath = resolve(here, '..', '..', '..', 'packages', 'canon', 'scripts', 'loom-demo-agent.mjs');
// The dev middleware resolves LOOM_LOG relative to apps/loom; pin the same
// absolute target so the spawned agent and the canvas agree on one file.
const logPath = process.env.LOOM_LOG
  ? resolve(here, '..', process.env.LOOM_LOG)
  : resolve(here, '..', '.loom', 'ci-events.jsonl');

/**
 * β-2 canvas convergence — the write → render → SSE loop, end to end.
 *
 * Spawns the β-1 demo agent as a real child process, pointed at the SAME log
 * the dev middleware reads (LOOM_LOG). With two iterations the agent appends
 * traverse + propose, then reviews the prior proposal; the canvas must reflect
 * all of it via SSE without any direct POST. Proposal ids are Date.now()-based,
 * so assertions key on kind, not id.
 */
test('canvas reflects events the demo agent committed', async ({ page }) => {
  await new Promise<void>((resolveRun, rejectRun) => {
    const child = spawn('node', [demoAgentPath, '--iterations=2', '--seed=1'], {
      env: { ...process.env, LOOM_LOG: logPath },
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let err = '';
    child.stderr?.on('data', (d) => (err += d));
    child.on('error', rejectRun);
    child.on('exit', (code) => (code === 0 ? resolveRun() : rejectRun(new Error(`demo agent exited ${code}: ${err}`))));
  });

  await page.goto('/');

  // The agent's proposal renders as a ghost node (id is date-stamped, so match by marker).
  await expect(page.locator('.loom-node--proposal').first()).toHaveCount(1, { timeout: 10000 });

  // The event log shows the agent's writes and their writer.
  await expect(page.getByText('propose', { exact: true }).first()).toHaveCount(1);
  await expect(page.getByText('traverse', { exact: true }).first()).toHaveCount(1);
  await expect(page.getByText('review', { exact: true }).first()).toHaveCount(1);
  await expect(page.getByText('agent', { exact: true }).first()).toHaveCount(1);
});
