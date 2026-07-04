// ═══════════════════════════════════════════════════════════════
// WCD-28.2: R3F Performance Monitor Hook
// P31 Labs — Spaceship Earth
//
// Call once in root Canvas component.
// Feeds frame deltas to the performance monitor.
// ═══════════════════════════════════════════════════════════════

import { useFrame } from '@react-three/fiber';
import { performanceMonitor } from '../services/performanceMonitor';

/**
 * Call once in root Canvas component.
 * Feeds frame deltas to the performance monitor.
 */
export function usePerformanceMonitor() {
  useFrame((_state, delta) => {
    performanceMonitor.recordFrame(delta);
  });
}
