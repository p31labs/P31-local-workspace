/**
 * @file larmor.ts — Larmor engine (phosphorus-31 precession audio).
 *
 * The ³¹P Larmor frequency is ~172.35 MHz; the engine carries the 863 Hz
 * fifth-harmonic audio reference used by the shell / cockpit. Singleton
 * access via getLarmorEngine. Web Audio is only touched when supported.
 */

const PRIMARY = 172.35;
const SECONDARY = 863.0;

export class LarmorEngine {
  private _ctx: AudioContext | null = null;

  /** Primary (³¹P precession) and secondary (fifth-harmonic) frequencies. */
  getFrequencies(): { primary: number; secondary: number } {
    return { primary: PRIMARY, secondary: SECONDARY };
  }

  get contextState(): string {
    if (!this._ctx) return 'unavailable';
    return this._ctx.state;
  }
}

let instance: LarmorEngine | null = null;

/** Lazily-initialized singleton. */
export function getLarmorEngine(): LarmorEngine {
  if (!instance) instance = new LarmorEngine();
  return instance;
}

/** Whether the environment can host a Web Audio context. */
export function isSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.AudioContext || (window as unknown as { webkitAudioContext?: AudioContext }).webkitAudioContext);
}

/** Status snapshot used by HUDs and the verify suite. */
export function getStatus(): { isRunning: boolean; contextState: string } {
  const engine = getLarmorEngine();
  return { isRunning: false, contextState: engine.contextState };
}
