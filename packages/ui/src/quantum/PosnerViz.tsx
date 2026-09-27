import { useMemo } from 'react';
import { posnerAtoms, createPosnerState, updatePosnerCoherence } from '@p31ca/quantum-core/posner';
import { TETRA } from '@p31ca/design-core/math';

export function PosnerViz() {
  const atoms = useMemo(() => posnerAtoms(), []);
  const state = useMemo(() => createPosnerState(), []);

  const caCount = atoms.filter((a) => a.element === 'Ca').length;
  const pCount = atoms.filter((a) => a.element === 'P').length;
  const oCount = atoms.filter((a) => a.element === 'O').length;

  return (
    <div className="glass-panel p-4 rounded-2xl space-y-3" data-quantum="posner">
      <div className="flex items-center justify-between">
        <span className="text-sm text-cloud/60">Calcium</span>
        <span className="font-mono text-quantum-cyan">{caCount}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-cloud/60">Phosphorus</span>
        <span className="font-mono text-amber-400">{pCount}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-cloud/60">Oxygen</span>
        <span className="font-mono text-red-400">{oCount}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-cloud/60">Total</span>
        <span className="font-mono">{TETRA.POSNER_TOTAL_ATOMS}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-cloud/60">Coherence</span>
        <span className="font-mono text-quantum-cyan">{(state.coherence * 100).toFixed(0)}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-cloud/60">Entanglement Pairs</span>
        <span className="font-mono">{state.entanglementPairs.length}</span>
      </div>
    </div>
  );
}
