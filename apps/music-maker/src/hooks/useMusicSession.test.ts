import { describe, expect, it } from 'vitest';
import { classifyFrame, unseenRemoteTriggers, zonesFromEvents } from './useMusicSession';
import type { RemoteTrigger } from './useMusicSession';
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
    expect(f).toEqual({ kind: 'control', seq: 42 });
    // It must not be mistaken for a LoomEvent — its kind is 'control', never a
    // LoomEvent kind like focus/place/clear/name.
    expect(f && f.kind).toBe('control');
  });

  it('classifies an ephemeral trigger by shape', () => {
    const f = classifyFrame(JSON.stringify({ type: 'ephemeral', kind: 'zone.trigger', zone: 'z1', origin: 'd' }));
    expect(f).toEqual({ kind: 'ephemeral', trigger: { type: 'ephemeral', kind: 'zone.trigger', zone: 'z1', origin: 'd' } });
  });

  it('classifies a commit-ack echo', () => {
    const f = classifyFrame(JSON.stringify({ type: 'commit-ack', requestId: 'c1', valid: true, event: PLACE }));
    expect(f).toEqual({ kind: 'commitAck', requestId: 'c1', valid: true, error: undefined, event: PLACE });
  });

  it('classifies a committed LoomEvent', () => {
    const f = classifyFrame(JSON.stringify(PLACE));
    expect(f).toEqual({ kind: 'committed', event: PLACE });
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

describe('unseenRemoteTriggers', () => {
  const t = (seq: number, zone = `z${seq}`): RemoteTrigger => ({ zone, origin: 'd', at: Date.now(), seq });

  it('returns unseen triggers in arrival order (oldest first)', () => {
    // newest-first list: [seq 5, seq 4, seq 3]
    const list = [t(5), t(4), t(3)];
    const unseen = unseenRemoteTriggers(list, 2);
    expect(unseen.map((x) => x.seq)).toEqual([3, 4, 5]);
  });

  it('survives the 8-item cap — tracking by seq, not array length', () => {
    // The cap is 8. Simulate a list already at the cap, then a 9th trigger.
    const list = [t(9), t(8), t(7), t(6), t(5), t(4), t(3), t(2)]; // 8 items, newest-first
    // Consumer already played up to seq 8. New triggers are 9.
    const unseen = unseenRemoteTriggers(list, 8);
    expect(unseen.map((x) => x.seq)).toEqual([9]);
    // Once the cap drops the old tail, seq 9 is still tracked correctly.
    const capped = [t(9), t(8), t(7), t(6), t(5), t(4), t(3)]; // still at cap, tail dropped
    const unseen2 = unseenRemoteTriggers(capped, 8);
    expect(unseen2.map((x) => x.seq)).toEqual([9]);
  });

  it('returns empty when nothing is new', () => {
    const list = [t(3), t(2), t(1)];
    expect(unseenRemoteTriggers(list, 3)).toEqual([]);
  });
});