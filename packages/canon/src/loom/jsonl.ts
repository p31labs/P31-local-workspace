/**
 * @p31/canon — loom/jsonl.ts
 *
 * The append-only event sink/reader. No UI, no server, no opinion about who
 * writes — Path α (canvas) and Path β (canon-mcp) both append through this and
 * neither owns it. One line per event, seq-ordered on read.
 *
 * Durability: append + fsync. Corruption tolerance: a malformed line is
 * skipped, never fatal — the log is a record, not a database.
 */
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  existsSync,
  openSync,
  fsyncSync,
  closeSync,
} from 'node:fs';
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
