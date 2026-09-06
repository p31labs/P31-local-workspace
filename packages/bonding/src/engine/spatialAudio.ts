// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Spatial Audio Engine: 3D positioned sounds
//
// Uses Web Audio API PannerNode for spatial audio.
// Enables 3D positioned sound effects for multiplayer.
// ═══════════════════════════════════════════════════════

import type { PlacedAtom } from '../types';

let audioCtx: AudioContext | null = null;
let listener: AudioListener | null = null;
let masterGain: GainNode | null = null;

// Get or create audio context with spatial audio support
function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor = window.AudioContext
      || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctor();
    listener = audioCtx.listener;
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Initialize spatial audio. Call on user interaction.
 */
export function initSpatial(): void {
  getCtx();
}

/**
 * Update listener (camera) position and orientation.
 * @param position - [x, y, z] position
 * @param forward - [x, y, z] forward direction
 * @param up - [x, y, z] up direction
 */
export function updateListener(
  position: [number, number, number],
  forward: [number, number, number] = [0, 0, -1],
  up: [number, number, number] = [0, 1, 0]
): void {
  if (!listener || !audioCtx) return;

  // Set position (modern API)
  if (listener.positionX) {
    listener.positionX.setValueAtTime(position[0], audioCtx.currentTime);
    listener.positionY.setValueAtTime(position[1], audioCtx.currentTime);
    listener.positionZ.setValueAtTime(position[2], audioCtx.currentTime);
  }

  // Set orientation
  if (listener.forwardX) {
    listener.forwardX.setValueAtTime(forward[0], audioCtx.currentTime);
    listener.forwardY.setValueAtTime(forward[1], audioCtx.currentTime);
    listener.forwardZ.setValueAtTime(forward[2], audioCtx.currentTime);
    listener.upX.setValueAtTime(up[0], audioCtx.currentTime);
    listener.upY.setValueAtTime(up[1], audioCtx.currentTime);
    listener.upZ.setValueAtTime(up[2], audioCtx.currentTime);
  }
}

/**
 * Create a spatialized sound source at a 3D position.
 * @param position - [x, y, z] in world coordinates
 * @param frequency - oscillator frequency in Hz
 * @param duration - sound duration in seconds
 * @param type - oscillator type
 * @param volume - gain (0-1)
 */
export function playSpatialSound(
  position: [number, number, number],
  frequency: number,
  duration: number = 0.3,
  type: OscillatorType = 'sine',
  volume: number = 0.3
): void {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Create nodes
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const panner = ctx.createPanner();

  // Configure panner for 3D positioning
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.refDistance = 1;
  panner.maxDistance = 100;
  panner.rolloffFactor = 1;
  panner.coneInnerAngle = 360;
  panner.coneOuterAngle = 360;
  panner.coneOuterGain = 0;

  // Set position
  panner.positionX.setValueAtTime(position[0], now);
  panner.positionY.setValueAtTime(position[1], now);
  panner.positionZ.setValueAtTime(position[2], now);

  // Configure oscillator
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);

  // Envelope
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  // Connect: osc -> gain -> panner -> master -> destination
  osc.connect(gain);
  gain.connect(panner);
  panner.connect(masterGain!);

  osc.start(now);
  osc.stop(now + duration + 0.1);
}

/**
 * Play a spatial sound for an atom placement.
 * Position is based on atom's 3D position in the canvas.
 */
export function playAtomPlacementSound(atom: PlacedAtom, frequency: number): void {
  // Convert 3D position to spatial coordinates
  // The canvas uses normalized coordinates, scale to audio space
  const pos: [number, number, number] = [
    atom.position.x * 10,
    atom.position.y * 10,
    atom.position.z * 10,
  ];
  playSpatialSound(pos, frequency, 0.2, 'triangle', 0.25);
}

/**
 * Play a spatial sound for bond formation between two atoms.
 */
export function playBondSpatialSound(
  pos1: [number, number, number],
  pos2: [number, number, number],
  frequency: number
): void {
  // Position at midpoint between atoms
  const midX = (pos1[0] + pos2[0]) / 2 * 10;
  const midY = (pos1[1] + pos2[1]) / 2 * 10;
  const midZ = (pos1[2] + pos2[2]) / 2 * 10;

  playSpatialSound([midX, midY, midZ], frequency, 0.15, 'sine', 0.2);
}

/**
 * Set spatial audio master volume (0-1)
 */
export function setSpatialVolume(volume: number): void {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }
}
