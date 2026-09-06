import { useMemo } from 'react';
import { K4Graph } from '@p31/quantum-core';
import { TETRA } from '@p31/design-core/math';

export function K4Topology() {
  const graph = useMemo(() => new K4Graph(), []);

  return (
    <div className="glass-panel p-4 rounded-2xl space-y-3" data-quantum="k4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-cloud/60">Vertices</span>
        <span className="font-mono text-quantum-cyan">{graph.vertexCount}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-cloud/60">Edges</span>
        <span className="font-mono text-quantum-cyan">{graph.edgeCount}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-cloud/60">Complete</span>
        <span className="font-mono text-quantum-cyan">{graph.isComplete() ? '✓' : '✗'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-cloud/60">Planar</span>
        <span className="font-mono text-quantum-cyan">{graph.isPlanar() ? '✓' : '✗'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-cloud/60">Maxwell Rigidity</span>
        <span className="font-mono">{TETRA.MAXWELL_RIGIDITY}</span>
      </div>
      <div className="mt-2 text-xs text-cloud/40">
        {graph.vertices.map((v) => v.label).join(' ↔ ')}
      </div>
    </div>
  );
}
