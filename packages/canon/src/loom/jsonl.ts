/**
 * @p31/canon — loom/jsonl.ts
 *
 * The READ side of the append-only log. Public and safe: reading cannot bypass
 * the gate. The WRITE side lives in jsonl-write.internal.ts and is reachable
 * only through commit(). If you need to append, use commit(logPath, input) —
 * not this file.
 *
 * Corruption tolerance: a malformed or partial line is skipped, never fatal —
 * the log is a record, not a database.
 */
import { readFileSync, existsSync } from 'node:fs';
import type { LoomEvent } from './events.ts';

/** Read every event, skipping malformed lines, sorted ascending by seq. */
export function readEvents(path: string): LoomEvent[] {
  if (!existsSync(path)) return [];
  const events: LoomEvent[] = [];
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line) as LoomEvent);
    } catch {
      // skip corrupt line
    }
  }
  return events.sort((a, b) => a.seq - b.seq);
}

/** The next sequence number to use for a log. Empty log -> 0, so the first
 *  event is seq 0 and always matches what ReplayGate stamps. */
export function nextSeq(events: readonly LoomEvent[]): number {
  return events.reduce((max, e) => Math.max(max, e.seq), -1) + 1;
}
