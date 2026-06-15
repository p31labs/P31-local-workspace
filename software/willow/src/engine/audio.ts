let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq: number, type: OscillatorType, dur: number, slideTo?: number, vol = 0.08): void {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  } catch { /* restricted context */ }
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export const sfx = {
  stamp:    () => tone(300, 'square', 0.1, 150),
  pop:      () => tone(800, 'sine', 0.08),
  bubblePop:() => tone(1200, 'sine', 0.1, 1600),
  miss:     () => tone(180, 'sawtooth', 0.25, 90),
  flip:     () => tone(500, 'triangle', 0.08),
  catch:    () => tone(900, 'sine', 0.08, 1100),
  win: async () => {
    tone(400, 'sine', 0.12);
    await wait(100);
    tone(600, 'sine', 0.12);
    await wait(100);
    tone(863, 'sine', 0.25);
  },
};

export function speak(text: string): void {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.pitch = 1.1;
  u.volume = 1;
  window.speechSynthesis.speak(u);
}

export function initAudio(): void {
  getCtx();
  const unlock = () => { getCtx(); };
  window.addEventListener('touchstart', unlock, { once: true });
  window.addEventListener('click', unlock, { once: true });
}
