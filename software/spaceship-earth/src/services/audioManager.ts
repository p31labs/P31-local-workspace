/**
 * @file audioManager — Procedural SFX layer for Spaceship Earth.
 *
 * Shares the AudioContext from `audioEngine` (no second context — mobile
 * browsers cap at 1–2 concurrent AudioContexts). All sounds are synthesized
 * on-demand using Web Audio oscillators + gain envelopes. No audio files required.
 *
 * Architecture:
 *   audioEngine (ambient drone)     — existing, from @p31/shared
 *   audioManager (SFX / one-shots)  — this file, routes through same ctx
 *
 * Spatial audio:
 *   `updateSpatialSource(id, x, y, z)` creates a PannerNode keyed by id.
 *   Call from RAF at ~5fps (ears can't resolve faster). Position is in
 *   Three.js world space; listener is fixed at (0,0,0) facing -Z.
 *
 * Accessibility:
 *   All SFX respect `prefers-reduced-motion`. When `reducedMotion()` is true,
 *   only essential feedback (coherence achieved) plays; all ambient SFX skip.
 *   `sfxEnabled` flag from sovereign store also gates all SFX.
 *
 * Background suspension:
 *   Call `suspend()` / `resume()` when the page goes hidden/visible.
 *   Handled automatically if `initVisibilityGate()` is called at startup.
 */

import { audioEngine } from '@p31/shared/sovereign';

// ── Helpers ───────────────────────────────────────────────────────────────

function ctx(): AudioContext | null {
  return audioEngine.ctx;
}

function reducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Create a short-lived GainNode routed to destination.
 * Auto-disconnects when the caller's OscillatorNode fires `onended`.
 */
function makeGain(volume: number): GainNode | null {
  const c = ctx();
  if (!c || c.state !== 'running') return null;
  const g = c.createGain();
  g.gain.value = volume;
  g.connect(c.destination);
  return g;
}

function cleanup(nodes: AudioNode[]): void {
  nodes.forEach(n => { try { n.disconnect(); } catch {} });
}

// ── One-shot SFX ──────────────────────────────────────────────────────────

/**
 * Rising whoosh — overlay open.
 * Sine sweep 180 Hz → 520 Hz over 120ms with fast attack/decay.
 */
export function playOverlayOpen(masterVol: number, sfxEnabled: boolean): void {
  if (!sfxEnabled || reducedMotion()) return;
  const c = ctx(); const g = makeGain(masterVol * 0.25);
  if (!c || !g) return;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(520, c.currentTime + 0.12);
  g.gain.setValueAtTime(masterVol * 0.25, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
  osc.connect(g);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.18);
  osc.onended = () => cleanup([osc, g]);
}

/**
 * Falling tone — overlay close.
 * Sine sweep 480 Hz → 160 Hz over 100ms.
 */
export function playOverlayClose(masterVol: number, sfxEnabled: boolean): void {
  if (!sfxEnabled || reducedMotion()) return;
  const c = ctx(); const g = makeGain(masterVol * 0.2);
  if (!c || !g) return;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(480, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(160, c.currentTime + 0.1);
  g.gain.setValueAtTime(masterVol * 0.2, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  osc.connect(g);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.15);
  osc.onended = () => cleanup([osc, g]);
}

/**
 * Mechanical click — cartridge load.
 * Brief noise burst (bufferSource) with hard attack, shaped by BiquadFilter.
 */
export function playCartridgeLoad(masterVol: number, sfxEnabled: boolean): void {
  if (!sfxEnabled || reducedMotion()) return;
  const c = ctx(); const g = makeGain(masterVol * 0.35);
  if (!c || !g) return;

  // Short noise burst
  const bufLen = Math.floor(c.sampleRate * 0.04);
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);

  const src = c.createBufferSource();
  src.buffer = buf;

  const filt = c.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = 3200;
  filt.Q.value = 0.8;

  src.connect(filt);
  filt.connect(g);
  g.gain.setValueAtTime(masterVol * 0.35, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
  src.start(c.currentTime);
  src.onended = () => cleanup([src, filt, g]);
}

/**
 * Rising major third chord — coherence achieved / ship unlocked.
 * Three sine oscillators: root (220Hz), major third (277Hz), fifth (330Hz).
 * This is the only SFX that plays even when reducedMotion is true (essential feedback).
 */
export function playCoherenceAchieved(masterVol: number, sfxEnabled: boolean): void {
  if (!sfxEnabled) return;
  const c = ctx(); if (!c) return;

  const frequencies = [220, 277.18, 329.63]; // A3, C#4, E4 — A major
  const duration = 1.2;

  frequencies.forEach((freq, i) => {
    const g = makeGain(0);
    if (!g) return;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const stagger = i * 0.06; // slight arpeggiation
    g.gain.setValueAtTime(0, c.currentTime + stagger);
    g.gain.linearRampToValueAtTime(masterVol * 0.18, c.currentTime + stagger + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + stagger + duration);

    osc.connect(g);
    osc.start(c.currentTime + stagger);
    osc.stop(c.currentTime + stagger + duration);
    osc.onended = () => cleanup([osc, g]);
  });
}

/**
 * Subtle tick — relay ping / notification.
 * Short sine at 1200 Hz, 30ms.
 */
export function playPing(masterVol: number, sfxEnabled: boolean): void {
  if (!sfxEnabled || reducedMotion()) return;
  const c = ctx(); const g = makeGain(masterVol * 0.12);
  if (!c || !g) return;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 1200;
  g.gain.setValueAtTime(masterVol * 0.12, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.03);
  osc.connect(g);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.03);
  osc.onended = () => cleanup([osc, g]);
}

// ── Spatial audio ─────────────────────────────────────────────────────────

// Map of live PannerNodes by string id
const _panners = new Map<string, { panner: PannerNode; gain: GainNode; osc: OscillatorNode }>();

/**
 * Create or update a spatial audio source at a world-space position.
 * Each source is a continuous low-level sine (volume = masterVol * 0.04).
 * Update at ~5fps — not every render frame.
 *
 * Call `removeSpatialSource(id)` to clean up.
 */
export function updateSpatialSource(
  id: string,
  x: number, y: number, z: number,
  masterVol: number,
  sfxEnabled: boolean,
): void {
  if (!sfxEnabled || reducedMotion()) return;
  const c = ctx();
  if (!c || c.state !== 'running') return;

  const existing = _panners.get(id);
  if (existing) {
    existing.panner.positionX.setValueAtTime(x, c.currentTime);
    existing.panner.positionY.setValueAtTime(y, c.currentTime);
    existing.panner.positionZ.setValueAtTime(z, c.currentTime);
    existing.gain.gain.setValueAtTime(masterVol * 0.04, c.currentTime);
    return;
  }

  // Create new spatial source
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 80 + Math.random() * 40; // 80–120 Hz per node

  const gain = c.createGain();
  gain.gain.value = masterVol * 0.04;

  const panner = c.createPanner();
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.refDistance = 1;
  panner.maxDistance = 20;
  panner.rolloffFactor = 1;
  panner.positionX.value = x;
  panner.positionY.value = y;
  panner.positionZ.value = z;

  osc.connect(gain);
  gain.connect(panner);
  panner.connect(c.destination);
  osc.start();

  _panners.set(id, { panner, gain, osc });
}

export function removeSpatialSource(id: string): void {
  const existing = _panners.get(id);
  if (!existing) return;
  existing.osc.stop();
  cleanup([existing.osc, existing.gain, existing.panner]);
  _panners.delete(id);
}

export function removeAllSpatialSources(): void {
  for (const id of _panners.keys()) removeSpatialSource(id);
}

// ── Ambient Drone (WCD-21) ────────────────────────────────────────────────
//
// Three-oscillator stack anchored to P-31 NMR frequencies:
//   172.35 Hz  — canonical resonance of ³¹P in Earth's magnetic field
//    86.18 Hz  — subharmonic octave below (saw for harmonic richness)
//   344.70 Hz  — overtone octave above (sine for shimmer)
//
// A shared BiquadFilter sweeps its cutoff from ~200 Hz (high entropy /
// low coherence) to ~1200 Hz (low entropy / high coherence), morphing
// the texture from dark/muffled to open/clear.
//
// Master gain: 0.04–0.10 — ambient background, never dominates SFX.

let _droneOscs: OscillatorNode[] = [];
let _droneFilter: BiquadFilterNode | null = null;
let _droneGain: GainNode | null = null;
let _droneMaster: GainNode | null = null;
let _droneRunning = false;

const DRONE_FREQS: Array<{ freq: number; type: OscillatorType; level: number }> = [
  { freq: 172.35, type: 'sine', level: 0.6 },   // fundamental — P-31 NMR
  { freq: 86.18,  type: 'sawtooth', level: 0.3 }, // subharmonic — harmonic density
  { freq: 344.70, type: 'sine', level: 0.25 },   // overtone — shimmer
];

/**
 * Start the ambient drone. Call once after first user gesture.
 * No-op if already running or SFX is disabled.
 */
export function startDrone(masterVol: number, sfxEnabled: boolean): void {
  if (_droneRunning || !sfxEnabled || reducedMotion()) return;
  const c = ctx();
  if (!c || c.state !== 'running') return;

  // Master fade-in gain (separate so updateDrone doesn't fight fade)
  _droneMaster = c.createGain();
  _droneMaster.gain.setValueAtTime(0, c.currentTime);
  _droneMaster.gain.linearRampToValueAtTime(masterVol * 0.06, c.currentTime + 4.0);
  _droneMaster.connect(c.destination);

  // Shared low-pass filter
  _droneFilter = c.createBiquadFilter();
  _droneFilter.type = 'lowpass';
  _droneFilter.frequency.value = 400; // will be updated by updateDrone
  _droneFilter.Q.value = 1.2;
  _droneFilter.connect(_droneMaster);

  // Per-oscillator mix gain, then into filter
  _droneGain = c.createGain();
  _droneGain.gain.value = 1.0;
  _droneGain.connect(_droneFilter);

  _droneOscs = DRONE_FREQS.map(({ freq, type, level }) => {
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.value = level;
    osc.connect(g);
    g.connect(_droneGain!);
    osc.start();
    return osc;
  });

  _droneRunning = true;
}

/**
 * Update drone parameters driven by coherence (0–1).
 * Call from a React effect watching `coherence` at ~1 Hz cadence.
 */
export function updateDrone(coherence: number, masterVol: number, sfxEnabled: boolean): void {
  if (!_droneRunning || !_droneFilter || !_droneMaster) return;
  const c = ctx();
  if (!c) return;

  // Filter cutoff: 200 Hz at coherence=0, 1200 Hz at coherence=1
  const cutoff = 200 + coherence * 1000;
  _droneFilter.frequency.linearRampToValueAtTime(cutoff, c.currentTime + 1.0);

  // Master gain: quieter when unfocused
  const targetGain = sfxEnabled ? masterVol * (0.04 + coherence * 0.06) : 0;
  _droneMaster.gain.linearRampToValueAtTime(targetGain, c.currentTime + 1.0);
}

/**
 * Fade out and stop the ambient drone. Call on component unmount.
 */
export function stopDrone(): void {
  if (!_droneRunning) return;
  const c = ctx();
  if (c && _droneMaster) {
    _droneMaster.gain.linearRampToValueAtTime(0, c.currentTime + 1.5);
  }
  setTimeout(() => {
    _droneOscs.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch {} });
    [_droneFilter, _droneGain, _droneMaster].forEach(n => { try { n?.disconnect(); } catch {} });
    _droneOscs = [];
    _droneFilter = null;
    _droneGain = null;
    _droneMaster = null;
    _droneRunning = false;
  }, 1600);
}

// ── Room → Spatial Position Map (WCD-21) ─────────────────────────────────
// Listener at (0,0,0) facing −Z. Positions give approximate compass-rose
// spatial placement matching the visual room layout.

const ROOM_POSITIONS: Record<string, [number, number, number]> = {
  OBSERVATORY: [0,  0, -1],
  COPILOT:     [0,  3, -1],   // top / brain — above
  COLLIDER:    [2,  1, -1],   // top-right — particles go right
  BONDING:     [2, -1, -1],   // bottom-right
  BRIDGE:      [-2, 0, -1],   // left — LOVE economy
  BUFFER:      [-1, 1, -1],   // top-left
  LANDING:     [0, -3, -1],   // bottom — IDE, below
  RESONANCE:   [3,  0, -1],   // far right — music
  FORGE:       [-2,-1, -1],   // bottom-left — publishing
};

/**
 * Spatial overlay-open whoosh: a rising sine sweep played through a PannerNode
 * positioned at the room's compass direction. Replaces the flat `playOverlayOpen`
 * when a room identity is known.
 */
export function playOverlayOpenSpatial(
  overlayId: string,
  masterVol: number,
  sfxEnabled: boolean,
): void {
  if (!sfxEnabled || reducedMotion()) return;
  const c = ctx();
  if (!c || c.state !== 'running') return;

  const [px, py, pz] = ROOM_POSITIONS[overlayId] ?? [0, 0, -1];

  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(520, c.currentTime + 0.14);

  const g = c.createGain();
  g.gain.setValueAtTime(masterVol * 0.3, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);

  const panner = c.createPanner();
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.refDistance = 1;
  panner.maxDistance = 10;
  panner.rolloffFactor = 0.6;
  panner.positionX.value = px;
  panner.positionY.value = py;
  panner.positionZ.value = pz;

  osc.connect(g);
  g.connect(panner);
  panner.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.22);
  osc.onended = () => cleanup([osc, g, panner]);
}

/**
 * Resonance lock chord — rising multi-oscillator chord anchored to 172.35 Hz.
 * Each oscillator glides up from a half-step below pitch for a "locking in" feel.
 * Root (172.35) · Fifth (258.5) · Octave (344.7).
 */
export function playResonanceLock(masterVol: number, sfxEnabled: boolean): void {
  if (!sfxEnabled) return;
  const c = ctx();
  if (!c) return;

  const BASE = 172.35;
  const chordFreqs = [BASE, BASE * 1.5, BASE * 2]; // root, fifth, octave
  const duration = 1.8;
  const glideFrom = (f: number) => f * Math.pow(2, -1 / 12); // one semitone below

  chordFreqs.forEach((freq, i) => {
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.connect(c.destination);

    const osc = c.createOscillator();
    osc.type = 'sine';
    // Glide up from one semitone below to target pitch
    osc.frequency.setValueAtTime(glideFrom(freq), c.currentTime + i * 0.07);
    osc.frequency.exponentialRampToValueAtTime(freq, c.currentTime + i * 0.07 + 0.15);

    // ADSR: attack 80ms, sustain, decay to zero
    g.gain.linearRampToValueAtTime(masterVol * 0.20, c.currentTime + i * 0.07 + 0.08);
    g.gain.setValueAtTime(masterVol * 0.20, c.currentTime + i * 0.07 + duration * 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.07 + duration);

    osc.connect(g);
    osc.start(c.currentTime + i * 0.07);
    osc.stop(c.currentTime + i * 0.07 + duration);
    osc.onended = () => cleanup([osc, g]);
  });
}

/**
 * Missing Node pulse — 172.35 Hz sine for the specified duration.
 * Triggered by the ghost signal in ColliderRoom. Not gated by
 * reducedMotion since it is an explicit user-triggered one-shot.
 */
export function playMissingNodePulse(durationMs: number): void {
  const c = ctx();
  if (!c) return;
  if (c.state === 'suspended') { c.resume().catch(() => {}); }
  const dur = durationMs / 1000;
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(0.18, c.currentTime + 0.15);
  g.gain.setValueAtTime(0.18, c.currentTime + Math.max(0, dur - 0.3));
  g.gain.linearRampToValueAtTime(0, c.currentTime + dur);
  g.connect(c.destination);
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 172.35;
  osc.connect(g);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + dur);
  osc.onended = () => cleanup([osc, g]);
}

// ── Background suspension ─────────────────────────────────────────────────

/** Call once at app init. Suspends AudioContext when tab is hidden. */
export function initVisibilityGate(): () => void {
  const handleVisibility = () => {
    const c = ctx();
    if (!c) return;
    if (document.hidden) {
      c.suspend().catch(() => {});
    } else {
      c.resume().catch(() => {});
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}
