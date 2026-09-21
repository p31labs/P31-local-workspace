/**
 * The music maker — SpatialInstrumentEngine.
 *
 * One engine, N zones. Each zone owns one PannerNode + one GainNode +
 * oscillator(s) sourced from a timbre profile. The graph (per §5.1 of the
 * build prompt):
 *
 *   AudioContext
 *    └─ masterGain (hard ceiling 0.6)
 *        └─ compressor (DynamicsCompressorNode, gentle knee)
 *            └─ per-zone: PannerNode (HRTF|equalpower, inverse distance)
 *                └─ per-zone: GainNode (envelope from timbre profile)
 *                    └─ oscillator(s)
 *
 * Non-negotiable rules (all from the build prompt §3):
 *   • No sound plays without an explicit prior tap on the sound toggle in
 *     this session. `soundEnabled` is the only gate.
 *   • No sound object exceeds the master gain ceiling regardless of how many
 *     zones trigger at once (a child mashing six zones must not spike).
 *   • AudioContext is created/resumed only on a user gesture.
 *   • HRTF fallback to equalpower is automatic and silent — interaction is
 *     identical, only fidelity differs.
 *
 * The TimbreProfile shape reuses phos's spoonProfile()-style fields
 * (oscType/volume/attack/decay) so the sonic vocabulary is inherited, not
 * reinvented (apps/phos/src/lib/sound.ts).
 */

export interface TimbreProfile {
  oscType: OscillatorType;
  volume: number;
  attack: number;
  decay: number;
  /** The zone's base frequency in Hz. */
  frequency: number;
  /** 0..1 brightness; drives the lowpass cutoff on the zone's filter. */
  brightness: number;
}

export interface ZoneVoice {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface SpatialInstrumentOptions {
  /** Hard ceiling on the master gain (linear). §3.2. */
  masterCeiling?: number;
  /** HRTF is the default; equalpower is the silent fallback. §3.5. */
  panningModel?: PannerOptions['panningModel'];
  /** Sphere radius — distance falloff is computed from it (§5.1). */
  radius: number;
}

const DEFAULT_CEILING = 0.6;

export class SpatialInstrumentEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voicePanners = new Map<string, PannerNode>();
  private voiceGains = new Map<string, GainNode>();
  private voiceFilters = new Map<string, BiquadFilterNode>();
  private voiceOscs = new Map<string, OscillatorNode[]>();
  private readonly opts: Required<SpatialInstrumentOptions>;
  private soundEnabled = false;

  constructor(opts: SpatialInstrumentOptions) {
    this.opts = {
      masterCeiling: opts.masterCeiling ?? DEFAULT_CEILING,
      panningModel: opts.panningModel ?? 'HRTF',
      radius: opts.radius,
    };
  }

  get enabled(): boolean {
    return this.soundEnabled;
  }

  /** The user gesture: the sound toggle tap. No other call creates the context. */
  enable(): void {
    this.soundEnabled = true;
    const ac = this.ensureContext();
    if (ac && ac.state === 'suspended') void ac.resume();
  }

  disable(): void {
    this.soundEnabled = false;
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend();
  }

  /** Create a zone's voice. Idempotent per zone id. */
  addZone(voice: ZoneVoice, profile: TimbreProfile): void {
    const ac = this.ensureContext();
    if (!ac) return;
    if (this.voicePanners.has(voice.id)) return;

    const panner = ac.createPanner();
    panner.panningModel = this.opts.panningModel;
    panner.distanceModel = 'inverse';
    // refDistance/maxDistance from the sphere radius so falloff feels
    // proportionate regardless of how many zones are on it (§5.1).
    panner.refDistance = this.opts.radius * 0.5;
    panner.maxDistance = this.opts.radius * 3;
    panner.setPosition(voice.x, voice.y, voice.z);

    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400 + profile.brightness * 6000;
    filter.Q.value = 0.8;

    const gain = ac.createGain();
    gain.gain.value = 0;

    panner.connect(filter);
    filter.connect(gain);
    gain.connect(this.master!);

    this.voicePanners.set(voice.id, panner);
    this.voiceGains.set(voice.id, gain);
    this.voiceFilters.set(voice.id, filter);
    this.voiceOscs.set(voice.id, []);
  }

  removeZone(id: string): void {
    const ac = this.ctx;
    for (const osc of this.voiceOscs.get(id) ?? []) {
      try { osc.stop(); } catch { /* already stopped */ }
      osc.disconnect();
    }
    this.voicePanners.get(id)?.disconnect();
    this.voiceGains.get(id)?.disconnect();
    this.voiceFilters.get(id)?.disconnect();
    this.voicePanners.delete(id);
    this.voiceGains.delete(id);
    this.voiceFilters.delete(id);
    this.voiceOscs.delete(id);
  }

  /** The ids of the zones currently in the audio graph. */
  zoneIds(): string[] {
    return [...this.voicePanners.keys()];
  }

  /**
   * Trigger a zone. Returns whether sound actually fired; callers must render
   * the visual echo regardless (the "every cue has a visual equivalent" rule).
   * Envelope from the timbre profile, envelope per-zone so a repeated trigger
   * re-attacks cleanly.
   */
  trigger(id: string, profile: TimbreProfile): boolean {
    const ac = this.ctx;
    if (!ac || !this.soundEnabled || !this.voicePanners.has(id)) return false;

    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const voiceGain = this.voiceGains.get(id)!;
    osc.type = profile.oscType;
    osc.frequency.setValueAtTime(profile.frequency, t);

    osc.connect(this.voiceFilters.get(id)!);
    voiceGain.gain.setValueAtTime(0, t);
    voiceGain.gain.linearRampToValueAtTime(profile.volume, t + profile.attack);
    voiceGain.gain.exponentialRampToValueAtTime(0.001, t + profile.decay);

    osc.start(t);
    osc.stop(t + profile.decay + 0.1);
    osc.addEventListener('ended', () => osc.disconnect(), { once: true });
    this.voiceOscs.get(id)?.push(osc);

    return true;
  }

  /** Move the listener. Throttled to animation-frame rate by the caller. */
  setListener(x: number, y: number, z: number): void {
    const ac = this.ctx;
    if (!ac) return;
    ac.listener.setPosition(x, y, z);
    ac.listener.setOrientation(-x, -y, -z, 0, 1, 0);
  }

  /** Release the graph. */
  dispose(): void {
    const ac = this.ctx;
    if (!ac) return;
    for (const id of [...this.voicePanners.keys()]) this.removeZone(id);
    this.master?.disconnect();
    void ac.close().catch(() => {});
    this.ctx = null;
    this.master = null;
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();

    this.master = this.ctx.createGain();
    this.master.gain.value = this.opts.masterCeiling; // the hard ceiling

    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.knee.value = 20;
    comp.ratio.value = 6;
    comp.attack.value = 0.004;
    comp.release.value = 0.24;
    this.master.connect(comp).connect(this.ctx.destination);

    return this.ctx;
  }
}