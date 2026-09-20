import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// e2e/ -> apps/loom/.loom/ci-events.jsonl (the same target the dev middleware
// and the demo agent resolve).
const logPath = resolve(here, '..', '.loom', 'ci-events.jsonl');

/** Truncate the shared warp log before the suite so each run is deterministic
 *  (the log otherwise accumulates across runs and between parallel specs). */
export default function globalSetup(): void {
  mkdirSync(dirname(logPath), { recursive: true });
  writeFileSync(logPath, '');
}
