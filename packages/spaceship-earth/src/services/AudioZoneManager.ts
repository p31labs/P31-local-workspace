// ═══════════════════════════════════════════════════════════════════════════
// WCD-26.1: Audio Zone Manager
// P31 Labs — Spaceship Earth
//
// Manages spatial audio zones for each room with cross-fading transitions.
// ═══════════════════════════════════════════════════════════════════════════

import { audioEngine } from '@p31/shared/sovereign';
import * as THREE from 'three';

export interface AudioZone {
  name: string;
  position: THREE.Vector3;
  radius: number;
  // Ambient loop parameters
  baseFreq: number;
  volume: number;
  filterFreq: number;
  filterQ: number;
}

// Room positions in Three.js world space
const ZONES: AudioZone[] = [
  {
    name: 'OBSERVATORY',
    position: new THREE.Vector3(0, 0, 0),
    radius: 50,
    baseFreq: 880,      // High-frequency chirps
    volume: 0.12,
    filterFreq: 4000,
    filterQ: 2,
  },
  {
    name: 'BRIDGE',
    position: new THREE.Vector3(100, 0, 0),
    radius: 40,
    baseFreq: 55,       // Low rumble
    volume: 0.15,
    filterFreq: 200,
    filterQ: 8,
  },
  {
    name: 'BRAIN',
    position: new THREE.Vector3(200, 0, 0),
    radius: 35,
    baseFreq: 220,      // Soft white noise
    volume: 0.08,
    filterFreq: 800,
    filterQ: 1,
  },
  {
    name: 'BUFFER',
    position: new THREE.Vector3(300, 0, 0),
    radius: 30,
    baseFreq: 432,      // Calming
    volume: 0.10,
    filterFreq: 600,
    filterQ: 1,
  },
];

// Singleton manager
class AudioZoneManagerClass {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private zones: Map<string, {
    osc: OscillatorNode;
    gain: GainNode;
    filter: BiquadFilterNode;
    lfo: OscillatorNode;
    lfoGain: GainNode;
  }> = new Map();
  private currentZone: string | null = null;
  private listener: AudioListener | null = null;
  private lastUpdate = 0;
  private updateInterval = 100; // 10Hz throttle

  init(ctx: AudioContext, masterGain: GainNode): void {
    this.ctx = ctx;
    this.masterGain = masterGain;

    // Create zone oscillators
    ZONES.forEach(zone => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      // Main oscillator
      osc.type = 'sine';
      osc.frequency.value = zone.baseFreq;

      // LFO for subtle modulation
      lfo.type = 'sine';
      lfo.frequency.value = 0.2 + Math.random() * 0.3; // 0.2-0.5 Hz
      lfoGain.gain.value = zone.baseFreq * 0.02; // 2% modulation

      // Filter
      filter.type = 'lowpass';
      filter.frequency.value = zone.filterFreq;
      filter.Q.value = zone.filterQ;

      // Connect LFO -> oscillator frequency
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      // Connect main chain
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      // Start
      gain.gain.value = 0; // Start silent
      osc.start();
      lfo.start();

      this.zones.set(zone.name, { osc, gain, filter, lfo, lfoGain });
    });
  }

  /**
   * Set the listener transform from a Three.js camera.
   * Called from RAF loop, throttled to 10Hz.
   */
  setListener(camera: THREE.Camera): void {
    if (!this.ctx) return;

    const now = performance.now();
    if (now - this.lastUpdate < this.updateInterval) return;
    this.lastUpdate = now;

    // Get camera position and orientation
    const pos = camera.position;
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0);
    up.applyQuaternion(camera.quaternion);

    // Update Web Audio listener
    const listener = this.ctx.listener;
    if (listener.positionX) {
      listener.positionX.setValueAtTime(pos.x, this.ctx.currentTime);
      listener.positionY.setValueAtTime(pos.y, this.ctx.currentTime);
      listener.positionZ.setValueAtTime(pos.z, this.ctx.currentTime);
      listener.forwardX.setValueAtTime(forward.x, this.ctx.currentTime);
      listener.forwardY.setValueAtTime(forward.y, this.ctx.currentTime);
      listener.forwardZ.setValueAtTime(forward.z, this.ctx.currentTime);
      listener.upX.setValueAtTime(up.x, this.ctx.currentTime);
      listener.upY.setValueAtTime(up.y, this.ctx.currentTime);
      listener.upZ.setValueAtTime(up.z, this.ctx.currentTime);
    } else {
      // Deprecated API fallback
      listener.setPosition(pos.x, pos.y, pos.z);
      listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
  }

  /**
   * Update which zone is active based on camera position.
   * Cross-fades between zones over 1 second.
   */
  updateFromCamera(cameraPosition: THREE.Vector3): void {
    if (!this.ctx) return;

    // Find closest zone
    let closestZoneName: string | null = null;
    let closestDist = Infinity;

    for (const zone of ZONES) {
      const dist = cameraPosition.distanceTo(zone.position);
      if (dist < closestDist) {
        closestDist = dist;
        closestZoneName = zone.name;
      }
    }

    if (!closestZoneName) return;

    // Skip if no change
    if (closestZoneName === this.currentZone) return;
    this.currentZone = closestZoneName;

    // Cross-fade
    const fadeTime = 1.0;
    const now = this.ctx.currentTime;

    this.zones.forEach((nodes, name) => {
      const zone = ZONES.find(z => z.name === name);
      if (!zone) return;

      const targetVol = name === closestZoneName ? zone.volume : 0;
      nodes.gain.gain.setTargetAtTime(targetVol, now, fadeTime / 3);

      // Also adjust filter based on proximity
      const dist = cameraPosition.distanceTo(zone.position);
      const proximity = Math.max(0, 1 - dist / zone.radius);
      nodes.filter.frequency.setTargetAtTime(
        zone.filterFreq * (0.5 + proximity * 0.5),
        now,
        0.5
      );
    });
  }

  /**
   * Resume all zone oscillators after suspension
   */
  resume(): void {
    this.zones.forEach(nodes => {
      try {
        nodes.osc.start();
        nodes.lfo.start();
      } catch {
        // Already started
      }
    });
  }

  /**
   * Suspend all zone oscillators
   */
  suspend(): void {
    // Web Audio handles this via AudioContext state
  }

  destroy(): void {
    this.zones.forEach(nodes => {
      try {
        nodes.osc.stop();
        nodes.lfo.stop();
        nodes.osc.disconnect();
        nodes.lfo.disconnect();
        nodes.gain.disconnect();
        nodes.filter.disconnect();
      } catch {
        // Already disconnected
      }
    });
    this.zones.clear();
    this.currentZone = null;
  }
}

export const audioZoneManager = new AudioZoneManagerClass();
