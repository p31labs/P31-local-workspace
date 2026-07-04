import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initAudio,
  isMuted,
  setMuted,
  getFrequencies,
  getPentatonic,
  getSurfaceFrequencies,
  tapOrb,
  changeSurface,
  changeSpoons,
  grayRockOn,
  grayRockOff,
  breatheIn,
  breatheOut,
  achievement,
  error,
  surfaceTone,
} from '../sound';

describe('PHOS Sound Engine', () => {
  describe('FREQ table (Larmor-grounded frequencies)', () => {
    it('should have LARMOR_HZ = 863 for phosphor', () => {
      const f = getFrequencies();
      expect(f.phosphor).toBe(863);
    });

    it('should derive hydrogen from NMR ratio × LARMOR', () => {
      const f = getFrequencies();
      expect(f.hydrogen).toBe(Math.round(863 * 2.997));
    });

    it('should derive carbon from NMR ratio × LARMOR', () => {
      const f = getFrequencies();
      expect(f.carbon).toBe(Math.round(863 * 0.749));
    });

    it('should derive oxygen from NMR ratio × LARMOR', () => {
      const f = getFrequencies();
      expect(f.oxygen).toBe(Math.round(863 * 1.253));
    });

    it('should derive calcium from NMR ratio × LARMOR', () => {
      const f = getFrequencies();
      expect(f.calcium).toBe(Math.round(863 * 0.489));
    });

    it('should derive sodium from NMR ratio × LARMOR', () => {
      const f = getFrequencies();
      expect(f.sodium).toBe(Math.round(863 * 0.552));
    });

    it('should expose exactly 6 frequency constants', () => {
      const f = getFrequencies();
      expect(Object.keys(f)).toHaveLength(6);
    });
  });

  describe('Pentatonic scale', () => {
    it('should return 6 notes', () => {
      const notes = getPentatonic();
      expect(notes).toHaveLength(6);
    });

    it('should start at C4 (261.63 Hz)', () => {
      expect(getPentatonic()[0]).toBe(261.63);
    });

    it('should be a copy (not mutable)', () => {
      const n1 = getPentatonic();
      n1[0] = 999;
      expect(getPentatonic()[0]).toBe(261.63);
    });
  });

  describe('Surface frequency mapping', () => {
    it('should map all 22 surfaces to frequencies', () => {
      const sf = getSurfaceFrequencies();
      expect(Object.keys(sf)).toHaveLength(22);
    });

    it('should map GREETING to hydrogen frequency', () => {
      const sf = getSurfaceFrequencies();
      expect(sf.GREETING).toBe(getFrequencies().hydrogen);
    });

    it('should map SANCTUARY to calcium frequency', () => {
      const sf = getSurfaceFrequencies();
      expect(sf.SANCTUARY).toBe(getFrequencies().calcium);
    });

    it('should map NODE_ZERO to phosphor (Larmor) frequency', () => {
      const sf = getSurfaceFrequencies();
      expect(sf.NODE_ZERO).toBe(863);
    });

    it('should return a copy (not the internal reference)', () => {
      const sf1 = getSurfaceFrequencies();
      sf1.GREETING = 1;
      const sf2 = getSurfaceFrequencies();
      expect(sf2.GREETING).toBe(getFrequencies().hydrogen);
    });
  });

  describe('Mute control', () => {
    beforeEach(() => {
      setMuted(false);
    });

    it('should default to not muted', () => {
      setMuted(false);
      expect(isMuted()).toBe(false);
    });

    it('should toggle muted state', () => {
      setMuted(true);
      expect(isMuted()).toBe(true);
      setMuted(false);
      expect(isMuted()).toBe(false);
    });

    it('should persist mute state to localStorage', () => {
      setMuted(true);
      expect(localStorage.getItem('phos_muted')).toBe('true');
      setMuted(false);
      expect(localStorage.getItem('phos_muted')).toBe('false');
    });
  });

  describe('Sound functions — crash safety', () => {
    it('tapOrb should not throw', () => {
      expect(() => tapOrb()).not.toThrow();
      expect(() => tapOrb(0)).not.toThrow();
      expect(() => tapOrb(5)).not.toThrow();
    });

    it('changeSurface should not throw', () => {
      expect(() => changeSurface()).not.toThrow();
      expect(() => changeSurface(3)).not.toThrow();
    });

    it('changeSpoons should not throw for all levels 0-5', () => {
      for (let i = 0; i <= 5; i++) {
        expect(() => changeSpoons(i)).not.toThrow();
      }
    });

    it('grayRockOn should not throw', () => {
      expect(() => grayRockOn()).not.toThrow();
    });

    it('grayRockOff should not throw', () => {
      expect(() => grayRockOff()).not.toThrow();
    });

    it('breatheIn should not throw', () => {
      expect(() => breatheIn()).not.toThrow();
    });

    it('breatheOut should not throw', () => {
      expect(() => breatheOut()).not.toThrow();
    });

    it('achievement should not throw', () => {
      expect(() => achievement()).not.toThrow();
    });

    it('error should not throw', () => {
      expect(() => error()).not.toThrow();
    });

    it('surfaceTone should not throw for all surfaces', () => {
      const sf = getSurfaceFrequencies();
      Object.keys(sf).forEach((surface) => {
        expect(() => surfaceTone(surface)).not.toThrow();
      });
    });

    it('surfaceTone should not throw for unknown surface', () => {
      expect(() => surfaceTone('NONEXISTENT')).not.toThrow();
    });
  });

  describe('Sound functions — muted = no-op (no crash)', () => {
    it('all sounds should not throw when muted', () => {
      setMuted(true);
      expect(() => tapOrb()).not.toThrow();
      expect(() => changeSurface()).not.toThrow();
      expect(() => changeSpoons(3)).not.toThrow();
      expect(() => grayRockOn()).not.toThrow();
      expect(() => grayRockOff()).not.toThrow();
      expect(() => breatheIn()).not.toThrow();
      expect(() => breatheOut()).not.toThrow();
      expect(() => achievement()).not.toThrow();
      expect(() => error()).not.toThrow();
      setMuted(false);
    });
  });

  describe('initAudio', () => {
    it('should not throw', () => {
      expect(() => initAudio()).not.toThrow();
    });

    it('should be idempotent (no double-init)', () => {
      initAudio();
      expect(() => initAudio()).not.toThrow();
    });
  });
});
