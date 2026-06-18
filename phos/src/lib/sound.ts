let ctx: AudioContext | null = null;
let _muted = false;

const LARMOR_HZ = 863;

const FREQ = {
  hydrogen: Math.round(LARMOR_HZ * 2.997),
  carbon:   Math.round(LARMOR_HZ * 0.749),
  oxygen:   Math.round(LARMOR_HZ * 1.253),
  phosphor: LARMOR_HZ,
  calcium:  Math.round(LARMOR_HZ * 0.489),
  sodium:   Math.round(LARMOR_HZ * 0.552),
};

const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

function reducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ensureCtx(): AudioContext | null {
  if (_muted || reducedMotion()) return null;
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

type SpoonProfile = {
  oscType: OscillatorType;
  volume: number;
  attack: number;
  decay: number;
};

function spoonProfile(spoons: number): SpoonProfile {
  if (spoons <= 2) return { oscType: 'sine', volume: 0.3, attack: 0.1, decay: 1.5 };
  if (spoons === 3) return { oscType: 'triangle', volume: 0.5, attack: 0.05, decay: 0.8 };
  return { oscType: 'sine', volume: 0.7, attack: 0.01, decay: 0.3 };
}

function playTone(
  freq: number,
  spoons: number,
  overrides?: { oscType?: OscillatorType; volume?: number; attack?: number; decay?: number; ramp?: 'linear' | 'exp' },
): void {
  const ac = ensureCtx();
  if (!ac) return;
  const p = spoonProfile(spoons);
  const oscType = overrides?.oscType ?? p.oscType;
  const volume = overrides?.volume ?? p.volume;
  const attack = overrides?.attack ?? p.attack;
  const decay = overrides?.decay ?? p.decay;
  const ramp = overrides?.ramp ?? 'linear';
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = oscType;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  if (ramp === 'linear') {
    gain.gain.linearRampToValueAtTime(volume, t + attack);
  } else {
    gain.gain.setValueAtTime(volume, t + attack);
  }
  gain.gain.exponentialRampToValueAtTime(0.001, t + decay);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + decay + 0.1);
}

export function initAudio(): void {
  if (ctx) return;
  ctx = new AudioContext();
}

export function isMuted(): boolean {
  return _muted;
}

export function setMuted(v: boolean): void {
  _muted = v;
  try {
    localStorage.setItem('phos_muted', String(v));
  } catch { /* ignore */ }
  if (v && ctx) {
    ctx.suspend();
  } else if (!v && ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}

export function getFrequencies(): typeof FREQ {
  return { ...FREQ };
}

export function tapOrb(spoons: number = 5): void {
  playTone(FREQ.hydrogen, spoons, { decay: 0.3, volume: spoonProfile(spoons).volume * 0.4 });
}

export function changeSurface(spoons: number = 5): void {
  const ac = ensureCtx();
  if (!ac) return;
  const p = spoonProfile(spoons);
  const t = ac.currentTime;

  const bufferSize = ac.sampleRate * 0.4;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;

  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(200, t);
  filter.frequency.linearRampToValueAtTime(600, t + 0.3);
  filter.Q.setValueAtTime(1.5, t);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(p.volume * 0.15, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  source.start(t);
  source.stop(t + 0.45);
}

export function changeSpoons(level: number): void {
  const freq = PENTATONIC[Math.max(0, Math.min(5, level))];
  const p = spoonProfile(level);
  playTone(freq, level, {
    oscType: level <= 2 ? 'sine' : level === 3 ? 'triangle' : 'sine',
    decay: p.decay,
    volume: p.volume * 0.35,
  });
}

export function grayRockOn(): void {
  const ac = ensureCtx();
  if (!ac) return;
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(FREQ.carbon, t);
  osc.frequency.linearRampToValueAtTime(FREQ.carbon * 0.5, t + 1.5);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 1.6);
}

export function grayRockOff(): void {
  const ac = ensureCtx();
  if (!ac) return;
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(FREQ.oxygen * 0.7, t);
  osc.frequency.linearRampToValueAtTime(FREQ.oxygen, t + 1.2);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 1.3);
}

export function breatheIn(spoons: number = 1): void {
  const p = spoonProfile(spoons);
  const ac = ensureCtx();
  if (!ac) return;
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(FREQ.calcium, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(p.volume * 0.25, t + 3.0);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 3.1);
}

export function breatheOut(spoons: number = 1): void {
  const p = spoonProfile(spoons);
  const ac = ensureCtx();
  if (!ac) return;
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(FREQ.sodium, t);
  gain.gain.setValueAtTime(p.volume * 0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 3.0);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 3.1);
}

export function achievement(spoons: number = 5): void {
  const p = spoonProfile(spoons);
  const ac = ensureCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t + i * 0.12);
    gain.gain.setValueAtTime(0, t + i * 0.12);
    gain.gain.linearRampToValueAtTime(p.volume * 0.3, t + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.4);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t + i * 0.12);
    osc.stop(t + i * 0.12 + 0.5);
  });
}

export function error(spoons: number = 3): void {
  const p = spoonProfile(spoons);
  const ac = ensureCtx();
  if (!ac) return;
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(FREQ.phosphor / 4, t);
  gain.gain.setValueAtTime(p.volume * 0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.15);
}

export function surfaceTone(surface: string, spoons: number = 5): void {
  const SURFACE_FREQ: Record<string, number> = {
    GREETING:      FREQ.hydrogen,
    IGNITION:      FREQ.oxygen,
    BONDING:       FREQ.hydrogen,
    THE_BUFFER:    FREQ.sodium,
    NODE_ZERO:     FREQ.phosphor,
    ARCADE:        FREQ.hydrogen,
    VAULT:         FREQ.calcium,
    GRID:          FREQ.oxygen,
    COMPASS:       FREQ.phosphor,
    SETTINGS:      FREQ.sodium,
    LEDGER:        FREQ.calcium,
    LOVE:          FREQ.oxygen,
    ARCHIVE:       FREQ.sodium,
    HEARTH:        FREQ.oxygen,
    SANCTUARY:     FREQ.calcium,
    FORGE:         FREQ.phosphor,
    DRIVE:         FREQ.hydrogen,
    LEGAL:         FREQ.calcium,
    CHAOS_INGEST:  FREQ.sodium,
    RETRO_VAULT:   FREQ.calcium,
    WAREHOUSE:     FREQ.sodium,
    CONSTELLATION: FREQ.phosphor,
  };
  const freq = SURFACE_FREQ[surface] ?? FREQ.phosphor;
  playTone(freq, spoons);
}

export function getSurfaceFrequencies(): Record<string, number> {
  return {
    GREETING:      FREQ.hydrogen,
    IGNITION:      FREQ.oxygen,
    BONDING:       FREQ.hydrogen,
    THE_BUFFER:    FREQ.sodium,
    NODE_ZERO:     FREQ.phosphor,
    ARCADE:        FREQ.hydrogen,
    VAULT:         FREQ.calcium,
    GRID:          FREQ.oxygen,
    COMPASS:       FREQ.phosphor,
    SETTINGS:      FREQ.sodium,
    LEDGER:        FREQ.calcium,
    LOVE:          FREQ.oxygen,
    ARCHIVE:       FREQ.sodium,
    HEARTH:        FREQ.oxygen,
    SANCTUARY:     FREQ.calcium,
    FORGE:         FREQ.phosphor,
    DRIVE:         FREQ.hydrogen,
    LEGAL:         FREQ.calcium,
    CHAOS_INGEST:  FREQ.sodium,
    RETRO_VAULT:   FREQ.calcium,
    WAREHOUSE:     FREQ.sodium,
    CONSTELLATION: FREQ.phosphor,
  };
}

export function getPentatonic(): number[] {
  return [...PENTATONIC];
}
