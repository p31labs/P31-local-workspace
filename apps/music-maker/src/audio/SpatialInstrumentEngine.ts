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
 *   • AudioContext is created/resumed only on a user gesture. Zones can be
 *     loaded from the committed log BEFORE the toggle is tapped — they are
 *     held in a pending buffer and the audio graph is built inside enable(),
 *     never speculatively on mount.
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
  /** Family-scale node budget (§5.2). The engine refuses past this. */
  maxZones?: number;
}

const DEFAULT_CEILING = 0.6;
const DEFAULT_MAX_ZONES = 16;

/** The family-scale node budget (§5.2). Exported so the UI (App) refuses at
 *  the same count the engine enforces — one source of truth, no drift. */
export const FAMILY_ZONE_BUDGET = DEFAULT_MAX_ZONES;

interface PendingZone {
  voice: ZoneVoice;
  profile: TimbreProfile;
}

export class SpatialInstrumentEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voicePanners = new Map<string, PannerNode>();
  private voiceGains = new Map<string, GainNode>();
  private voiceFilters = new Map<string, BiquadFilterNode>();
  private voiceOscs = new Map<string, OscillatorNode[]>();
  private pendingZones = new Map<string, PendingZone>();
  private readonly opts: Required<SpatialInstrumentOptions>;
  private soundEnabled = false;
  private effectiveModel: PanningModelType | null = null;
  private listenerPosition: [number, number, number] = [0, 0, 0];

  constructor(opts: SpatialInstrumentOptions) {
    this.opts = {
      masterCeiling: opts.masterCeiling ?? DEFAULT_CEILING,
      panningModel: opts.panningModel ?? 'HRTF',
      radius: opts.radius,
      maxZones: opts.maxZones ?? DEFAULT_MAX_ZONES,
    };
  }

  get enabled(): boolean {
    return this.soundEnabled;
  }

  /** The number of zones in the composition (pending + built). */
  get zoneCount(): number {
    return this.pendingZones.size + this.voicePanners.size;
  }

  get maxZones(): number {
    return this.opts.maxZones;
  }

  /** The user gesture: the sound toggle tap. No other call creates the context.
   *  Building the graph here — not on mount — is the §3.4 gesture boundary. */
  enable(): void {
    this.soundEnabled = true;
    const ac = this.ensureContext();
    if (!ac) return;
    if (ac.state === 'suspended') void ac.resume();
    this.buildPendingZones();
    // The listener position may have been set before sound was enabled (a
    // silent no-op then). Push the current position now, or the listener
    // would sit at the origin — likely inside the sphere.
    this.pushListener();
  }

  disable(): void {
    this.soundEnabled = false;
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend();
  }

  /**
   * Queue a zone's voice. Idempotent per zone id. Returns false when the
   * composition is already at the node budget (§5.2) — the caller should
   * surface that refusal, not let the graph grow unbounded.
   *
   * A zone added AFTER the context is live (sound already enabled) is built
   * immediately; a zone added before the toggle is held in the pending buffer
   * and built inside enable().
   */
  addZone(voice: ZoneVoice, profile: TimbreProfile): boolean {
    if (this.voicePanners.has(voice.id) || this.pendingZones.has(voice.id)) return true;
    if (this.zoneCount >= this.opts.maxZones) return false;
    if (this.ctx && this.master) {
      // The graph is already live (sound on): build this voice now.
      this.buildVoice(voice, profile);
      return true;
    }
    // Store only the data. The AudioContext and its nodes are built inside
    // enable(), on the user gesture — never here, never speculatively.
    this.pendingZones.set(voice.id, { voice, profile });
    return true;
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
    this.pendingZones.delete(id);
  }

  /** The ids of all zones in the composition (pending + built). */
  zoneIds(): string[] {
    return [...new Set([...this.voicePanners.keys(), ...this.pendingZones.keys()])];
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

  /** Move the listener. Remembered even before the context exists, so the
   *  first enable() hears the position the user already moved to. Throttled to
   *  animation-frame rate by the caller. */
  setListener(x: number, y: number, z: number): void {
    this.listenerPosition = [x, y, z];
    this.pushListener();
  }

  /** Release the graph. */
  dispose(): void {
    const ac = this.ctx;
    if (ac) {
      for (const id of [...this.voicePanners.keys()]) this.removeZone(id);
      this.master?.disconnect();
      void ac.close().catch(() => {});
    }
    this.pendingZones.clear();
    this.ctx = null;
    this.master = null;
    this.effectiveModel = null;
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private pushListener(): void {
    const ac = this.ctx;
    if (!ac) return;
    const [x, y, z] = this.listenerPosition;
    ac.listener.setPosition(x, y, z);
    ac.listener.setOrientation(-x, -y, -z, 0, 1, 0);
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

  /** Choose the panning model BEFORE the real graph is built. Device signals are
   *  the whole decision. There is deliberately NO runtime probe: creating a
   *  panner node does not load the HRTF database — that happens on the first
   *  AUDIO sample it processes, which is too late to switch models. A "probe"
   *  that measures panner creation returns ~0ms on every device and caches a
   *  fake result; it was removed for that reason. We step down to equalpower
   *  when the signals predict trouble, and accept HRTF elsewhere.
   *
   *  Order of decisions:
   *   1. Opt-in or forced equalpower → equalpower.
   *   2. Mobile Safari → equalpower (research: "Mobile Safari has limited
   *      support for HRTF and ConvolverNode; fall back to StereoPannerNode +
   *      simple gain control"). Safari is also the browser that lacks Web MIDI.
   *   3. Low-end device signal (hardwareConcurrency ≤ 4 or outputLatency >
   *      50ms) → equalpower.
   *   4. sessionStorage cache → reuse a previous decision (the HRTF DB load is
   *      a one-time cost per context, not per enable).
   *   5. Otherwise → HRTF (the IEEE 2025 WebXR study: HRTF measurably beats
   *      equalpower for localization; accept it unless signals say otherwise).
   *      Thresholds are provisional and device-calibrated. */
  private choosePanningModel(): PanningModelType {
    if (this.opts.panningModel !== 'HRTF') return this.opts.panningModel;
    if (!this.ctx || !this.master) return this.opts.panningModel;

    // 1. Mobile Safari → equalpower. /^((?!chrome|android).)*safari/i misses
    //    Chrome-on-iOS, so also check the vendor. One family-browser gate
    //    covers both HRTF limits and Web MIDI absence.
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isSafari =
      /^((?!chrome|android).)*safari/i.test(ua) ||
      (/iPad|iPhone|iPod/.test(ua) && !/CriOS/.test(ua));
    if (isSafari) return 'equalpower';

    // 2. Low-end device signal.
    const hw = (navigator.hardwareConcurrency ?? 8);
    const latency = this.ctx.outputLatency ?? 0;
    if (hw <= 4 || latency > 0.05) return 'equalpower';

    // 3. sessionStorage cache — the decision is stable within a session.
    try {
      const cached = sessionStorage.getItem('music-maker:panning-model');
      if (cached === 'HRTF' || cached === 'equalpower') return cached;
    } catch {
      // sessionStorage unavailable — fall through to the default.
    }

    // 4. Default: HRTF. Persist the decision for the rest of the session.
    try {
      sessionStorage.setItem('music-maker:panning-model', 'HRTF');
    } catch { /* non-fatal */ }
    return 'HRTF';
  }

  private buildPendingZones(): void {
    const ac = this.ctx;
    if (!ac || !this.master) return;

    for (const { voice, profile } of this.pendingZones.values()) {
      this.buildVoice(voice, profile);
    }
    this.pendingZones.clear();
  }

  /** Build one zone's PannerNode → filter → gain chain into the live graph. */
  private buildVoice(voice: ZoneVoice, profile: TimbreProfile): void {
    const ac = this.ctx;
    if (!ac || !this.master) return;
    // TS cannot narrow `this.effectiveModel` through the null-check (it's a
    // mutable class field), so pick a local once.
    const model = this.effectiveModel ?? this.choosePanningModel();
    this.effectiveModel = model;

    const panner = ac.createPanner();
    panner.panningModel = model;
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
    gain.connect(this.master);

    this.voicePanners.set(voice.id, panner);
    this.voiceGains.set(voice.id, gain);
    this.voiceFilters.set(voice.id, filter);
    this.voiceOscs.set(voice.id, []);
  }
}