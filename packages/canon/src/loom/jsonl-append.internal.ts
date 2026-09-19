/**
 * @p31/canon — loom/jsonl-append.internal.ts
 *
 * The ONLY file that touches the filesystem for appends — to EITHER log. It
 * holds the two primitives every write path shares:
 *
 *   - `appendEvent` — append one JSONL line + best-effort fsync.
 *   - `acquireLock` / `releaseLock` — the cross-process exclusive lock.
 *
 * Internal: the filename ends in `.internal.ts`, so generate-exports never
 * mints a public specifier. Exactly two modules may import it — `commit.ts`
 * (warp) and `commitWeft.ts` (weft) — and the seal gate fails the build on a
 * third. Two logs, one append primitive, two sealed importers.
 */
import { appendFileSync, mkdirSync, openSync, fsyncSync, closeSync, unlinkSync, statSync, writeSync } from 'node:fs';
import { dirname } from 'node:path';

const LOCK_SUFFIX = '.lock';
const STALE_LOCK_MS = 10_000;
const LOCK_TIMEOUT_MS = 5_000;
const LOCK_RETRY_MS = 20;

/** Synchronous sleep via Atomics — Node has no sync sleep primitive. */
function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Append one record as a JSONL line, creating the directory if needed. */
export function appendEvent(path: string, event: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(event) + '\n');
  try {
    const fd = openSync(path, 'r');
    fsyncSync(fd);
    closeSync(fd);
  } catch {
    // fsync is best-effort; the append already succeeded.
  }
}

export function acquireLock(logPath: string): { lockPath: string } | { error: string } {
  const lockPath = logPath + LOCK_SUFFIX;
  const deadline = Date.now() + LOCK_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      // O_EXCL create: atomic test-and-set.
      const fd = openSync(lockPath, 'wx');
      writeSync(fd, String(process.pid));
      closeSync(fd);
      return { lockPath };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
        return { error: `lock create failed: ${(err as Error).message}` };
      }
      // Lock held. Is the holder dead?
      try {
        const age = Date.now() - statSync(lockPath).mtimeMs;
        if (age > STALE_LOCK_MS) {
          try { unlinkSync(lockPath); } catch { /* raced; loop retries */ }
          continue;
        }
      } catch { /* lock vanished between EEXIST and stat; retry */ }
      sleepSync(LOCK_RETRY_MS + Math.floor(Math.random() * LOCK_RETRY_MS));
    }
  }
  return { error: `lock timeout after ${LOCK_TIMEOUT_MS}ms (another writer may be stuck)` };
}

export function releaseLock(handle: { lockPath: string }): void {
  try { unlinkSync(handle.lockPath); } catch { /* ignore */ }
}
