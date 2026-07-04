import { useCallback, useRef } from 'react';

const NOTE_FREQ: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
};

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

export default function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const playNote = useCallback((noteOrFreq: string | number, type: OscillatorType = 'sine', duration = 0.1) => {
    const ctx = ctxRef.current ?? getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const freq = typeof noteOrFreq === 'string' ? NOTE_FREQ[noteOrFreq] ?? 440 : noteOrFreq;
    if (!Number.isFinite(freq) || freq <= 0) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }, []);

  return { playNote };
}
