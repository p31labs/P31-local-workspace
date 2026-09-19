/**
 * @p31/canon — loom/commitWeft.ts
 *
 * The single WEFT write path. Where commit() writes the warp (artifact log),
 * commitWeft() writes the weft (read log). Both share the append + lock
 * primitives in jsonl-append.internal.ts; the seal gate allows exactly these
 * two importers.
 *
 * The weft is operational telemetry, not canonical. commitWeft() still holds
 * the lock and still validates through WeftGate — a malformed read line is a
 * write failure, not a silently-skipped event. Retention is NOT applied
 * inline: pruning the weft is a separate maintenance step (`pruneWeft` in
 * weft.ts), because rewriting the file under the append lock would smuggle a
 * second write primitive into a sealed module. Keep commitWeft append-only.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { WeftGate, readWeft, type WeftEventInput } from './weft.ts';
import { appendEvent, acquireLock, releaseLock } from './jsonl-append.internal.ts';
import type { WeftEvent } from './weft.ts';

export interface CommitWeftResult {
  valid: boolean;
  error?: string;
  event?: WeftEvent;
}

export function commitWeft(weftPath: string, input: WeftEventInput): CommitWeftResult {
  mkdirSync(dirname(weftPath), { recursive: true });
  const lock = acquireLock(weftPath);
  if ('error' in lock) return { valid: false, error: lock.error };

  try {
    const gate = new WeftGate();
    if (existsSync(weftPath)) {
      const load = gate.fromJSONL(readWeft(weftPath).map((e) => JSON.stringify(e)).join('\n'));
      if (!load.valid) return { valid: false, error: `weft is not replayable: ${load.error}` };
    }

    const appended = gate.append(input);
    if (!appended.valid) return { valid: false, error: appended.error };

    const stamped = gate.getLog()[gate.getLog().length - 1];
    appendEvent(weftPath, stamped);
    return { valid: true, event: stamped };
  } finally {
    releaseLock(lock);
  }
}
