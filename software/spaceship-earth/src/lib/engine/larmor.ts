/**
 * @file larmor.ts — Larmor Audio Engine (LarmorShift)
 * 
 * Hardened with:
 * - AudioContext resume error handling (user gesture required)
 * - Browser autoplay policy compliance
 * - Frequency bounds (20-20000 Hz)
 * - Volume limiter (max gain 0.1)
 * - Proper cleanup on stop()
 * - Web Audio API support detection
 */

const PRIMARY_FREQ = 172.35;
const SECONDARY_FREQ = 863.0;
const MAX_GAIN = 0.1;
const MIN_FREQ = 20;
const MAX_FREQ = 20000;

export interface LarmorStatus {
  isRunning: boolean;
  contextState: AudioContextState | 'unsupported';
}

export class LarmorEngine {
  private audioCtx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isRunningFlag: boolean = false;

  constructor() {}

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 
           (window.AudioContext || (window as any).webkitAudioContext) !== undefined;
  }

  public getStatus(): LarmorStatus {
    if (!LarmorEngine.isSupported()) {
      return { isRunning: false, contextState: 'unsupported' };
    }
    return {
      isRunning: this.isRunningFlag,
      contextState: this.audioCtx ? this.audioCtx.state : 'closed',
    };
  }

  private validateFrequency(freq: number): number {
    if (isNaN(freq)) return MIN_FREQ;
    return Math.min(MAX_FREQ, Math.max(MIN_FREQ, freq));
  }

  public async start(): Promise<boolean> {
    if (!LarmorEngine.isSupported()) {
      console.warn('[Larmor] Web Audio API not supported');
      return false;
    }

    await this.stop();

    try {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtor();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = MAX_GAIN;
      this.gainNode.connect(this.audioCtx.destination);

      this.osc1 = this.audioCtx.createOscillator();
      this.osc2 = this.audioCtx.createOscillator();

      this.osc1.type = 'sine';
      this.osc2.type = 'sine';

      const freq1 = this.validateFrequency(PRIMARY_FREQ);
      const freq2 = this.validateFrequency(SECONDARY_FREQ);
      this.osc1.frequency.value = freq1;
      this.osc2.frequency.value = freq2;

      this.osc1.connect(this.gainNode);
      this.osc2.connect(this.gainNode);

      this.osc1.start();
      this.osc2.start();

      await this.audioCtx.resume();

      if (this.audioCtx.state !== 'running') {
        console.warn('[Larmor] AudioContext not running after resume attempt');
        await this.stop();
        return false;
      }

      this.isRunningFlag = true;
      return true;
    } catch (err) {
      console.error('[Larmor] Failed to start:', err);
      await this.stop();
      return false;
    }
  }

  public async stop(): Promise<void> {
    this.isRunningFlag = false;

    if (this.osc1) {
      try { this.osc1.stop(); } catch (e) {}
      this.osc1.disconnect();
      this.osc1 = null;
    }
    if (this.osc2) {
      try { this.osc2.stop(); } catch (e) {}
      this.osc2.disconnect();
      this.osc2 = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.audioCtx) {
      await this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  public setVolume(gain: number): void {
    if (!this.gainNode) return;
    let safeGain = Math.min(MAX_GAIN, Math.max(0, gain));
    this.gainNode.gain.value = safeGain;
  }

  public getVolume(): number {
    return this.gainNode ? this.gainNode.gain.value : 0;
  }

  public getIsPlaying(): boolean {
    return this.isRunningFlag;
  }

  public getFrequencies(): { primary: number; secondary: number } {
    return {
      primary: PRIMARY_FREQ,
      secondary: SECONDARY_FREQ,
    };
  }
}

let instance: LarmorEngine | null = null;

export function getLarmorEngine(): LarmorEngine {
  if (!instance) {
    instance = new LarmorEngine();
  }
  return instance;
}

export const start = () => getLarmorEngine().start();
export const stop = () => getLarmorEngine().stop();
export const isSupported = () => LarmorEngine.isSupported();
export const getStatus = () => getLarmorEngine().getStatus();