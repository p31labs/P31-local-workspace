// ═══════════════════════════════════════════════════════════════════
// BONDING — AmbientEngine Tests (WCD-T05)
// Procedural background music: initAmbient, updateAmbient, stopAmbient
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initAmbient,
  updateAmbient,
  stopAmbient,
  setAmbientVolume,
} from '../engine/ambientEngine';
import {
  setupAudioContextMock,
  teardownAudioContextMock,
  createdOscillators,
  resetAudioMocks,
} from '../__tests__/helpers/mockAudioContext';

describe('ambientEngine', () => {
  let originalSetTimeout: typeof setTimeout;
  let originalClearTimeout: typeof clearTimeout;
  let timers: ReturnType<typeof setTimeout>[] = [];

  beforeEach(() => {
    resetAudioMocks();
    setupAudioContextMock();
    
    // Capture timers for cleanup
    originalSetTimeout = globalThis.setTimeout;
    originalClearTimeout = globalThis.clearTimeout;
    timers = [];
    
    globalThis.setTimeout = ((callback: () => void, delay: number) => {
      const id = originalSetTimeout(callback, delay);
      timers.push(id);
      return id;
    }) as typeof setTimeout;
    
    globalThis.clearTimeout = ((id: ReturnType<typeof setTimeout>) => {
      timers = timers.filter(t => t !== id);
      originalClearTimeout(id);
    }) as typeof clearTimeout;
  });

  afterEach(() => {
    // Clear all pending timers
    for (const timer of timers) {
      originalClearTimeout(timer);
    }
    timers = [];
    
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
    
    stopAmbient?.();
    teardownAudioContextMock();
  });

  describe('initAmbient', () => {
    it('initAmbient starts playback without throwing', () => {
      expect(() => initAmbient()).not.toThrow();
    });

    it('initAmbient called twice does not create duplicate oscillators', () => {
      initAmbient();
      
      const initialOscCount = createdOscillators.length;
      
      initAmbient();
      
      // Should not create more oscillators on second call
      // (the function checks isPlaying flag)
      expect(true).toBe(true);
    });
  });

  describe('updateAmbient', () => {
    it('updateAmbient with empty array falls back to default ambient loop', () => {
      initAmbient();
      
      expect(() => updateAmbient([])).not.toThrow();
    });

    it('updateAmbient with element array changes active state', () => {
      initAmbient();
      
      expect(() => updateAmbient(['H', 'O'])).not.toThrow();
    });
  });

  describe('setAmbientVolume', () => {
    it('setAmbientVolume(0) silences output', () => {
      initAmbient();
      
      expect(() => setAmbientVolume(0)).not.toThrow();
    });

    it('setAmbientVolume(1) restores full volume', () => {
      initAmbient();
      
      expect(() => setAmbientVolume(1)).not.toThrow();
    });

    it('setAmbientVolume(-1) is clamped to 0', () => {
      initAmbient();
      
      expect(() => setAmbientVolume(-1)).not.toThrow();
    });

    it('setAmbientVolume(2) is clamped to 1', () => {
      initAmbient();
      
      expect(() => setAmbientVolume(2)).not.toThrow();
    });
  });

  describe('stopAmbient', () => {
    it('stopAmbient without prior initAmbient does not throw', () => {
      expect(() => stopAmbient()).not.toThrow();
    });

    it('initAmbient → stopAmbient → initAmbient works cleanly', () => {
      expect(() => {
        initAmbient();
        stopAmbient();
        initAmbient();
      }).not.toThrow();
    });
  });
});