/**
 * @p31/canon — loom/log-path.ts
 *
 * The single source of truth for resolving the shared event log path. Node-only.
 *
 * `process.env.LOOM_LOG` wins. Otherwise walk up from the current working
 * directory to the first directory containing `pnpm-workspace.yaml` (the repo
 * root) and resolve `.loom/events.jsonl` there. cwd-based, not import.meta.url
 * based, so it survives Vite's config bundling.
 *
 * Both lanes import this: the β-2 canvas dev middleware and seed/demo scripts,
 * and the β-1 presence handlers. Two different defaults is the difference
 * between convergence passing and passing against an empty log on one side.
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
