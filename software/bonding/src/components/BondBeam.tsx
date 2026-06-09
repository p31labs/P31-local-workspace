// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// BondBeam — Living energy curves
//
// Not a rod. A flowing bezier curve that sways and
// breathes. Born in a bright flash, settles into a
// gentle oscillation. The midpoint drifts perpendicular
// to the bond axis — fluid, organic, alive.
//
// Uses drei Line (Line2) for resolution-independent
// width and smooth anti-aliasing. AdditiveBlending
// set imperatively on first frame.
//
// Surface clipping preserved — curves start/end
// at the glass shell surfaces.
// ═══════════════════════════════════════════════════════

import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { ElementSymbol } from '../types';
import { ELEMENTS } from '../data/elements';
import { useGameStore } from '../store/gameStore';

interface BondBeamProps {
  start: { x: number; y: number; z: number };
  end: { x: number; y: number; z: number };
  fromElement: ElementSymbol;
  toElement: ElementSymbol;
}

const SEGMENTS = 20;

export const BondBeam = memo(function BondBeam({ start, end, fromElement, toElement }: BondBeamProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineRef = useRef<any>(null);
  const birthTime = useRef<number | null>(null);
  const blendingSet = useRef(false);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const completionFlashRef = useRef<number | null>(null);

  const { surfaceFrom, surfaceTo, midpoint, perpendicular, color, phaseOffset, initialPoints } = useMemo(() => {
    const s = new THREE.Vector3(start.x, start.y, start.z);
    const e = new THREE.Vector3(end.x, end.y, end.z);
    const dir = e.clone().sub(s).normalize();

    const c1 = new THREE.Color(ELEMENTS[fromElement].emissive);
    const c2 = new THREE.Color(ELEMENTS[toElement].emissive);
    const blended = c1.lerp(c2, 0.5);

    // Surface clipping — bond starts/ends at shell surface
    const fromRadius = 0.5 * Math.min(0.65, ELEMENTS[fromElement].size);
    const toRadius = 0.5 * Math.min(0.65, ELEMENTS[toElement].size);
    const overlap = 0.05;
    const sf = s.clone().add(dir.clone().multiplyScalar(fromRadius - overlap));
    const st = e.clone().sub(dir.clone().multiplyScalar(toRadius - overlap));

    const mid = sf.clone().add(st).multiplyScalar(0.5);

    // Perpendicular vector for sway
    const up = Math.abs(dir.y) > 0.9
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0);
    const perp = new THREE.Vector3().crossVectors(dir, up).normalize();

    // Deterministic phase offset
    const phase = (start.x * 127.1 + start.y * 311.7 + end.x * 523.3) % (Math.PI * 2);

    // Initial points (straight line, overwritten in first frame)
    const pts = Array.from({ length: SEGMENTS + 1 }, (_, i) => {
      const t = i / SEGMENTS;
      return new THREE.Vector3().lerpVectors(sf, st, t);
    });

    return {
      surfaceFrom: sf,
      surfaceTo: st,
      midpoint: mid,
      perpendicular: perp,
      color: blended,
      phaseOffset: phase,
      initialPoints: pts,
    };
  }, [start.x, start.y, start.z, end.x, end.y, end.z, fromElement, toElement]);

  useFrame((state) => {
    if (!lineRef.current) return;
    const t = state.clock.elapsedTime;

    // Set additive blending once (imperative — drei doesn't expose it declaratively)
    if (!blendingSet.current && lineRef.current.material) {
      lineRef.current.material.blending = THREE.AdditiveBlending;
      lineRef.current.material.depthWrite = false;
      lineRef.current.material.toneMapped = false;
      blendingSet.current = true;
    }

    if (birthTime.current === null) {
      birthTime.current = t;
    }

    // Sway: midpoint drifts perpendicular to bond axis
    const sway = Math.sin(t * 1.5 + phaseOffset) * 0.08;
    const mx = midpoint.x + perpendicular.x * sway;
    const my = midpoint.y + perpendicular.y * sway;
    const mz = midpoint.z + perpendicular.z * sway;

    // Quadratic bezier: P0=surfaceFrom, P1=animated mid, P2=surfaceTo
    const positions: number[] = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const frac = i / SEGMENTS;
      const a = (1 - frac) * (1 - frac);
      const b = 2 * (1 - frac) * frac;
      const c = frac * frac;
      positions.push(
        a * surfaceFrom.x + b * mx + c * surfaceTo.x,
        a * surfaceFrom.y + b * my + c * surfaceTo.y,
        a * surfaceFrom.z + b * mz + c * surfaceTo.z,
      );
    }

    if (lineRef.current.geometry?.setPositions) {
      lineRef.current.geometry.setPositions(positions);
    }

    // Completion flash: bonds go white then settle back
    if (gamePhase === 'complete' && completionFlashRef.current === null) {
      completionFlashRef.current = t;
    }
    let completionBoost = 0;
    if (completionFlashRef.current !== null) {
      const cAge = t - completionFlashRef.current;
      if (cAge < 0.8) {
        completionBoost = 2.0 * (1 - cAge / 0.8);
      }
    }

    // Birth flash + idle pulse → modulate opacity
    const age = t - (birthTime.current ?? t);
    const flash = age < 0.8 ? 3.5 * (1 - age / 0.8) : 0;
    const pulse = 0.7 + Math.sin(t * 2.0) * 0.3;
    const intensity = Math.min(1, 0.4 * (pulse + flash + completionBoost));
    if (lineRef.current.material) {
      lineRef.current.material.opacity = intensity;
      // Width pulse on birth
      if (age < 0.6) {
        const widthT = age / 0.6;
        lineRef.current.material.linewidth = 2.5 + 1.5 * Math.sin(widthT * Math.PI);
      }
      // Completion white flash
      if (completionBoost > 0.1) {
        const whiteAmount = completionBoost / 2.0;
        const baseColor = color.clone();
        baseColor.lerp(new THREE.Color('#ffffff'), whiteAmount * 0.7);
        lineRef.current.material.color = baseColor;
      }
    }
  });

  return (
    <Line
      ref={lineRef}
      points={initialPoints}
      color={color}
      lineWidth={2.5}
      transparent
      opacity={0.7}
    />
  );
});
