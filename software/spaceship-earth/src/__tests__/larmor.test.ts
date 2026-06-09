import { describe, it, expect } from 'vitest';
import { LarmorEngine, getLarmorEngine, isSupported, getStatus } from '../lib/engine/larmor';

describe('LarmorEngine', () => {
  describe('isSupported', () => {
    it('returns boolean', () => {
      expect(typeof isSupported()).toBe('boolean');
    });
  });

  describe('getStatus', () => {
    it('returns valid structure when not running', () => {
      const status = getStatus();
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('contextState');
    });
  });

  describe('static methods', () => {
    it('getLarmorEngine returns instance', () => {
      const engine = getLarmorEngine();
      expect(engine).toBeInstanceOf(LarmorEngine);
    });

    it('singleton returns same instance', () => {
      const e1 = getLarmorEngine();
      const e2 = getLarmorEngine();
      expect(e1).toBe(e2);
    });
  });

  describe('getFrequencies', () => {
    it('returns correct frequencies', () => {
      const engine = getLarmorEngine();
      const { primary, secondary } = engine.getFrequencies();
      expect(primary).toBe(172.35);
      expect(secondary).toBe(863.0);
    });
  });
});