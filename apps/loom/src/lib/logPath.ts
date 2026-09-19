/**
 * The Loom — log path resolution.
 *
 * Node-only. Imported by the Vite dev middleware and the seed/demo agents, so
 * both write the SAME log. Two different defaults is the difference between the
 * convergence test passing and passing against an empty log on one side.
 *
 * `process.env.LOOM_LOG` wins. Otherwise walk up from the current working
 * directory to the first directory containing `pnpm-workspace.yaml` (the repo
 * root) and resolve `.loom/events.jsonl` there. cwd-based, not import.meta.url
 * based, so it survives Vite's config bundling.
 */
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export function resolveLogPath(): string {
  if (process.env.LOOM_LOG) return process.env.LOOM_LOG;

  let dir = resolve(process.cwd());
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      return join(dir, '.loom', 'events.jsonl');
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error('repo root not found (no pnpm-workspace.yaml up the tree)');
    }
    dir = parent;
  }
}
