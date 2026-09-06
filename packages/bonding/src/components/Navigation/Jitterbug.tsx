// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Navigation: Jitterbug Navigator (WCD-07)
//
// SVG-based geodesic menu. 12 vertices of a Cuboctahedron
// (Vector Equilibrium) contract to a Tetrahedron when
// spoons drop below 4. Zero WebGL draw calls.
//
// Spectroscopic palette:
//   Calcium    (SHELTER)     — #90ee90  Light Green
//   Phosphorus (TASKS)       — #ff4500  Orange-Red
//   Oxygen     (ENVIRONMENT) — #87ceeb  Sky Blue
//   Nitrogen   (CREATION)    — #9370db  Medium Purple
//
// Animation rhythm: 863ms CSS pulse (Larmor visual approx.)
// Rotation: 0.5 RPM Y-axis, φ = 35.26° isometric tilt
// ═══════════════════════════════════════════════════════

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEconomyStore } from '../../genesis/economyStore';
import { eventBus, GameEventType } from '../../genesis/eventBus';

// ── Types ──────────────────────────────────────────────

type Vec3 = [number, number, number];
type PodName = 'calcium' | 'phosphorus' | 'oxygen' | 'nitrogen';

interface Vertex {
  id: string;
  pod: PodName;
  /** Cuboctahedron position (high spoons / expanded). */
  start: Vec3;
  /** Tetrahedral cluster position (low spoons / collapsed). */
  end: Vec3;
}

interface Pod {
  name: PodName;
  label: string;
  color: string;
  href: string;
}

// ── Constants ──────────────────────────────────────────

/** Isometric "magic angle" X-tilt for visual depth. */
const PHI = 35.26 * (Math.PI / 180);
/** Y-axis auto-rotation: 0.3 RPM → slower, contemplative drift. */
const RAD_PER_SEC = (0.3 / 60) * 2 * Math.PI;

// ── Pod configuration ──────────────────────────────────

const PODS: Pod[] = [
  { name: 'calcium',    label: 'SHELTER',     color: '#FFFFFF', href: '#shelter'     },
  { name: 'phosphorus', label: 'TASKS',       color: '#B080FF', href: '#tasks'       },
  { name: 'oxygen',     label: 'ENVIRONMENT', color: '#FF3030', href: '#environment' },
  { name: 'nitrogen',   label: 'CREATION',    color: '#4488FF', href: '#creation'    },
];

const POD_MAP = Object.fromEntries(PODS.map(p => [p.name, p])) as Record<PodName, Pod>;

// ── Vertex data ────────────────────────────────────────
// start = cuboctahedron position (expanded, high spoons)
// end   = tetrahedral cluster    (collapsed, low spoons)

const VERTICES: Vertex[] = [
  { id: 'ca_1', pod: 'calcium',    start: [ 1,  1,  0], end: [ 1,  1,  1] },
  { id: 'ca_2', pod: 'calcium',    start: [ 1,  0,  1], end: [ 1,  1,  1] },
  { id: 'ca_3', pod: 'calcium',    start: [ 0,  1,  1], end: [ 1,  1,  1] },
  { id: 'p_1',  pod: 'phosphorus', start: [ 1, -1,  0], end: [ 1, -1, -1] },
  { id: 'p_2',  pod: 'phosphorus', start: [ 1,  0, -1], end: [ 1, -1, -1] },
  { id: 'p_3',  pod: 'phosphorus', start: [ 0, -1, -1], end: [ 1, -1, -1] },
  { id: 'o_1',  pod: 'oxygen',     start: [-1,  1,  0], end: [-1,  1, -1] },
  { id: 'o_2',  pod: 'oxygen',     start: [-1,  0, -1], end: [-1,  1, -1] },
  { id: 'o_3',  pod: 'oxygen',     start: [ 0,  1, -1], end: [-1,  1, -1] },
  { id: 'n_1',  pod: 'nitrogen',   start: [-1, -1,  0], end: [-1, -1,  1] },
  { id: 'n_2',  pod: 'nitrogen',   start: [-1,  0,  1], end: [-1, -1,  1] },
  { id: 'n_3',  pod: 'nitrogen',   start: [ 0, -1,  1], end: [-1, -1,  1] },
];

// ── Edges (cuboctahedron adjacency, distance = √2) ─────
// 24 edges verified by Euclidean distance check.

const EDGES: [number, number][] = [
  [0,1],[0,2],[0,4],[0,8],
  [1,2],[1,3],[1,11],
  [2,6],[2,10],
  [3,4],[3,5],[3,11],
  [4,5],[4,8],
  [5,7],[5,9],
  [6,7],[6,8],[6,10],
  [7,8],[7,9],
  [9,10],[9,11],
  [10,11],
];

// ── Math helpers ───────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/**
 * Orthographic projection with Y-axis rotation (θ) and
 * fixed X-axis tilt (φ = 35.26°, isometric magic angle).
 *
 *   u = (x·cosθ − z·sinθ) · scale
 *   v = (y·cosφ − (x·sinθ + z·cosθ)·sinφ) · scale
 */
function project([x, y, z]: Vec3, theta: number, scale = 1.4): [number, number] {
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const cosP = Math.cos(PHI);
  const sinP = Math.sin(PHI);
  const u = (x * cosT - z * sinT) * scale;
  const v = (y * cosP - (x * sinT + z * cosT) * sinP) * scale;
  return [u, -v]; // flip Y: SVG y-axis points down
}

// ── Component ──────────────────────────────────────────

export function JitterbugNavigator() {
  const spoons = useEconomyStore(s => s.spoons);

  // 0 = collapsed (tetrahedron, low spoons)
  // 1 = expanded  (cuboctahedron, high spoons)
  const targetFactor = Math.min(1, Math.max(0, (spoons - 4) / 8));

  const [theta, setTheta] = useState(0);
  const thetaRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const wasCollapsedRef = useRef(targetFactor < 0.5);

  // WCD-17: Responsive positioning — pull left and scale down on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-rotation loop (0.5 RPM)
  useEffect(() => {
    let raf: number;
    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const dt = (now - lastTimeRef.current) / 1000;
        thetaRef.current += RAD_PER_SEC * dt;
      }
      lastTimeRef.current = now;
      setTheta(thetaRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Haptic feedback on expansion ↔ collapse transition
  useEffect(() => {
    const isCollapsed = targetFactor < 0.5;
    if (isCollapsed !== wasCollapsedRef.current) {
      wasCollapsedRef.current = isCollapsed;
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(20);
      }
    }
  }, [targetFactor]);

  const handleSelect = useCallback((v: Vertex, e: React.MouseEvent) => {
    e.preventDefault();
    const pod = POD_MAP[v.pod];
    eventBus.emit(GameEventType.NAV_SELECT, {
      pod: v.pod,
      label: pod.label,
      href: pod.href,
      vertexId: v.id,
    });
  }, []);

  const isCollapsed = targetFactor < 0.5;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '9rem',
        right: isMobile ? '1.5rem' : '0.75rem',
        width: isMobile ? 90 : 120,
        height: isMobile ? 90 : 120,
        zIndex: 50,
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes organic-breathe {
          0%, 100% { opacity: 0.12; }
          35%      { opacity: 0.30; }
          65%      { opacity: 0.22; }
        }
      `}</style>

      <svg
        viewBox="-2 -2 4 4"
        width={isMobile ? 90 : 120}
        height={isMobile ? 90 : 120}
        style={{ overflow: 'visible' }}
        aria-label="Jitterbug Navigator"
        role="navigation"
      >
        {/* Edges */}
        {EDGES.map(([ai, bi]) => {
          const va = VERTICES[ai];
          const vb = VERTICES[bi];
          const posA = lerpVec3(va.end, va.start, targetFactor);
          const posB = lerpVec3(vb.end, vb.start, targetFactor);
          const [ax, ay] = project(posA, theta);
          const [bx, by] = project(posB, theta);
          const color = POD_MAP[va.pod].color;
          return (
            <line
              key={`${va.id}:${vb.id}`}
              x1={ax} y1={ay}
              x2={bx} y2={by}
              stroke={color}
              strokeWidth={0.025}
              opacity={0.25}
              style={{
                animation: `organic-breathe 6s ease-in-out infinite`,
                animationDelay: `${((ai * 71) % 6000) / 1000}s`,
              }}
            />
          );
        })}

        {/* Vertices — each is an SVG <a> wrapping a <circle> */}
        {VERTICES.map((v) => {
          const pos = lerpVec3(v.end, v.start, targetFactor);
          const [px, py] = project(pos, theta);
          const pod = POD_MAP[v.pod];
          return (
            <a
              key={v.id}
              href={pod.href}
              onClick={(e) => handleSelect(v, e)}
              aria-label={`${pod.label} — ${v.id}`}
              style={{ cursor: 'pointer', pointerEvents: 'auto' }}
            >
              <circle
                cx={px} cy={py}
                r={0.06}
                fill={pod.color}
                fillOpacity={0.4}
              />
            </a>
          );
        })}

        {/* Pod labels — fade in only when collapsed (tetrahedron state) */}
        {PODS.map((pod) => {
          const podVerts = VERTICES.filter(v => v.pod === pod.name);
          // All three verts in a pod converge to the same end position
          const endPos = podVerts[0].end as Vec3;
          const [lx, ly] = project(endPos, theta);
          return (
            <text
              key={pod.name}
              x={lx}
              y={ly + 0.22}
              textAnchor="middle"
              fontSize={0.12}
              fill={pod.color}
              opacity={isCollapsed ? 0.5 : 0}
              style={{
                transition: 'opacity 0.4s ease',
                pointerEvents: 'none',
                fontFamily: 'monospace',
                fontWeight: 'bold',
              }}
            >
              {pod.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
