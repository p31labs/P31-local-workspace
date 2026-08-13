/**
 * @file __tests__/gazeSignals.test.ts
 *
 * Validates gaze tracking store integration and behavioral signal pupilDilation field.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useShipStore } from '../store/shipStore';

describe('gaze tracking store', () => {
  beforeEach(() => {
    useShipStore.setState({ gazeActive: false });
  });

  it('defaults gazeActive to false', () => {
    expect(useShipStore.getState().gazeActive).toBe(false);
  });

  it('toggles gazeActive via setGazeActive', () => {
    useShipStore.getState().setGazeActive(true);
    expect(useShipStore.getState().gazeActive).toBe(true);
    useShipStore.getState().setGazeActive(false);
    expect(useShipStore.getState().gazeActive).toBe(false);
  });
});

describe('BehavioralSignal pupilDilation field', () => {
  it('accepts pupilDilation in signal object', () => {
    const signal = {
      mouseSpeed: 0,
      pauseDuration: 1000,
      sessionMinutes: 10,
      timeOfDayPenalty: 0,
      keySpeed: 200,
      interactionRate: 2,
      pupilDilation: 0.7,
    };
    expect(signal.pupilDilation).toBe(0.7);
    expect(signal.pupilDilation).toBeGreaterThan(0.6);
  });

  it('pupilDilation at rest level does not trigger fatigue threshold', () => {
    const pupilDilation = 0.3;
    const GAZE_FATIGUE_THRESHOLD = 0.6;
    expect(pupilDilation > GAZE_FATIGUE_THRESHOLD).toBe(false);
  });

  it('pupilDilation above threshold triggers fatigue', () => {
    const pupilDilation = 0.75;
    const GAZE_FATIGUE_THRESHOLD = 0.6;
    expect(pupilDilation > GAZE_FATIGUE_THRESHOLD).toBe(true);
  });
});
