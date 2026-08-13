import { useEffect } from 'react';
import { useShipStore } from '../store/shipStore';
import { useSovereignStore } from '../sovereign/useSovereignStore';
import { useHistoryStore } from '../store/useHistoryStore';

export function useUndoHistory() {
  useEffect(() => {
    const unsubShip = useShipStore.subscribe((state, prev) => {
      if (useHistoryStore.getState().isUndoing) return;

      if (state.spoons !== prev.spoons) {
        useHistoryStore.getState().record('spoons', `Spoons ${prev.spoons} → ${state.spoons}`, () => {
          useShipStore.getState().setSpoons(prev.spoons);
        });
      }

      if (state.showK4Wireframe !== prev.showK4Wireframe) {
        useHistoryStore.getState().record('view', `K₄ wireframe ${prev.showK4Wireframe ? 'on' : 'off'}`, () => {
          useShipStore.getState().setShowK4Wireframe(prev.showK4Wireframe);
        });
      }

      if (state.ledCollapsed !== prev.ledCollapsed) {
        useHistoryStore.getState().record('led', `LED panel ${prev.ledCollapsed ? 'collapsed' : 'expanded'}`, () => {
          useShipStore.getState().setLedCollapsed(prev.ledCollapsed);
        });
      }

      if (state.selectedNode !== prev.selectedNode) {
        useHistoryStore.getState().record('node', `Node selection ${prev.selectedNode ?? 'none'} → ${state.selectedNode ?? 'none'}`, () => {
          useShipStore.getState().setSelectedNode(prev.selectedNode);
        });
      }
    });

    const unsubSovereign = useSovereignStore.subscribe((state, prev) => {
      if (useHistoryStore.getState().isUndoing) return;

      if (state.coherence !== prev.coherence) {
        useHistoryStore.getState().record('coherence', `Coherence ${(prev.coherence * 100).toFixed(0)}% → ${(state.coherence * 100).toFixed(0)}%`, () => {
          useSovereignStore.setState({ coherence: prev.coherence });
        });
      }
    });

    return () => { unsubShip(); unsubSovereign(); };
  }, []);
}
