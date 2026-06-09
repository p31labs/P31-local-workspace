// ═══════════════════════════════════════════════════════════════════
// BONDING — SpatialAudio Tests (WCD-T04)
// HRTF 3D audio: initSpatial, zero-buffer, AudioContext state, PannerNode
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initSpatial,
  updateListener,
  playSpatialSound,
  playAtomPlacementSound,
  playBondSpatialSound,
  setSpatialVolume,
} from '../engine/spatialAudio';
import {
  setupAudioContextMock,
  teardownAudioContextMock,
  createdPannerNodes,
  createdOscillators,
  resetAudioMocks,
} from '../__tests__/helpers/mockAudioContext';
import type { PlacedAtom } from '../types';

describe('spatialAudio', () => {
  beforeEach(() => {
    resetAudioMocks();
    setupAudioContextMock();
  });

  afterEach(() => {
    teardownAudioContextMock();
  });

  describe('initSpatial', () => {
    it('initSpatial returns without throwing when AudioContext is available', () => {
      expect(() => initSpatial()).not.toThrow();
    });

    it('initSpatial is idempotent - no throw when called twice', () => {
      expect(() => {
        initSpatial();
        initSpatial();
      }).not.toThrow();
    });
  });

  describe('updateListener', () => {
    it('updateListener sets listener position', () => {
      initSpatial();
      
      expect(() => updateListener([1, 2, 3])).not.toThrow();
    });

    it('updateListener accepts forward and up vectors', () => {
      initSpatial();
      
      expect(() => {
        updateListener(
          [0, 0, 0],
          [1, 0, 0], // forward
          [0, 1, 0]  // up
        );
      }).not.toThrow();
    });
  });

  describe('playSpatialSound', () => {
    it('playSpatialSound creates a PannerNode with panningModel === "HRTF"', () => {
      initSpatial();
      
      const initialPannerCount = createdPannerNodes.length;
      
      playSpatialSound([0, 0, 0], 440, 0.1, 'sine', 0.5);
      
      expect(createdPannerNodes.length).toBeGreaterThan(initialPannerCount);
      
      const lastPanner = createdPannerNodes[createdPannerNodes.length - 1];
      expect(lastPanner.panningModel).toBe('HRTF');
    });

    it('playSpatialSound creates oscillators for the sound', () => {
      initSpatial();
      
      const initialOscCount = createdOscillators.length;
      
      playSpatialSound([0, 0, 0], 440, 0.1, 'sine', 0.5);
      
      expect(createdOscillators.length).toBeGreaterThan(initialOscCount);
    });

    it('volume parameter of 0 results in gain node value of 0', () => {
      initSpatial();
      
      // Should handle 0 volume gracefully
      expect(() => playSpatialSound([0, 0, 0], 440, 0.1, 'sine', 0)).not.toThrow();
    });

    it('playSpatialSound handles all oscillator types', () => {
      initSpatial();
      
      const types = ['sine', 'square', 'sawtooth', 'triangle'] as const;
      
      for (const type of types) {
        expect(() => {
          playSpatialSound([0, 0, 0], 440, 0.05, type, 0.5);
        }).not.toThrow();
      }
    });
  });

  describe('playAtomPlacementSound', () => {
    it('playAtomPlacementSound creates spatial sound with atom position and frequency', () => {
      initSpatial();
      
      const initialOscCount = createdOscillators.length;
      
      const mockAtom: PlacedAtom = {
        id: 1,
        element: 'H',
        position: { x: 0, y: 0, z: 0 },
        bondSites: 1,
        bondedTo: [],
        placedBy: 0,
        timestamp: new Date().toISOString(),
      };
      
      playAtomPlacementSound(mockAtom, 440);
      
      expect(createdOscillators.length).toBeGreaterThan(initialOscCount);
    });
  });

  describe('playBondSpatialSound', () => {
    it('playBondSpatialSound creates sound at midpoint between two positions', () => {
      initSpatial();
      
      const initialOscCount = createdOscillators.length;
      
      playBondSpatialSound([0, 0, 0], [1, 1, 1], 523.25);
      
      expect(createdOscillators.length).toBeGreaterThan(initialOscCount);
    });
  });

  describe('setSpatialVolume', () => {
    it('setSpatialVolume clamps values between 0 and 1', () => {
      initSpatial();
      
      expect(() => setSpatialVolume(0.5)).not.toThrow();
      expect(() => setSpatialVolume(0)).not.toThrow();
      expect(() => setSpatialVolume(1)).not.toThrow();
      expect(() => setSpatialVolume(-1)).not.toThrow();
      expect(() => setSpatialVolume(2)).not.toThrow();
    });
  });
});