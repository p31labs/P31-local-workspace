/**
 * @p31/canon — loom/jsonl-write.internal.ts
 *
 * The ONLY file that appends to the log. It is an INTERNAL module: the file
 * name ends in `.internal.ts`, so generate-exports never mints a public
 * specifier for it. Only commit() may import it.
 *
 * Every other writer must go through commit() so the ReplayGate validates the
 * event, writer-per-kind holds, and seq is assigned under the cross-process
 * lock. Importing this file directly anywhere but commit.ts is a bypass.
 *
 * Durability: append + best-effort fsync.
 */
import { appendFileSync, mkdirSync, openSync, fsyncSync, closeSync } from 'node:fs';
import { dirname } from 'node:path';
import type { LoomEvent } from './events.ts';

/** Append one event as a JSONL line, creating the directory if needed. */
export function appendEvent(path: string, event: LoomEvent): void {
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
