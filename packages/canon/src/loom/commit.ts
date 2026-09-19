/**
 * @p31/canon — loom/commit.ts
 *
 * The single WARP write path. Every writer — the human CLI, the presence
 * server, the canvas, any agent — appends through commit(). It is the only
 * function that touches the artifact log for writes. (The weft has its own
 * sealed path: commitWeft.ts. Both share the append + lock primitives in
 * jsonl-append.internal.ts.)
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
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { ReplayGate, type LoomEventInput } from './gate.ts';
import { readEvents, nextSeq } from './jsonl.ts';
import { appendEvent, acquireLock, releaseLock } from './jsonl-append.internal.ts';
import type { LoomEvent } from './events.ts';

export interface CommitResult {
  valid: boolean;
  error?: string;
  event?: LoomEvent;
}

export function commit(logPath: string, input: LoomEventInput): CommitResult {
  // The lock file lives next to the log; ensure the directory exists before
  // acquiring it (appendEvent also mkdirs, but only after the lock is held).
  mkdirSync(dirname(logPath), { recursive: true });
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
