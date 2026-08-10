/**
 * @file components/JitterbugBackground.tsx — Molecular Starfield Background
 * 
 * DOM Canvas-2D layer behind the WebGL canvas.
 * Mounts the jitterbug molecular starfield from @p31/design-core.
 * SMART notify() API for notification bursts.
 */

import { useEffect, useRef } from 'react';
import { mountJitterbugStarfield, type JitterbugStarfieldInstance } from '@p31/design-core/starfield/jitterbug';
import { useShipStore } from '../store/shipStore';
import { useSovereignStore } from '../sovereign/useSovereignStore';

export default function JitterbugBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<JitterbugStarfieldInstance | null>(null);
  
  const spoons = useShipStore((s) => s.spoons);
  const reduceMotion = false; // TODO: wire to sovereign
  const safeMode = false;

  useEffect(() => {
    if (!containerRef.current) return;

    instanceRef.current = mountJitterbugStarfield(containerRef.current, {
      spoons,
      voltage: 'GREEN',
      connectionAudio: false,
      safeMode,
      poetsMode: false,
    });

    // Expose globally for SMART notify access
    if (typeof window !== 'undefined') {
      (window as any).__jitterbug = instanceRef.current;
    }

    return () => {
      instanceRef.current?.destroy();
      if (typeof window !== 'undefined') {
        (window as any).__jitterbug = undefined;
      }
    };
  }, []);

  useEffect(() => {
    instanceRef.current?.setSpoons(spoons);
  }, [spoons]);

  useEffect(() => {
    instanceRef.current?.setPaused(reduceMotion || safeMode);
  }, [reduceMotion, safeMode]);

  return (
    <div
      ref={containerRef}
      className="jitterbug-background"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
