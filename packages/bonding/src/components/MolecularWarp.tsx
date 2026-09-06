// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// MolecularWarp: element-colored particle field + warp
//
// Replaces the generic starfield with chemistry-themed
// particles colored by element emissive values.
//
// Idle: slow drift of colored dots (the molecular field)
// Warp: 2.5s burst of WMP-style streaking element colors
//   triggered by double-tap on empty canvas
// ═══════════════════════════════════════════════════════

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ELEMENTS_ARRAY } from '../data/elements';
import { useGameStore } from '../store/gameStore';

const BASE_COUNT = 200;
const DEFAULT_COHERENCE = 6.5 / 12;
const TUNNEL_R = 8;
const TUNNEL_Z = 40;
const CAMERA_Z = 5;
const STREAK_REST = 0.03;
const STREAK_WARP = 2.5;
const SPEED_REST = 0.4;
const SPEED_WARP = 30;

// Element emissive colors — bright enough to pop against void
const PALETTE = ELEMENTS_ARRAY.map((el) => new THREE.Color(el.emissive));

interface Mote {
  a: number; // angle around tunnel
  r: number; // radius from center
  z: number; // depth position
  ci: number; // color index into PALETTE
  s: number; // individual speed multiplier
}

interface MolecularWarpProps {
  /** 0–1 from atmosphere motion budget (registry + AOD) */
  coherence?: number;
}

export function MolecularWarp({ coherence = DEFAULT_COHERENCE }: MolecularWarpProps) {
  const warpActive = useGameStore((s) => s.warpActive);
  const ref = useRef<THREE.LineSegments>(null);
  const phase = useRef(0);
  const c = Math.max(0.08, Math.min(1, coherence));

  const effectiveCount = useMemo(() => {
    const n = Math.round(BASE_COUNT * (0.45 + 0.55 * c));
    return Math.max(72, Math.min(280, n));
  }, [c]);

  const motes = useMemo<Mote[]>(
    () =>
      Array.from({ length: effectiveCount }, () => ({
        a: Math.random() * Math.PI * 2,
        r: 0.5 + Math.random() * TUNNEL_R,
        z: -Math.random() * TUNNEL_Z,
        ci: Math.floor(Math.random() * PALETTE.length),
        s: 0.7 + Math.random() * 0.6,
      })),
    [effectiveCount],
  );

  const geometry = useMemo(() => {
    const pos = new Float32Array(effectiveCount * 6);
    const col = new Float32Array(effectiveCount * 6);
    for (let i = 0; i < effectiveCount; i++) {
      const m = motes[i];
      const x = Math.cos(m.a) * m.r;
      const y = Math.sin(m.a) * m.r;
      const c = PALETTE[m.ci];
      pos[i * 6] = x;
      pos[i * 6 + 1] = y;
      pos[i * 6 + 2] = m.z;
      pos[i * 6 + 3] = x;
      pos[i * 6 + 4] = y;
      pos[i * 6 + 5] = m.z - STREAK_REST;
      col[i * 6] = c.r;
      col[i * 6 + 1] = c.g;
      col[i * 6 + 2] = c.b;
      col[i * 6 + 3] = c.r;
      col[i * 6 + 4] = c.g;
      col[i * 6 + 5] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  }, [motes, effectiveCount]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const geo = ref.current.geometry;
    const pos = (geo.getAttribute('position') as THREE.BufferAttribute)
      .array as Float32Array;
    const col = (geo.getAttribute('color') as THREE.BufferAttribute)
      .array as Float32Array;

    // Smooth intensity envelope
    if (warpActive) {
      phase.current = Math.min(phase.current + delta * 3, 1);
    } else {
      phase.current = Math.max(phase.current - delta * 2, 0);
    }

    const t = phase.current;
    const restMul = 0.35 + 0.65 * c;
    const speed = SPEED_REST * restMul + (SPEED_WARP - SPEED_REST * restMul) * t;
    const streak = STREAK_REST + (STREAK_WARP - STREAK_REST) * t;

    let colorDirty = false;
    const n = motes.length;

    for (let i = 0; i < n; i++) {
      const m = motes[i];
      m.z += speed * m.s * delta;

      // Recycle past camera
      if (m.z > CAMERA_Z + 2) {
        m.z = -TUNNEL_Z + Math.random() * 5;
        m.a = Math.random() * Math.PI * 2;
        m.r = 0.5 + Math.random() * TUNNEL_R;
        m.ci = Math.floor(Math.random() * PALETTE.length);
        const nc = PALETTE[m.ci];
        col[i * 6] = nc.r;
        col[i * 6 + 1] = nc.g;
        col[i * 6 + 2] = nc.b;
        col[i * 6 + 3] = nc.r;
        col[i * 6 + 4] = nc.g;
        col[i * 6 + 5] = nc.b;
        colorDirty = true;
      }

      const x = Math.cos(m.a) * m.r;
      const y = Math.sin(m.a) * m.r;
      pos[i * 6] = x;
      pos[i * 6 + 1] = y;
      pos[i * 6 + 2] = m.z;
      pos[i * 6 + 3] = x;
      pos[i * 6 + 4] = y;
      pos[i * 6 + 5] = m.z - streak;
    }

    (geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    if (colorDirty) {
      (geo.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <lineSegments ref={ref} geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.42 + 0.38 * c}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  );
}
