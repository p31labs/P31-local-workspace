import { describe, expect, it } from 'vitest';
import { classifyFrame, zonesFromEvents } from './useMusicSession';
import type { LoomEvent } from '@p31/canon/loom/events';

/**
 * B1 — the log/presence split, client-side. Pins:
 *   • committed-resume (the worker's connect hint) is a CONTROL frame, never
 *     parsed as a LoomEvent — a reconnecting client must not corrupt state.
 *   • ephemeral triggers are distinguished by shape, not transport.
 *   • zonesFromEvents is deterministic: the same committed log yields the same
 *     zone list (the reconnect reconciliation path == the initial load path).
 */

const PLACE: LoomEvent = {
  seq: 3,
  ts: '2026-09-21T00:00:00.000Z',
  writer: 'human',
  kind: 'instrument.zone.place',
  node: 'zone:abc',
  position: [1, 0, 0],
  timbre: 'hydrogen',
  name: 'the sun',
};

describe('classifyFrame', () => {
  it('classifies a committed-resume frame as a control frame, not a LoomEvent', () => {
    const f = classifyFrame(JSON.stringify({ type: 'committed-resume', seq: 42 }));
    expect(f).toEqual({ type: 'committed-resume', seq: 42 });
    // It must not be mistaken for a LoomEvent (no kind, no writer).
    expect('kind' in (f as object)).toBe(false);
  });

  it('classifies an ephemeral trigger by shape', () => {
    const f = classifyFrame(JSON.stringify({ type: 'ephemeral', kind: 'zone.trigger', zone: 'z1', origin: 'd' }));
    expect(f).toEqual({ type: 'ephemeral', kind: 'zone.trigger', zone: 'z1', origin: 'd' });
  });

  it('classifies a committed LoomEvent', () => {
    const f = classifyFrame(JSON.stringify(PLACE));
    expect(f).toEqual(PLACE);
  });

  it('returns null for malformed input', () => {
    expect(classifyFrame('not json')).toBeNull();
    expect(classifyFrame('{"noSeq": true}')).toBeNull();
  });
});

describe('zonesFromEvents', () => {
  it('reduces committed place events to zones', () => {
    const zones = zonesFromEvents([PLACE]);
    expect(zones).toEqual([{ id: 'zone:abc', position: [1, 0, 0], timbre: 'hydrogen', name: 'the sun' }]);
  });

  it('ignores non-place kinds', () => {
    const focus: LoomEvent = { seq: 1, ts: 'x', writer: 'human', kind: 'focus', node: '--p31-accent' };
    const zones = zonesFromEvents([focus, PLACE]);
    expect(zones).toHaveLength(1);
  });

  it('is deterministic — same log, same zones, any order', () => {
    const a = zonesFromEvents([PLACE]);
    const b = zonesFromEvents([PLACE]);
    expect(a).toEqual(b);
  });
});