import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { mountStarfield, type StarfieldInstance } from '@p31/design-core/starfield';
import { useSpoonStore } from '../state/spoonStore';
import { useStarfieldStore } from '../state/starfieldStore';

export interface StarfieldHandle {
  burst: (color?: string) => void;
  setVoltage: (v: string) => void;
  setRemembrance: (stars: { x: number; y: number }[]) => void;
  setConfig: (cfg: Record<string, number>) => void;
}

export const StarfieldLayer = forwardRef<StarfieldHandle>(function StarfieldLayer(_props, ref) {
  const spoons = useSpoonStore((s) => s.spoons);
  const containerRef = useRef<HTMLDivElement>(null);
  const sfRef = useRef<StarfieldInstance | null>(null);

  useImperativeHandle(ref, () => ({
    burst: (color) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      sfRef.current?.burst?.(Math.random() * w, Math.random() * h, color);
    },
    setVoltage: (v) => sfRef.current?.setVoltage?.(v as any),
    setRemembrance: (stars) => sfRef.current?.setRemembrance?.(stars),
    setConfig: (cfg) => sfRef.current?.setConfig?.(cfg as any),
  }), []);

  // Mount design-core starfield
  useEffect(() => {
    if (!containerRef.current || sfRef.current) return;
    sfRef.current = mountStarfield(containerRef.current, { spoons });
    return () => {
      sfRef.current?.destroy();
      sfRef.current = null;
    };
  }, []);

  // Spoon changes
  useEffect(() => {
    sfRef.current?.setSpoons(spoons);
  }, [spoons]);

  // Starfield config from store (reads via getState for perf — no re-render)
  useEffect(() => {
    const unsub = useStarfieldStore.subscribe((state) => {
      sfRef.current?.setConfig?.({
        count: state.starCount,
        speed: state.speed,
        connR: state.connRadius,
        tealGlowA: state.tealGlow,
        coralRatio: state.coralGlow,
        baseAlpha: state.baseAlpha,
        dimFactor: state.brightness,
        breathRate: state.twinkle ? 0.0008 : 0,
      } as any);
    });
    return unsub;
  }, []);

  return <div ref={containerRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
});
