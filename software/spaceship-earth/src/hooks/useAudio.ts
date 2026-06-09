// ═══════════════════════════════════════════════════════════════════════════
// WCD-26.2: useAudio Hook
// P31 Labs — Spaceship Earth
//
// Exposes audio functionality to components with 10Hz throttle for position updates.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '@p31/shared/sovereign';
import { audioZoneManager } from '../services/AudioZoneManager';
import * as THREE from 'three';

export interface AudioState {
  initialized: boolean;
  suspended: boolean;
  masterVolume: number;
}

// Singleton for RAF callbacks
let _cameraRef: THREE.Camera | null = null;
let _lastUpdate = 0;
const UPDATE_INTERVAL = 100; // 10Hz

/**
 * Hook to access the audio system from any component.
 * Returns the audio state and control functions.
 */
export function useAudio() {
  const stateRef = useRef<AudioState>({
    initialized: false,
    suspended: false,
    masterVolume: 0.15,
  });

  // Initialize audio on first use
  useEffect(() => {
    if (stateRef.current.initialized) return;

    const init = () => {
      if (stateRef.current.initialized) return;

      audioEngine.init();
      if (audioEngine.ctx && audioEngine.masterGain) {
        audioZoneManager.init(audioEngine.ctx, audioEngine.masterGain);
        stateRef.current.initialized = true;
      }
    };

    // Initialize on first user interaction (required by browsers)
    const handleInteraction = () => {
      init();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibility = () => {
      if (!audioEngine.ctx) return;

      if (document.hidden) {
        audioEngine.ctx.suspend();
        stateRef.current.suspended = true;
      } else {
        audioEngine.ctx.resume();
        stateRef.current.suspended = false;
        audioZoneManager.resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const setCamera = useCallback((camera: THREE.Camera) => {
    _cameraRef = camera;
  }, []);

  const updateSpatial = useCallback(() => {
    if (!_cameraRef || !stateRef.current.initialized) return;

    const now = performance.now();
    if (now - _lastUpdate < UPDATE_INTERVAL) return;
    _lastUpdate = now;

    // Update listener position
    audioZoneManager.setListener(_cameraRef);

    // Update zone based on camera position
    audioZoneManager.updateFromCamera(_cameraRef.position);
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    if (audioEngine.masterGain) {
      audioEngine.masterGain.gain.value = volume;
      stateRef.current.masterVolume = volume;
    }
  }, []);

  const updateCoherence = useCallback((coherence: number, isTransitioning: boolean, activeRoom: string) => {
    audioEngine.update(coherence, isTransitioning, activeRoom);
  }, []);

  return {
    ...stateRef.current,
    setCamera,
    updateSpatial,
    setMasterVolume,
    updateCoherence,
  };
}
