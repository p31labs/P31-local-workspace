// src/__tests__/wcd27.test.ts
// WCD-27: "Keep Building" coordinate fix — Option C verification.
//
// Root cause: a saturated molecule has no open bond sites. Atoms placed
// after "Keep Building" landed disconnected, polluting the formula bar
// (e.g., H₂ + solo O → aggregated as "H₂O" at wrong stability).
//
// Fix (Option C): continueBuilding() = reset() + molecule fact toast.
// Button already labeled "Build Next". Canvas clears, new build starts fresh.

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';

beforeEach(() => {
  useGameStore.getState().reset();
});

describe('WCD-27 Option C: continueBuilding clears canvas', () => {
  it('clears atoms after Build Next', () => {
    useGameStore.setState({
      atoms: [
        { id: 1, element: 'H', position: { x: 0, y: 0, z: 0 }, bonds: [1] },
        { id: 2, element: 'H', position: { x: 1, y: 0, z: 0 }, bonds: [1] },
      ],
      bonds: [{ id: 1, atomA: 1, atomB: 2, order: 1 }],
      gamePhase: 'complete',
    });

    useGameStore.getState().continueBuilding();

    expect(useGameStore.getState().atoms).toHaveLength(0);
  });

  it('clears bonds after Build Next', () => {
    useGameStore.setState({
      bonds: [{ id: 1, atomA: 1, atomB: 2, order: 1 }],
      gamePhase: 'complete',
    });

    useGameStore.getState().continueBuilding();

    expect(useGameStore.getState().bonds).toHaveLength(0);
  });

  it('returns gamePhase to placing after Build Next', () => {
    useGameStore.setState({ gamePhase: 'complete' });

    useGameStore.getState().continueBuilding();

    expect(useGameStore.getState().gamePhase).toBe('placing');
  });

  it('canvas is empty so new atoms can bond without disconnection', () => {
    // After continueBuilding, canvas is clear → first atom goes to center ghost site
    useGameStore.setState({ gamePhase: 'complete', atoms: [{ id: 1, element: 'H', position: { x: 0, y: 0, z: 0 }, bonds: [] }] });

    useGameStore.getState().continueBuilding();

    const { atoms, gamePhase } = useGameStore.getState();
    // Clean slate: no atoms polluting bond site calculation
    expect(atoms).toHaveLength(0);
    expect(gamePhase).toBe('placing');
  });

  it('Build Another and Build Next produce identical state', () => {
    const seedAtoms = [{ id: 1, element: 'O', position: { x: 0, y: 0, z: 0 }, bonds: [] }];

    // Run continueBuilding
    useGameStore.setState({ atoms: seedAtoms, gamePhase: 'complete' });
    useGameStore.getState().continueBuilding();
    const afterContinue = {
      atoms: useGameStore.getState().atoms,
      bonds: useGameStore.getState().bonds,
      gamePhase: useGameStore.getState().gamePhase,
    };

    // Run reset (Build Another)
    useGameStore.setState({ atoms: seedAtoms, gamePhase: 'complete' });
    useGameStore.getState().reset();
    const afterReset = {
      atoms: useGameStore.getState().atoms,
      bonds: useGameStore.getState().bonds,
      gamePhase: useGameStore.getState().gamePhase,
    };

    expect(afterContinue.atoms).toHaveLength(afterReset.atoms.length);
    expect(afterContinue.bonds).toHaveLength(afterReset.bonds.length);
    expect(afterContinue.gamePhase).toBe(afterReset.gamePhase);
  });
});
