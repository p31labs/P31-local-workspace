import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SpatialInstrumentEngine } from './SpatialInstrumentEngine';

/**
 * The engine's hard rules are testable without a real AudioContext by stubbing
 * the Web Audio graph. These tests pin the CONTRACT (§3 of the build prompt):
 * no sound without the toggle, hard ceiling on the master gain, gesture-only
 * context creation, the node budget, and the listener-push-on-enable behavior.
 */

function fakeAudioContext(opts?: { outputLatency?: number }) {
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
    // Default >0.05s output latency trips the engine's low-end gate, so tests
    // skip to equalpower quickly. Pass outputLatency: 0.01 to test the Safari
    // and cache paths (which the low-end gate would otherwise short-circuit).
    outputLatency: opts?.outputLatency ?? 0.1,
    nodes,
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
    createAnalyser: () => {
      const n = makeNode() as Record<string, unknown> & {
        fftSize: number;
        smoothingTimeConstant: number;
        frequencyBinCount: number;
        getByteFrequencyData: () => void;
      };
      n.fftSize = 128;
      n.smoothingTimeConstant = 0.65;
      n.frequencyBinCount = 64;
      n.getByteFrequencyData = () => {};
      return n;
    },
    listener: { setPosition: () => {}, setOrientation: () => {} },
    resume: vi.fn(() => Promise.resolve()),
    suspend: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  } as unknown as AudioContext;
}

const PROFILE: import('./SpatialInstrumentEngine').TimbreProfile = { oscType: 'sine', volume: 0.5, attack: 0.02, decay: 1, frequency: 440, brightness: 0.5 };

describe('SpatialInstrumentEngine', () => {
  beforeEach(() => {
    // The panning-model decision is cached in sessionStorage; clear it so a
    // prior test's decision can't leak into the next.
    sessionStorage.clear();
  });

  it('never plays before the toggle — the #1 non-negotiable rule', () => {
    vi.stubGlobal('window', { AudioContext: fakeAudioContext });
    const engine = new SpatialInstrumentEngine({ radius: 2.2 });
    engine.addZone({ id: 'z1', x: 0, y: 0, z: 2 }, PROFILE);
    expect(engine.trigger('z1', PROFILE)).toBe(false);
    engine.enable();
    expect(engine.trigger('z1', PROFILE)).toBe(true);
    vi.unstubAllGlobals();
  });

  it('caps the master gain at the configured ceiling (0.6 default)', () => {
    vi.stubGlobal('window', { AudioContext: fakeAudioContext });
    const engine = new SpatialInstrumentEngine({ radius: 2.2 });
    engine.addZone({ id: 'z1', x: 0, y: 0, z: 2 }, PROFILE);
    engine.enable();
    // Bracket access reaches the private field for the ceiling assertion.
    const masterGain = engine['master'] as unknown as { gain: { value: number } } | null;
    expect(masterGain).not.toBeNull();
    expect(masterGain!.gain.value).toBe(0.6);
    vi.unstubAllGlobals();
  });

  it('creates the AudioContext only on the enable gesture — not on construction, not on zone load', () => {
    const Ctor = vi.fn(fakeAudioContext);
    vi.stubGlobal('window', { AudioContext: Ctor });
    const engine = new SpatialInstrumentEngine({ radius: 2.2 });
    expect(Ctor).not.toHaveBeenCalled();
    // Zones arriving from the committed log BEFORE the toggle is tapped must
    // not create the context (§3.4: never on mount, never speculatively).
    engine.addZone({ id: 'z1', x: 0, y: 0, z: 2 }, PROFILE);
    expect(Ctor).not.toHaveBeenCalled();
    engine.enable();
    expect(Ctor).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('remembers the listener position before enable and pushes it on enable', () => {
    const ctx = fakeAudioContext();
    const Ctor = vi.fn(() => ctx);
    vi.stubGlobal('window', { AudioContext: Ctor });
    const engine = new SpatialInstrumentEngine({ radius: 2.2 });
    const spy = vi.spyOn(ctx.listener, 'setPosition');
    // The user moves before sound is on (the scene is always interactive).
    engine.setListener(1, 2, 3);
    expect(spy).not.toHaveBeenCalled();
    engine.enable();
    expect(spy).toHaveBeenCalledWith(1, 2, 3);
    vi.unstubAllGlobals();
  });

  it('refuses zones past the node budget (§5.2)', () => {
    vi.stubGlobal('window', { AudioContext: fakeAudioContext });
    const engine = new SpatialInstrumentEngine({ radius: 2.2, maxZones: 3 });
    for (let i = 0; i < 3; i++) {
      expect(engine.addZone({ id: `z${i}`, x: 0, y: 0, z: 2 }, PROFILE)).toBe(true);
    }
    expect(engine.addZone({ id: 'z-over', x: 0, y: 0, z: 2 }, PROFILE)).toBe(false);
    vi.unstubAllGlobals();
  });

  it('builds a zone added after enable immediately (SSE placement while sound is on)', () => {
    vi.stubGlobal('window', { AudioContext: fakeAudioContext });
    const engine = new SpatialInstrumentEngine({ radius: 2.2 });
    engine.enable();
    expect(engine.addZone({ id: 'late', x: 0, y: 0, z: 2 }, PROFILE)).toBe(true);
    expect(engine.trigger('late', PROFILE)).toBe(true);
    vi.unstubAllGlobals();
  });

  it('uses equalpower on Mobile Safari — no HRTF probe (family-browser gate)', () => {
    // A Safari UA with LOW output latency (so the low-end gate doesn't fire
    // first) must still land on equalpower: Mobile Safari has limited HRTF /
    // ConvolverNode support, and is the browser without Web MIDI.
    const ctx = fakeAudioContext({ outputLatency: 0.01 });
    const Ctor = vi.fn(() => ctx);
    vi.stubGlobal('window', { AudioContext: Ctor });
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      hardwareConcurrency: 8,
    });
    const engine = new SpatialInstrumentEngine({ radius: 2.2 });
    engine.enable();
    engine.addZone({ id: 'z1', x: 0, y: 0, z: 2 }, PROFILE);
    // Every panner the engine created for zones must be equalpower.
    const fake = ctx as unknown as { nodes: Array<Record<string, unknown>> };
    const panners = fake.nodes.filter((n) => n.distanceModel !== '');
    expect(panners.length).toBeGreaterThan(0);
    for (const p of panners) expect(p.panningModel).toBe('equalpower');
    vi.unstubAllGlobals();
  });

  it('keeps HRTF on a capable non-Safari device with no cached decision', () => {
    const ctx = fakeAudioContext({ outputLatency: 0.01 });
    const Ctor = vi.fn(() => ctx);
    vi.stubGlobal('window', { AudioContext: Ctor });
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      hardwareConcurrency: 8,
    });
    const engine = new SpatialInstrumentEngine({ radius: 2.2 });
    engine.enable();
    engine.addZone({ id: 'z1', x: 0, y: 0, z: 2 }, PROFILE);
    const fake = ctx as unknown as { nodes: Array<Record<string, unknown>> };
    const panners = fake.nodes.filter((n) => n.distanceModel !== '');
    expect(panners.length).toBeGreaterThan(0);
    for (const p of panners) expect(p.panningModel).toBe('HRTF');
    vi.unstubAllGlobals();
  });
});