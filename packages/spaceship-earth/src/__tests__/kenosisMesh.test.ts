import { describe, it, expect } from 'vitest';
import { getKenosisMesh, type KenosisMeshClass } from '../lib/engine/kenosisMesh';

describe('KenosisMesh', () => {
  describe('initial state', () => {
    it('starts disconnected', () => {
      const mesh = getKenosisMesh();
      expect(mesh.getConnectionState()).toBe('disconnected');
    });

    it('isConnected returns false initially', () => {
      const mesh = getKenosisMesh();
      expect(mesh.isConnected()).toBe(false);
    });

    it('getLastError returns null initially', () => {
      const mesh = getKenosisMesh();
      expect(mesh.getLastError()).toBe(null);
    });
  });

  describe('singleton', () => {
    it('returns same instance', () => {
      const m1 = getKenosisMesh();
      const m2 = getKenosisMesh();
      expect(m1).toBe(m2);
    });
  });
});