// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Sound engine: Web Audio API oscillators
//
// Element frequencies (P31 canonical):
//   H=523Hz(C5), C=262Hz(C4), O=330Hz(E4),
//   Na=196Hz(G3), P=172Hz(F3), Ca=147Hz(D3)
//
// Larmor frequency: 863Hz (P31 canonical)
// ═══════════════════════════════════════════════════════

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor = window.AudioContext
      || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a single atom note — triangle wave with soft attack/decay.
 * Called when an atom is placed without a bond partner.
 */
export function playAtomNote(frequency: number): void {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency, now);
  osc.detune.setValueAtTime(2, now); // Subtle warmth

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.7);
}

/**
 * Play a two-note interval — staggered sine + triangle.
 * Called when a bond forms between two atoms.
 */
export function playBondInterval(freq1: number, freq2: number): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  const playNote = (freq: number, startTime: number, type: OscillatorType) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 1.1);
  };

  playNote(freq1, now, 'sine');
  playNote(freq2, now + 0.05, 'triangle');
}

/**
 * Play the full molecule completion chord.
 * Unique per molecule: arpeggio (notes staggered 50ms apart, low→high),
 * then all notes sustained together, finished with Larmor 863Hz.
 * H₂ = two high notes. CaO = low+mid. Every molecule sounds different.
 */
export function playCompletionChord(frequencies: number[]): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Sort low→high for ascending arpeggio
  const freqs = [...frequencies].sort((a, b) => a - b);

  // Phase 1: Arpeggio — each note 50ms apart
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + i * 0.05;
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
    gain.gain.linearRampToValueAtTime(0.1, start + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.8);
  });

  // Phase 2: Sustain chord — all notes together after arpeggio
  const chordStart = now + freqs.length * 0.05 + 0.1;
  freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, chordStart);
    gain.gain.linearRampToValueAtTime(0, chordStart + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(chordStart);
    osc.stop(chordStart + 1.2);
  });

  // Phase 3: Larmor 863Hz fade-in — P31 signature
  const larmorStart = chordStart + 0.4;
  const larmorOsc = ctx.createOscillator();
  const larmorGain = ctx.createGain();
  larmorOsc.frequency.setValueAtTime(863, larmorStart);
  larmorGain.gain.setValueAtTime(0, larmorStart);
  larmorGain.gain.linearRampToValueAtTime(0.08, larmorStart + 0.8);
  larmorGain.gain.exponentialRampToValueAtTime(0.0001, larmorStart + 2);
  larmorOsc.connect(larmorGain);
  larmorGain.connect(ctx.destination);
  larmorOsc.start(larmorStart);
  larmorOsc.stop(larmorStart + 2);
}

/**
 * Achievement unlock sound — ascending arpeggio.
 */
export function playAchievementUnlock(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + i * 0.08;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.15, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  });
}

/**
 * LOVE earned chime — warm bell tone.
 */
export function playLoveChime(amount: number): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Higher pitch for larger amounts
  const baseFreq = 660 + Math.min(amount, 100) * 3;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.4);
}

/**
 * Ping notification — rising chirp.
 */
export function playPing(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

/**
 * Emoji-specific ping sounds.
 * 💚 = warm rising tone, 🤔 = wobble, 😂 = quick trill, 🔺 = alert ping
 */
export function playPingEmoji(reaction: string): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  if (reaction === '\u{1F49A}') {
    // 💚 Green heart — warm rising sine
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.2);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (reaction === '\u{1F914}') {
    // 🤔 Thinking — frequency wobble
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.setValueAtTime(380, now + 0.1);
    osc.frequency.setValueAtTime(330, now + 0.2);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (reaction === '\u{1F602}') {
    // 😂 Laugh — quick ascending trill
    [0, 0.06, 0.12].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 600 + i * 200;
      gain.gain.setValueAtTime(0.1, now + t);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.08);
    });
  } else if (reaction === '\u{1F53A}') {
    // 🔺 Alert — sharp high ping
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } else {
    playPing();
  }
}

/**
 * Quest step advanced — gentle ascending chime.
 */
export function playQuestStep(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const notes = [523, 659]; // C5, E5

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + i * 0.1;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}

/**
 * Quest completed — triumphant ascending arpeggio with sustain.
 */
export function playQuestComplete(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const notes = [523, 659, 784, 1047, 1319]; // C5, E5, G5, C6, E6

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + i * 0.1;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.15, start + 0.04);
    gain.gain.setValueAtTime(0.15, start + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.8);
  });
}

/**
 * Mode select — soft confirmation tone.
 */
export function playModeSelect(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(528, now);
  osc.frequency.exponentialRampToValueAtTime(792, now + 0.15);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

/**
 * Reject buzz — low sawtooth blip.
 */
export function playReject(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, now);

  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}

/**
 * Palette selection blip — barely audible sine tap.
 */
export function playSelectBlip(frequency: number): void {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}

/**
 * Drag cancel whoosh — filtered noise burst.
 */
export function playWhoosh(): void {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * 0.1);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
}

// Additional exports for compatibility
export function initAudio(): void {
  getCtx();
}

// @ts-ignore
export function playEmberToggle(lit: boolean): void {
  playModeSelect();
}

export function isMuted(): boolean {
  return false;
}

// @ts-ignore
export function setMuted(muted: boolean): void {
  // No-op for now, could be implemented with a global gain node
}

export function playMissingNodeTone(): void {
  // 172.35 Hz — the P31 phosphorus NMR frequency
  // The Missing Node plays its own frequency, not the reject buzz
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const soundDuration = 0.8; // matches MISSING_NODE.soundDuration

  osc.type = 'sine';
  osc.frequency.setValueAtTime(172.35, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
  gain.gain.linearRampToValueAtTime(0.1, now + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + soundDuration);
}

export function playWarp(): void {
  playWhoosh();
}
