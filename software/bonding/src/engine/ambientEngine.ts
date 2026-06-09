// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Ambient Engine: Procedural background music
//
// Generates continuous ambient soundscapes based on the current
// molecule composition. Uses the molecule's harmonic properties
// to create evolving soundscapes.
// ═══════════════════════════════════════════════════════

import { getAmbientLoop, type AmbientLoop } from './soundtrack';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;
let currentLoop: AmbientLoop | null = null;
let nextNoteTime = 0;
let animationFrameId: number | null = null;

// Get or create audio context
function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor = window.AudioContext
      || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctor();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.15; // Subtle ambient volume
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Initialize the ambient engine. Must be called on user interaction.
 */
export function initAmbient(): void {
  if (isPlaying) return;
  getCtx();
  isPlaying = true;
  nextNoteTime = audioCtx!.currentTime;
  scheduleLoop();
}

/**
 * Stop the ambient engine.
 */
export function stopAmbient(): void {
  isPlaying = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * Update the ambient soundscape based on current molecule elements.
 * Call this when the molecule changes.
 */
export function updateAmbient(elements: string[]): void {
  if (!isPlaying || elements.length === 0) {
    stopAmbient();
    return;
  }

  // Generate new ambient loop from molecule composition
  const newLoop = getAmbientLoop(elements, 45); // Slower BPM for ambient

  // Only update if the molecule composition changed significantly
  if (!currentLoop || JSON.stringify(currentLoop.notes) !== JSON.stringify(newLoop.notes)) {
    currentLoop = newLoop;
  }
}

/**
 * Set ambient volume (0-1)
 */
export function setAmbientVolume(volume: number): void {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, volume)) * 0.3;
  }
}

/**
 * Main scheduling loop - schedules notes ahead of time
 */
function scheduleLoop(): void {
  if (!isPlaying || !audioCtx || !masterGain) return;

  const ctx = audioCtx;
  const lookahead = 0.1; // Schedule 100ms ahead
  const scheduleInterval = 25; // Check every 25ms

  while (nextNoteTime < ctx.currentTime + lookahead) {
    if (currentLoop) {
      scheduleAmbientNote(currentLoop, nextNoteTime);
    }
    // Advance time by one loop cycle
    nextNoteTime += currentLoop?.loopDuration ? currentLoop.loopDuration / 1000 : 4;
  }

  animationFrameId = window.setTimeout(() => scheduleLoop(), scheduleInterval);
}

/**
 * Schedule a single ambient note from the loop
 */
function scheduleAmbientNote(loop: AmbientLoop, time: number): void {
  if (!audioCtx || !masterGain) return;

  const ctx = audioCtx;

  loop.notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Warm, filtered sound
    osc.type = 'sine';
    osc.frequency.value = note.frequency;

    // Low-pass filter for warmth
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;

    // Soft attack, long sustain, slow release
    const noteStart = time + (note.startTime / 1000);
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(note.gain, noteStart + 0.3);
    gain.gain.setValueAtTime(note.gain, noteStart + (note.duration / 1000) * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + (note.duration / 1000));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain!);

    osc.start(noteStart);
    osc.stop(noteStart + (note.duration / 1000) + 0.5);
  });
}

// Note: setTimeout already exists in browser environments
// The scheduling uses requestAnimationFrame pattern via setTimeout
