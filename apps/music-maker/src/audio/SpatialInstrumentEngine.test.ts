import { describe, expect, it, vi } from 'vitest';
import { SpatialInstrumentEngine } from './SpatialInstrumentEngine';

/**
 * The engine's hard rules are testable without a real AudioContext by stubbing
 * the Web Audio graph. These tests pin the CONTRACT (§3 of the build prompt):
 * no sound without the toggle, hard ceiling on the master gain, and
 * gesture-only context creation.
 */

function fakeAudioContext() {
  const destination = { connect: () => {} };
  const nodes: Array<Record<string, unknown>> = [];
  const makeNode = () => {
    const n: Record<string, unknown> = {
      connect: function (this: Record<string, unknown>) { return this; },
      disconnect: () => {},
      gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      frequency: { value: 0, setValueAtTime: () => {} },
      value: 0,
      threshold: { value: 0 },
      knee: { value: 0 },
      ratio: { value: 1 },
      attack: { value: 0 },
      release: { value: 0 },
      panningModel: '',
      distanceModel: '',
      refDistance: 0,
      maxDistance: 0,
      setPosition: () => {},
      Q: { value: 0 },
      type: '',
      state: 'suspended',
    };
    nodes.push(n);
    return n;
  };
  return {
    currentTime: 0,
    state: 'suspended',
    destination,
    createGain: () => makeNode(),
    createPanner: () => makeNode(),
    createOscillator: () => {
      const n = makeNode() as Record<string, unknown> & { start: () => void; stop: () => void; addEventListener: () => void };
      n.start = () => {};
      n.stop = () => {};
      n.addEventListener = () => {};
      return n;
    },
    createBiquadFilter: () => makeNode(),
    createDynamicsCompressor: () => makeNode(),
    listener: { setPosition: () => {}, setOrientation: () => {} },
    resume: vi.fn(() => Promise.resolve()),
    suspend: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  } as unknown as AudioContext;
}

describe('SpatialInstrumentEngine', () => {
  it('never plays before the toggle — the #1 non-negotiable rule', () => {
    vi.stubGlobal('window', { AudioContext: fakeAudioContext });
    const engine = new SpatialInstrumentEngine({ radius: 2.2 });
    engine.addZone({ id: 'z1', x: 0, y: 0, z: 2 }, { oscType: 'sine', volume: 0.5, attack: 0.02, decay: 1, frequency: 440, brightness: 0.5 });
    expect(engine.trigger('z1', { oscType: 'sine', volume: 0.5, attack: 0.02, decay: 1, frequency: 440, brightness: 0.5 })).toBe(false);
    engine.enable();
    expect(engine.trigger('z1', { oscType: 'sine', volume: 0.5, attack: 0.02, decay: 1, frequency: 440, brightness: 0.5 })).toBe(true);
    vi.unstubAllGlobals();
  });

  it('caps the master gain at the configured ceiling (0.6 default)', () => {
    vi.stubGlobal('window', { AudioContext: fakeAudioContext });
    const engine = new SpatialInstrumentEngine({ radius: 2.2 });
    engine.addZone({ id: 'z1', x: 0, y: 0, z: 2 }, { oscType: 'sine', volume: 0.5, attack: 0.02, decay: 1, frequency: 440, brightness: 0.5 });
    // Bracket access reaches the private field for the ceiling assertion.
    const masterGain = engine['master'] as unknown as { gain: { value: number } } | null;
    expect(masterGain).not.toBeNull();
    expect(masterGain!.gain.value).toBe(0.6);
    vi.unstubAllGlobals();
  });

  it('does not create an AudioContext on construction — only on a gesture', () => {
    const Ctor = vi.fn(fakeAudioContext);
    vi.stubGlobal('window', { AudioContext: Ctor });
    const engine = new SpatialInstrumentEngine({ radius: 2.2 });
    expect(Ctor).not.toHaveBeenCalled();
    engine.enable();
    expect(Ctor).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});