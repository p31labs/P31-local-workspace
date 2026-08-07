/**
 * @file ZoomControls.tsx — ZUI zoom HUD
 *
 * Compact level indicator + zoom in/out + return-to-cockpit controls for the
 * Zoomable User Interface (WCD-SE-SDS). Keyboard: Z zoom in, X zoom out,
 * C / Backspace return to the cockpit close-up.
 */

import { useEffect } from 'react';
import { ZoomLevel, useZUICameraStore } from '@p31/shared/zui';

const LEVEL_LABELS = ['MACRO', 'MESO', 'MICRO'] as const;

export function ZoomControls() {
  const level = useZUICameraStore((s) => s.currentLevel);
  const isTransitioning = useZUICameraStore((s) => s.isTransitioning);

  const canZoomIn = level < ZoomLevel.MICRO;
  const canZoomOut = level > ZoomLevel.MACRO;

  const zoomIn = () => {
    const s = useZUICameraStore.getState();
    if (s.isTransitioning) return;
    const nodeId = s.target.nodeId || 'dome-workshop';
    if (s.currentLevel === ZoomLevel.MACRO) {
      s.zoomToNode(nodeId, ZoomLevel.MESO);
    } else if (s.currentLevel === ZoomLevel.MESO) {
      s.zoomToNode(`${nodeId}-orb-0`, ZoomLevel.MICRO);
    }
  };

  const zoomOut = () => {
    const s = useZUICameraStore.getState();
    if (s.isTransitioning) return;
    if (s.currentLevel > ZoomLevel.MACRO) s.zoomOut();
  };

  const returnToCockpit = () => {
    const s = useZUICameraStore.getState();
    if (s.isTransitioning) return;
    useZUICameraStore.setState({
      previousLevel: s.currentLevel,
      currentLevel: ZoomLevel.MACRO,
      target: { ...s.target, nodeId: null },
      isTransitioning: true,
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (k === 'z') zoomIn();
      else if (k === 'x') zoomOut();
      else if (k === 'c' || k === 'backspace') {
        e.preventDefault();
        returnToCockpit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="pointer-events-auto absolute top-6 left-1/2 z-30 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#080810]/85 px-4 py-2 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={returnToCockpit}
          aria-label="Return to cockpit"
          className="rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          Cockpit
        </button>
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#22d3ee]">{LEVEL_LABELS[level]}</span>
        <button
          type="button"
          onClick={zoomOut}
          disabled={!canZoomOut || isTransitioning}
          aria-label="Zoom out"
          className="h-8 w-8 rounded-full border border-white/10 font-mono text-sm text-white/80 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          −
        </button>
        <button
          type="button"
          onClick={zoomIn}
          disabled={!canZoomIn || isTransitioning}
          aria-label="Zoom in"
          className="h-8 w-8 rounded-full border border-white/10 font-mono text-sm text-white/80 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}
