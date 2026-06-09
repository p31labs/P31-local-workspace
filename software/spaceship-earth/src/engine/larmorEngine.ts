/**
 * @file larmorEngine.ts — Larmor Frequency Audio Engine
 * 
 * Generates binaural/monaural oscillations at exactly 172.35 Hz and 863 Hz
 * to provide somatic grounding through the auditory/vestibular system.
 * 
 * Section 2.2: Larmor Frequency Hardware Synchronization
 * Biological correspondence: Phosphorus-31 nucleus resonance
 * 
 * CWP-JITTERBUG-14: Larmor Stimulator
 */
export const LARMOR_FREQUENCIES = {
  PRIMARY: 172.35,    // Phosphorus-31 nucleus resonance
  SECONDARY: 863.0,   // ³¹P in Earth's magnetic field (harmonic)
} as const;

export type LarmorFrequency = typeof LARMOR_FREQUENCIES[keyof typeof LARMOR_FREQUENCIES];

export interface LarmorEngineConfig {
  primaryFreq?: number;
  secondaryFreq?: number;
  gain?: number;          // 0-1, default 0.1
  primaryWave?: OscillatorType;
  secondaryWave?: OscillatorType;
}

export class LarmorEngine {
  private audioCtx: AudioContext | null = null;
  private primaryOsc: OscillatorNode | null = null;
  private secondaryOsc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  
  private config: Required<LarmorEngineConfig>;
  private isPlaying: boolean = false;

  constructor(config: LarmorEngineConfig = {}) {
    this.config = {
      primaryFreq: config.primaryFreq ?? LARMOR_FREQUENCIES.PRIMARY,
      secondaryFreq: config.secondaryFreq ?? LARMOR_FREQUENCIES.SECONDARY,
      gain: config.gain ?? 0.1,
      primaryWave: config.primaryWave ?? 'sine',
      secondaryWave: config.secondaryWave ?? 'triangle',
    };
  }

  /**
   * Initialize and start the Larmor resonance
   * Uses Web Audio API to generate precise frequencies
   */
  public start(): void {
    if (this.isPlaying) return;

    // Create AudioContext (handles Safari webkit prefix)
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // Master gain node for volume control
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(this.config.gain, this.audioCtx.currentTime);
    this.gainNode.connect(this.audioCtx.destination);

    // LFO for subtle amplitude modulation (breathing effect)
    this.lfoNode = this.audioCtx.createOscillator();
    this.lfoNode.type = 'sine';
    this.lfoNode.frequency.setValueAtTime(0.1, this.audioCtx.currentTime); // 0.1 Hz = coherent breathing
    
    this.lfoGain = this.audioCtx.createGain();
    this.lfoGain.gain.setValueAtTime(0.02, this.audioCtx.currentTime); // Subtle 2% modulation
    
    this.lfoNode.connect(this.lfoGain);
    this.lfoGain.connect(this.gainNode.gain);
    this.lfoNode.start();

    // Primary Oscillator (172.35 Hz) — Phosphorus-31 resonance
    this.primaryOsc = this.audioCtx.createOscillator();
    this.primaryOsc.type = this.config.primaryWave;
    this.primaryOsc.frequency.setValueAtTime(this.config.primaryFreq, this.audioCtx.currentTime);
    this.primaryOsc.connect(this.gainNode);
    this.primaryOsc.start();

    // Secondary Oscillator (863 Hz) — Harmonic
    this.secondaryOsc = this.audioCtx.createOscillator();
    this.secondaryOsc.type = this.config.secondaryWave;
    this.secondaryOsc.frequency.setValueAtTime(this.config.secondaryFreq, this.audioCtx.currentTime);
    this.secondaryOsc.connect(this.gainNode);
    this.secondaryOsc.start();

    this.isPlaying = true;
    console.log(`[Larmor] Started: ${this.config.primaryFreq}Hz + ${this.config.secondaryFreq}Hz`);
  }

  /**
   * Stop all oscillators and close AudioContext
   */
  public stop(): void {
    if (!this.isPlaying) return;

    this.primaryOsc?.stop();
    this.secondaryOsc?.stop();
    this.lfoNode?.stop();
    
    this.primaryOsc = null;
    this.secondaryOsc = null;
    this.lfoNode = null;
    
    this.audioCtx?.close();
    this.audioCtx = null;
    this.gainNode = null;
    this.lfoGain = null;

    this.isPlaying = false;
    console.log('[Larmor] Stopped');
  }

  /**
   * Adjust master gain in real-time
   */
  public setGain(value: number): void {
    const clamped = Math.max(0, Math.min(1, value));
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setTargetAtTime(clamped, this.audioCtx.currentTime, 0.1);
    }
  }

  /**
   * Adjust primary frequency in real-time
   */
  public setPrimaryFreq(freq: number): void {
    if (this.primaryOsc && this.audioCtx) {
      this.primaryOsc.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.1);
    }
  }

  /**
   * Adjust secondary frequency in real-time
   */
  public setSecondaryFreq(freq: number): void {
    if (this.secondaryOsc && this.audioCtx) {
      this.secondaryOsc.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.1);
    }
  }

  /**
   * Check if engine is currently playing
   */
  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current frequencies for display
   */
  public getFrequencies(): { primary: number; secondary: number } {
    return {
      primary: this.config.primaryFreq,
      secondary: this.config.secondaryFreq,
    };
  }
}

// Singleton instance for global access
let larmorInstance: LarmorEngine | null = null;

export function getLarmorEngine(config?: LarmorEngineConfig): LarmorEngine {
  if (!larmorInstance) {
    larmorInstance = new LarmorEngine(config);
  }
  return larmorInstance;
}

export function startLarmor(config?: LarmorEngineConfig): void {
  getLarmorEngine(config).start();
}

export function stopLarmor(): void {
  larmorInstance?.stop();
}

export function toggleLarmor(config?: LarmorEngineConfig): boolean {
  const engine = getLarmorEngine(config);
  if (engine.getIsPlaying()) {
    engine.stop();
    return false;
  } else {
    engine.start();
    return true;
  }
}