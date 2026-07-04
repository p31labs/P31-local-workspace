// ═══════════════════════════════════════════════════════════════════════════
// WCD-26.3 & WCD-26.4: Jitterbug Spatial Hums + Coherence Audio
// P31 Labs — Spaceship Earth
//
// Pool of 6 spatial audio sources for Jitterbug nodes + coherence harmonics.
// ═══════════════════════════════════════════════════════════════════════════

import { audioEngine } from '@p31/shared/sovereign';
import * as THREE from 'three';

const MAX_SOURCES = 6; // Mobile cap

interface SpatialSource {
  id: string;
  osc: OscillatorNode;
  gain: GainNode;
  panner: PannerNode;
  position: THREE.Vector3;
  active: boolean;
}

class JitterbugAudioPoolClass {
  private sources: SpatialSource[] = [];
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private coherenceHarmonicOsc: OscillatorNode | null = null;
  private coherenceHarmonicGain: GainNode | null = null;
  private lockChimeOsc: OscillatorNode | null = null;
  private lockChimeGain: GainNode | null = null;
  private lastCoherence = 0;
  private coherenceTarget = 0.95;

  init(ctx: AudioContext, masterGain: GainNode): void {
    this.ctx = ctx;
    this.masterGain = masterGain;

    // Pre-create pool of sources
    for (let i = 0; i < MAX_SOURCES; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createPanner();

      // Configure panner for 3D audio
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 5;
      panner.maxDistance = 100;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;
      panner.coneOuterAngle = 0;
      panner.coneOuterGain = 0;

      // Configure oscillator (soft hum)
      osc.type = 'sine';
      osc.frequency.value = 110 + i * 20; // Spread frequencies

      // Start silent
      gain.gain.value = 0;

      // Connect: osc -> gain -> panner -> master
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(masterGain);

      osc.start();

      this.sources.push({
        id: `jitterbug-${i}`,
        osc,
        gain,
        panner,
        position: new THREE.Vector3(),
        active: false,
      });
    }

    // Coherence 5th harmonic — based on 172.35 Hz Larmor frequency
    // Formula: 172.35 × 3 = 517.05 Hz (3rd harmonic of Larmor)
    // This aligns with the Missing Node frequency (172.35 Hz)
    this.coherenceHarmonicOsc = ctx.createOscillator();
    this.coherenceHarmonicGain = ctx.createGain();
    this.coherenceHarmonicOsc.type = 'sine';
    this.coherenceHarmonicOsc.frequency.value = 172.35 * 3; // 517.05 Hz
    this.coherenceHarmonicGain.gain.value = 0;
    this.coherenceHarmonicOsc.connect(this.coherenceHarmonicGain);
    this.coherenceHarmonicGain.connect(masterGain);
    this.coherenceHarmonicOsc.start();

    // Lock chime oscillator
    this.lockChimeOsc = ctx.createOscillator();
    this.lockChimeGain = ctx.createGain();
    this.lockChimeOsc.type = 'sine';
    this.lockChimeOsc.frequency.value = 880; // A5
    this.lockChimeGain.gain.value = 0;
    this.lockChimeOsc.connect(this.lockChimeGain);
    this.lockChimeGain.connect(masterGain);
    this.lockChimeOsc.start();
  }

  /**
   * Update spatial sources based on Jitterbug node positions and velocities.
   * @param nodes Array of { id, position, velocity, opacity }
   * @param throttle 10Hz - call from RAF with timing check
   */
  updateFromJitterbug(nodes: Array<{
    id: string;
    position: THREE.Vector3;
    velocity: number;
    opacity: number;
  }>): void {
    if (!this.ctx || !this.masterGain) return;

    // Sort nodes by velocity (most active = highest pitch priority)
    const sortedNodes = [...nodes]
      .filter(n => n.opacity > 0.01)
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, MAX_SOURCES);

    // Update pool
    this.sources.forEach((source, i) => {
      const node = sortedNodes[i];

      if (node) {
        // Active node - update position and volume
        source.position.copy(node.position);
        source.panner.positionX.setValueAtTime(node.position.x, this.ctx!.currentTime);
        source.panner.positionY.setValueAtTime(node.position.y, this.ctx!.currentTime);
        source.panner.positionZ.setValueAtTime(node.position.z, this.ctx!.currentTime);

        // Pitch based on velocity (faster = higher)
        const baseFreq = 110 + i * 20;
        const freq = baseFreq + node.velocity * 50;
        source.osc.frequency.setTargetAtTime(freq, this.ctx!.currentTime, 0.1);

        // Volume based on opacity
        const vol = Math.min(0.15, node.opacity * 0.2);
        source.gain.gain.setTargetAtTime(vol, this.ctx!.currentTime, 0.1);

        source.active = true;
      } else {
        // Inactive - fade out
        source.gain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.2);
        source.active = false;
      }
    });
  }

  /**
   * Update coherence-driven audio.
   * - Modulates filter cutoff (existing from audioEngine)
   * - Adds 5th harmonic at high coherence
   * - Plays lock chime on coherence achievement
   */
  updateCoherence(coherence: number): void {
    if (!this.ctx || !this.coherenceHarmonicGain) return;

    // 5th harmonic becomes dominant at perfect coherence
    const harmonicVol = coherence > 0.9
      ? (coherence - 0.9) * 0.5 // 0-0.05 at 0.9-1.0 coherence
      : 0;
    this.coherenceHarmonicGain.gain.setTargetAtTime(
      harmonicVol,
      this.ctx.currentTime,
      0.5
    );

    // Trigger lock chime on coherence achievement
    if (coherence >= this.coherenceTarget && this.lastCoherence < this.coherenceTarget) {
      this.playLockChime();
    }

    this.lastCoherence = coherence;
  }

  /**
   * Play the "locked" chime when coherence is achieved.
   */
  private playLockChime(): void {
    if (!this.ctx || !this.lockChimeOsc || !this.lockChimeGain) return;

    const now = this.ctx.currentTime;

    // Quick attack, medium decay
    this.lockChimeGain.gain.cancelScheduledValues(now);
    this.lockChimeGain.gain.setValueAtTime(0, now);
    this.lockChimeGain.gain.linearRampToValueAtTime(0.3, now + 0.02);
    this.lockChimeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    // Slight pitch bend up
    this.lockChimeOsc.frequency.cancelScheduledValues(now);
    this.lockChimeOsc.frequency.setValueAtTime(880, now);
    this.lockChimeOsc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
    this.lockChimeOsc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
  }

  suspend(): void {
    if (this.ctx?.state === 'running') {
      this.ctx.suspend();
    }
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  destroy(): void {
    this.sources.forEach(source => {
      try {
        source.osc.stop();
        source.osc.disconnect();
        source.gain.disconnect();
        source.panner.disconnect();
      } catch {
        // Already stopped
      }
    });

    try {
      this.coherenceHarmonicOsc?.stop();
      this.coherenceHarmonicOsc?.disconnect();
      this.coherenceHarmonicGain?.disconnect();
      this.lockChimeOsc?.stop();
      this.lockChimeOsc?.disconnect();
      this.lockChimeGain?.disconnect();
    } catch {
      // Already stopped
    }

    this.sources = [];
  }
}

export const jitterbugAudioPool = new JitterbugAudioPoolClass();
