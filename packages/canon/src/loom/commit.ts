/**
 * @p31/canon — loom/commit.ts
 *
 * The single write path. Every writer — the human CLI, the presence server,
 * the canvas, any agent — appends through commit(). It is the only function
 * that touches the JSONL file for writes.
 *
 * Invariant: commit(logPath, input) either (a) validates through ReplayGate,
 * persists via appendEvent, and returns the stamped event, or (b) returns an
 * error and writes nothing. There is no third outcome.
 *
 * Concurrency: commit() holds an exclusive lock file for the duration of
 * read → validate → append. Two processes committing simultaneously serialize;
 * the second sees the first's event and is stamped a later seq. Without this,
 * two processes both read seq 41, both stamp 42, and the log has a duplicate
 * seq — a determinism violation, not a nit.
 */
import { existsSync, openSync, closeSync, unlinkSync, statSync, writeSync } from 'node:fs';
import { ReplayGate, type LoomEventInput } from './gate.ts';
import { readEvents, nextSeq } from './jsonl.ts';
import { appendEvent } from './jsonl-write.internal.ts';
import type { LoomEvent } from './events.ts';

export interface CommitResult {
  valid: boolean;
  error?: string;
  event?: LoomEvent;
}

const LOCK_SUFFIX = '.lock';
const STALE_LOCK_MS = 10_000;
const LOCK_TIMEOUT_MS = 5_000;
const LOCK_RETRY_MS = 20;

/** Synchronous sleep via Atomics — Node has no sync sleep primitive. */
function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function acquireLock(logPath: string): { lockPath: string } | { error: string } {
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

function releaseLock(handle: { lockPath: string }): void {
  try { unlinkSync(handle.lockPath); } catch { /* ignore */ }
}

export function commit(logPath: string, input: LoomEventInput): CommitResult {
  const lock = acquireLock(logPath);
  if ('error' in lock) return { valid: false, error: lock.error };

  try {
    // Load the current log into a gate. This re-runs every invariant the gate
    // enforces, so a corrupted or tampered log is caught before we add to it.
    const gate = new ReplayGate();
    if (existsSync(logPath)) {
      const lines = readEvents(logPath).map((e) => JSON.stringify(e)).join('\n');
      const load = gate.fromJSONL(lines);
      if (!load.valid) {
        return { valid: false, error: `log is not replayable: ${load.error}` };
      }
    }

    // Validate the new input against current state; the gate stamps seq + ts.
    const appended = gate.append(input);
    if (!appended.valid) return { valid: false, error: appended.error };

    const stamped = gate.getLog()[gate.getLogLength() - 1];

    // Under the lock, diskNext is authoritative. A mismatch means a writer
    // bypassed commit — surface it rather than paper over it.
    const diskNext = nextSeq(readEvents(logPath));
    if (stamped.seq !== diskNext) {
      return {
        valid: false,
        error: `seq mismatch: gate stamped ${stamped.seq}, disk expected ${diskNext} — a writer bypassed commit()`,
      };
    }

    appendEvent(logPath, stamped);
    return { valid: true, event: stamped };
  } finally {
    releaseLock(lock);
  }
}
