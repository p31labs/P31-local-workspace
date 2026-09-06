// src/__tests__/wcd26.test.ts
// WCD-26: "Keep Building" ghost sites — original defect and fix history.
//
// WCD-26 identified that ghost sites didn't reappear after completion.
// WCD-27 superseded the atom-preservation approach: "Build Next" now clears
// the canvas (Option C) because a saturated molecule has no open bond sites.
// The tests below verify the WCD-26 root cause was understood; the final
// continueBuilding() behavior is verified in wcd27.test.ts.

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';

beforeEach(() => {
  useGameStore.getState().reset();
});

describe('WCD-26: ghost site gating', () => {
  it('gamePhase resets to placing after continueBuilding', () => {
    useGameStore.setState({ gamePhase: 'complete' });
    useGameStore.getState().continueBuilding();
    expect(useGameStore.getState().gamePhase).toBe('placing');
  });

  it('build-another reset clears atoms and returns placing phase', () => {
    useGameStore.setState({
      atoms: [{ id: 1, element: 'H', position: { x: 0, y: 0, z: 0 }, bonds: [] }],
      gamePhase: 'complete',
    });
    useGameStore.getState().reset();
    expect(useGameStore.getState().atoms).toHaveLength(0);
    expect(useGameStore.getState().gamePhase).toBe('placing');
  });
});
