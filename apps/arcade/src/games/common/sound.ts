export const P31_F = { root: 172.35, third: 217.83, fifth: 258.65, octave: 344.70, harmonic: 517.05, goal: 863 };

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playNote(freq: number, duration = 0.15, vol = 0.08, type: OscillatorType = 'sine') {
  try {
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(); osc.stop(c.currentTime + duration);
  } catch {}
}

export function playChord(freqs: number[], duration = 0.5, vol = 0.06) {
  for (const f of freqs) playNote(f, duration, vol);
}

export function playPad(freq: number, duration = 3, vol = 0.04) {
  try {
    const c = ctx();
    const osc = c.createOscillator();
    const osc2 = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine'; osc2.type = 'sine';
    osc.frequency.value = freq;
    osc2.frequency.value = freq * 1.005;
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(vol, c.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(vol * 0.7, c.currentTime + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain); osc2.connect(gain); gain.connect(c.destination);
    osc.start(); osc2.start();
    osc.stop(c.currentTime + duration); osc2.stop(c.currentTime + duration);
  } catch {}
}

export function playRiser(start = 200, end = 600, dur = 0.8) {
  try {
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(start, c.currentTime);
    osc.frequency.linearRampToValueAtTime(end, c.currentTime + dur);
    gain.gain.setValueAtTime(0.05, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur + 0.1);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(); osc.stop(c.currentTime + dur + 0.1);
  } catch {}
}
