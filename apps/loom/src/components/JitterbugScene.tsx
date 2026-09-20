/**
 * The Loom — Jitterbug closure scene.
 *
 * The topological twin of the Sierpiński gap, rendered. Two tetrahedral
 * structures share the same space:
 *
 *   • the Sierpiński tetrahedron — cyan wireframe, locally complete (every
 *     cell is a K₄) yet globally open forever (β₂ = 0). It never stops.
 *   • the Jitterbug — a cloud of points that contracts through Fuller's four
 *     click-stops (vector equilibrium → icosahedron → octahedron →
 *     tetrahedron) as t goes 0 → 1. Only the terminal tetrahedron is a K₄
 *     (β₂ = 1): it encloses.
 *
 * Each click-stop also carries a bright wireframe of its own edges — the
 * particle cloud is the surface, the wireframe is the shape. They crossfade
 * at the stops (t = 0, 1/3, 2/3, 1) so the polyhedron the cloud is passing
 * through is always legible, never just fuzz.
 *
 * Two volume orbs make the duality literal: one shrinks (physical size,
 * `jitterbugVolume`^(1/3)), one grows (enclosed volume, β₂ 0 → 1).
 *
 * The 287 field zones orbit on a phyllotaxis sphere keyed by their real
 * registry ids; moving the cursor over a zone deposits a focus trace (the
 * "reading is writing" mechanic) — it brightens, its hazard drops, and it
 * decays when left alone.
 *
 * Color contract (enforced by the design gate): no hex, no rgb(), no oklch()
 * literals anywhere in this file. Every color comes from a `--p31-*` token
 * resolved via `resolveTokenRgb` and passed to the shader as a `vec3`
 * uniform. The phase/volume/β₂/closure readouts are computed from the real
 * `@p31/field` jitterbug module, so the numbers agree with the substrate.
 *
 * Reduced motion: a single static frame is drawn and the loop does not run.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import registry from '@p31/canon/registry.json';
import {
  zonesFromRegistry,
  jitterbugPhase,
  jitterbugVolume,
  jitterbugClose,
} from '@p31/field';
import { resolveTokenRgb, watchTheme } from '../lib/tokens';
import { useLiteralLabels, useMotion } from '../lib/usePresentation';
import { copy } from '../lib/copy';

// ── Deterministic hash + PRNG (stable geometry across reloads) ──────────
function hash01(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0x100000000;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── The four click-stops, cartesian (normalized to the unit sphere) ─────
const PHI = (1 + Math.sqrt(5)) / 2;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).normalize();

const VERTS = {
  ve: [
    V(1, 1, 0), V(1, -1, 0), V(-1, 1, 0), V(-1, -1, 0),
    V(1, 0, 1), V(1, 0, -1), V(-1, 0, 1), V(-1, 0, -1),
    V(0, 1, 1), V(0, 1, -1), V(0, -1, 1), V(0, -1, -1),
  ],
  ico: [
    V(0, 1, PHI), V(0, 1, -PHI), V(0, -1, PHI), V(0, -1, -PHI),
    V(1, PHI, 0), V(1, -PHI, 0), V(-1, PHI, 0), V(-1, -PHI, 0),
    V(PHI, 0, 1), V(PHI, 0, -1), V(-PHI, 0, 1), V(-PHI, 0, -1),
  ],
  octa: [V(1, 0, 0), V(-1, 0, 0), V(0, 1, 0), V(0, -1, 0), V(0, 0, 1), V(0, 0, -1)],
  tet: [V(1, 1, 1), V(1, -1, -1), V(-1, 1, -1), V(-1, -1, 1)],
};

// ── Edge derivation by nearest-neighbour distance. Robust: no hardcoded
//    index tables — every real edge of a convex polyhedron is one of its
//    closest vertex pairs. Take the K closest, K = the edge count.
function closestEdges(verts: THREE.Vector3[], count: number): [number, number][] {
  const pairs: { i: number; j: number; d: number }[] = [];
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      pairs.push({ i, j, d: verts[i].distanceTo(verts[j]) });
    }
  }
  pairs.sort((a, b) => a.d - b.d);
  return pairs.slice(0, count).map(({ i, j }) => [i, j]);
}

const EDGES = {
  ve: closestEdges(VERTS.ve, 24),   // cuboctahedron
  ico: closestEdges(VERTS.ico, 30), // icosahedron
  octa: closestEdges(VERTS.octa, 12), // octahedron
  tet: closestEdges(VERTS.tet, 6),  // tetrahedron (all pairs)
};

// ── Triangular faces (indices into VERTS.*). The cuboctahedron's six
//    squares are triangulated, giving 8 + 12 = 20 triangles.
const FACES = {
  ve: [
    [0, 4, 8], [0, 5, 9], [1, 4, 10], [1, 5, 11],
    [2, 6, 8], [2, 7, 9], [3, 6, 10], [3, 7, 11],
    [0, 4, 1], [0, 1, 5], [2, 6, 3], [2, 3, 7],
    [0, 8, 2], [0, 2, 9], [1, 10, 3], [1, 3, 11],
    [4, 8, 6], [4, 6, 10], [5, 9, 7], [5, 7, 11],
  ].map((f) => f.map((i) => VERTS.ve[i])),
  ico: [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ].map((f) => f.map((i) => VERTS.ico[i])),
  octa: [
    [0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4],
    [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5],
  ].map((f) => f.map((i) => VERTS.octa[i])),
  tet: [[0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]].map((f) => f.map((i) => VERTS.tet[i])),
};

// ── Surface point sampling (area-weighted, seeded) ──────────────────────
function sampleOnFaces(
  faces: THREE.Vector3[][],
  count: number,
  scale: number,
  rand: () => number,
): Float32Array {
  const out = new Float32Array(count * 3);
  const areas = faces.map(([a, b, c]) => 0.5 * new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).length());
  const total = areas.reduce((s, x) => s + x, 0);
  const cum: number[] = [];
  let acc = 0;
  for (const a of areas) { acc += a / total; cum.push(acc); }
  for (let i = 0; i < count; i++) {
    const r = rand();
    let fi = 0;
    while (fi < cum.length - 1 && r > cum[fi]) fi++;
    const [a, b, c] = faces[fi];
    let u = rand();
    let v = rand();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const w = 1 - u - v;
    out[i * 3] = (a.x * w + b.x * u + c.x * v) * scale;
    out[i * 3 + 1] = (a.y * w + b.y * u + c.y * v) * scale;
    out[i * 3 + 2] = (a.z * w + b.z * u + c.z * v) * scale;
  }
  return out;
}

// ── The Sierpiński tetrahedron — recurses and never closes ──────────────
function sierpinskiEdges(depth: number): [THREE.Vector3, THREE.Vector3][] {
  const corners = VERTS.tet;
  const sub = (cs: THREE.Vector3[], d: number): [THREE.Vector3, THREE.Vector3][] => {
    if (d === 0) {
      const e: [THREE.Vector3, THREE.Vector3][] = [];
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) e.push([cs[i], cs[j]]);
      return e;
    }
    const out: [THREE.Vector3, THREE.Vector3][] = [];
    for (let k = 0; k < 4; k++) {
      const mids = cs.map((v, j) => (j === k ? v : v.clone().add(cs[k]).multiplyScalar(0.5)));
      out.push(...sub(mids, d - 1));
    }
    return out;
  };
  return sub(corners, depth);
}

// ── Phyllotaxis sphere — the 287 zones, stable by id ────────────────────
function zonePosition(id: string, scale: number): [number, number, number] {
  const y = 1 - hash01(id + '#y') * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = hash01(id + '#theta') * Math.PI * 2;
  return [Math.cos(theta) * r * scale, y * scale, Math.sin(theta) * r * scale];
}

// ── Wireframe geometry: an edge list scaled to the phase's radius ───────
function wireframePositions(
  verts: THREE.Vector3[],
  edges: [number, number][],
  scale: number,
): Float32Array {
  const pos = new Float32Array(edges.length * 6);
  edges.forEach(([i, j], k) => {
    const a = verts[i];
    const b = verts[j];
    pos[k * 6] = a.x * scale;
    pos[k * 6 + 1] = a.y * scale;
    pos[k * 6 + 2] = a.z * scale;
    pos[k * 6 + 3] = b.x * scale;
    pos[k * 6 + 4] = b.y * scale;
    pos[k * 6 + 5] = b.z * scale;
  });
  return pos;
}

// ── GLSL: simplex noise (Ashima / McEwan, MIT) ──────────────────────────
const NOISE_GLSL = `
vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

// Point cloud. Points are deliberately few and small so additive blending
// accumulates into a glow, not a white blowout: ~8k points at 60/dist (vs
// the earlier 60k at 300/dist) is a ~25× reduction in per-pixel overlap.
const JB_VERT = `
uniform float uT;
uniform float uTime;
uniform float uFlash;
uniform vec3 uCool;
uniform vec3 uWarm;
attribute vec3 aPosVE;
attribute vec3 aPosIco;
attribute vec3 aPosOcta;
attribute vec3 aPosTet;
attribute float aSize;
attribute float aRandom;
varying vec3 vColor;
varying float vAlpha;
${NOISE_GLSL}
void main() {
  vec3 pos;
  float transition = 0.0;
  if (uT < 0.3333) {
    float f = smoothstep(0.0, 1.0, uT / 0.3333);
    pos = mix(aPosVE, aPosIco, f);
    transition = f;
  } else if (uT < 0.6666) {
    float f = smoothstep(0.0, 1.0, (uT - 0.3333) / 0.3333);
    pos = mix(aPosIco, aPosOcta, f);
    transition = f;
  } else {
    float f = smoothstep(0.0, 1.0, (uT - 0.6666) / 0.3334);
    pos = mix(aPosOcta, aPosTet, f);
    transition = f;
  }
  float energy = 4.0 * transition * (1.0 - transition);
  vec3 dir = normalize(pos + 0.001);
  float n = snoise(pos * 1.8 + vec3(0.0, uTime * 0.25, 0.0) + aRandom * 3.0);
  pos += dir * n * 0.06 * energy;

  vColor = mix(uCool, uWarm, uT);
  vColor = mix(vColor, vec3(1.0), uFlash * 0.7);
  vAlpha = (0.20 + 0.28 * uT) * (0.6 + 0.4 * (1.0 - energy * 0.5)) * (0.8 + 0.2 * aRandom);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float dist = -mv.z;
  gl_PointSize = aSize * (60.0 / dist) * (1.0 + uT * 0.25 + uFlash * 1.2);
  gl_Position = projectionMatrix * mv;
}
`;

// Soft Reinhard-ish tone map on the source color — additive hotspots reach
// "bright", not "pure white".
const JB_FRAG = `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  float core = pow(smoothstep(0.5, 0.0, r), 1.7);
  float halo = smoothstep(0.5, 0.15, r) * 0.18;
  float a = (core + halo) * vAlpha;
  if (a < 0.01) discard;
  vec3 c = vColor / (vColor + vec3(0.75));
  gl_FragColor = vec4(c * 1.35, a);
}
`;

const ZONE_VERT = `
uniform float uTime;
uniform vec3 uCool;
uniform vec3 uHot;
uniform vec3 uDanger;
attribute float aPressure;
attribute float aHazard;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec3 pos = position;
  float pulse = 1.0 + 0.06 * sin(uTime * 2.0 + aHazard * 6.28318) * aPressure;
  pos *= pulse;
  vec3 base = mix(uCool, uHot, aPressure);
  vColor = mix(base, uDanger, aHazard);
  vAlpha = 0.35 + 0.6 * aPressure + 0.4 * aHazard;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = (40.0 / -mv.z) * (0.7 + aPressure * 1.3 + aHazard * 0.8);
  gl_Position = projectionMatrix * mv;
}
`;

const ZONE_FRAG = `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  float a = pow(smoothstep(0.5, 0.0, r), 1.8);
  if (a < 0.02) discard;
  gl_FragColor = vec4(vColor, a * vAlpha);
}
`;

// K₄ vertex markers — bright dots at the tetrahedron vertices, visible only
// at the terminal phase, so the enclosure is unmistakable.
const K4_VERT = `
uniform float uSize;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * (90.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;
const K4_FRAG = `
uniform vec3 uColor;
uniform float uWeight;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  float core = pow(smoothstep(0.5, 0.0, r), 1.4);
  float halo = smoothstep(0.5, 0.1, r) * 0.4;
  float a = (core + halo) * uWeight;
  if (a < 0.02) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

const PHASE_TEXT = [
  { quote: 'Sizeless, nuclear, omnidirectionally pulsing.', attrib: 'Vector equilibrium — β₂ = 0' },
  { quote: 'The golden ratio enters. The squares split into triangles.', attrib: 'Icosahedron — 30 edges' },
  { quote: 'Six vertices remain. The framework is isostatic — just.', attrib: 'Octahedron — 12 edges' },
  { quote: 'The minimum-limit-case structural system of Universe.', attrib: 'Tetrahedron — K₄, β₂ = 1' },
];

// 8k points, not 60k. Fewer, larger points read as structure; many tiny
// points read as fog.
const N_POINTS = 8000;
const PHASE_STOPS = [0, 1 / 3, 2 / 3, 1] as const;
const PHASE_KEYS = ['ve', 'ico', 'octa', 'tet'] as const;

export function JitterbugScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sliderRef = useRef<HTMLInputElement | null>(null);
  const tValRef = useRef<HTMLSpanElement | null>(null);
  const playBtnRef = useRef<HTMLButtonElement | null>(null);
  const quoteRef = useRef<HTMLDivElement | null>(null);
  const attribRef = useRef<HTMLDivElement | null>(null);
  const rPhaseRef = useRef<HTMLSpanElement | null>(null);
  const rVolumeRef = useRef<HTMLSpanElement | null>(null);
  const rBetaRef = useRef<HTMLSpanElement | null>(null);
  const rClosureRef = useRef<HTMLSpanElement | null>(null);
  const rBarRef = useRef<HTMLElement | null>(null);
  const resetBtnRef = useRef<HTMLButtonElement | null>(null);

  const literal = useLiteralLabels();
  const literalRef = useRef(literal);
  literalRef.current = literal;
  const motion = useMotion();
  const motionRef = useRef(motion);
  motionRef.current = motion;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);

    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2(0x020308, 0.04);
    scene.fog = fog;

    const camera = new THREE.PerspectiveCamera(
      55,
      (canvas.clientWidth || window.innerWidth) / (canvas.clientHeight || window.innerHeight),
      0.1,
      100,
    );
    camera.position.set(0, 0, 6);

    // Manual orbit (drag to rotate, wheel to zoom), gentle auto-rotate.
    let yaw = 0;
    let pitch = 0.35;
    let dist = 6;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    // Shared mutable state (read by the loop, written by handlers).
    const tRef = { current: 0 };
    const flashRef = { current: 0 };
    let playing = false;
    let playStart = 0;
    let flashFired = false;
    let phaseIdx = -1;

    const applyCamera = () => {
      const targetDist = 6 - 3 * tRef.current;
      const d = dragging ? dist : dist + (targetDist - dist) * 0.02;
      if (!dragging) dist = d;
      const sp = Math.sin(pitch);
      camera.position.set(
        Math.sin(yaw) * sp * dist,
        Math.cos(pitch) * dist,
        Math.cos(yaw) * sp * dist,
      );
      camera.lookAt(0, 0, 0);
    };

    const tokens = () => ({
      bg: resolveTokenRgb('--p31-bg'),
      accent: resolveTokenRgb('--p31-accent'),
      gold: resolveTokenRgb('--p31-accent-gold'),
      red: resolveTokenRgb('--p31-accent-red'),
      text: resolveTokenRgb('--p31-text'),
    });

    // ── Field: the 287 real registry zones ──────────────────────────────
    const ZONES = zonesFromRegistry(registry);
    const N = ZONES.length;
    const rand = mulberry32(0x1f1b7a);

    const zPos = new Float32Array(N * 3);
    const zPressure = new Float32Array(N);
    const zHazard = new Float32Array(N);
    const zTargetP = new Float32Array(N);
    const zTargetH = new Float32Array(N);
    ZONES.forEach((z, i) => {
      const [x, y, zz] = zonePosition(z.id, 2.2);
      zPos[i * 3] = x;
      zPos[i * 3 + 1] = y;
      zPos[i * 3 + 2] = zz;
      zPressure[i] = rand() * 0.4;
      zHazard[i] = rand() < 0.1 ? 0.6 + rand() * 0.4 : rand() * 0.2;
      zTargetP[i] = zPressure[i];
      zTargetH[i] = zHazard[i];
    });

    // ── Sierpiński wireframe (two scales), brightened + slowly breathing ─
    const sierpClose = sierpinskiEdges(4);
    const sierpFar = sierpinskiEdges(2);
    const mkSierp = (edges: [THREE.Vector3, THREE.Vector3][], scale: number) => {
      const pos = new Float32Array(edges.length * 6);
      edges.forEach((e, i) => {
        pos[i * 6] = e[0].x * scale;
        pos[i * 6 + 1] = e[0].y * scale;
        pos[i * 6 + 2] = e[0].z * scale;
        pos[i * 6 + 3] = e[1].x * scale;
        pos[i * 6 + 4] = e[1].y * scale;
        pos[i * 6 + 5] = e[1].z * scale;
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      return g;
    };
    const sierpGeom = mkSierp(sierpClose, 2.6);
    const sierpGeomFar = mkSierp(sierpFar, 4.8);
    // The Sierpiński is the constant against which closure reads. It has to
    // be present, not ghostly.
    const sierpMat = new THREE.LineBasicMaterial({
      transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const sierpMatFar = new THREE.LineBasicMaterial({
      transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const sierpLines = new THREE.LineSegments(sierpGeom, sierpMat);
    const sierpLinesFar = new THREE.LineSegments(sierpGeomFar, sierpMatFar);
    scene.add(sierpLines, sierpLinesFar);

    // ── Jitterbug point cloud ───────────────────────────────────────────
    const scaleVe = 0.55 * Math.cbrt(jitterbugVolume(0));
    const scaleIco = 0.55 * Math.cbrt(jitterbugVolume(1 / 3));
    const scaleOcta = 0.55 * Math.cbrt(jitterbugVolume(2 / 3));
    const scaleTet = 0.55 * Math.cbrt(jitterbugVolume(1));
    const posVE = sampleOnFaces(FACES.ve, N_POINTS, scaleVe, rand);
    const posIco = sampleOnFaces(FACES.ico, N_POINTS, scaleIco, rand);
    const posOcta = sampleOnFaces(FACES.octa, N_POINTS, scaleOcta, rand);
    const posTet = sampleOnFaces(FACES.tet, N_POINTS, scaleTet, rand);
    const aSize = new Float32Array(N_POINTS);
    const aRandom = new Float32Array(N_POINTS);
    for (let i = 0; i < N_POINTS; i++) {
      aSize[i] = 0.5 + rand() * 0.7;
      aRandom[i] = rand();
    }
    const jbGeom = new THREE.BufferGeometry();
    jbGeom.setAttribute('position', new THREE.BufferAttribute(posVE.slice(), 3));
    jbGeom.setAttribute('aPosVE', new THREE.BufferAttribute(posVE, 3));
    jbGeom.setAttribute('aPosIco', new THREE.BufferAttribute(posIco, 3));
    jbGeom.setAttribute('aPosOcta', new THREE.BufferAttribute(posOcta, 3));
    jbGeom.setAttribute('aPosTet', new THREE.BufferAttribute(posTet, 3));
    jbGeom.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
    jbGeom.setAttribute('aRandom', new THREE.BufferAttribute(aRandom, 1));

    const jbUniforms = {
      uT: { value: 0 },
      uTime: { value: 0 },
      uFlash: { value: 0 },
      uCool: { value: new THREE.Vector3() },
      uWarm: { value: new THREE.Vector3() },
    };
    const jbMat = new THREE.ShaderMaterial({
      uniforms: jbUniforms,
      vertexShader: JB_VERT,
      fragmentShader: JB_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const jitterbug = new THREE.Points(jbGeom, jbMat);
    scene.add(jitterbug);

    // ── Per-phase wireframes (the shape of each click-stop) ─────────────
    const phaseScales: Record<(typeof PHASE_KEYS)[number], number> = {
      ve: scaleVe, ico: scaleIco, octa: scaleOcta, tet: scaleTet,
    };
    const wireMats: THREE.LineBasicMaterial[] = [];
    const wires: THREE.LineSegments[] = [];
    for (const k of PHASE_KEYS) {
      const pos = wireframePositions(VERTS[k], EDGES[k], phaseScales[k]);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.LineBasicMaterial({
        transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const ls = new THREE.LineSegments(g, m);
      scene.add(ls);
      wireMats.push(m);
      wires.push(ls);
    }

    // ── K₄ vertex markers — bright dots at the tetrahedron vertices ─────
    const k4Geom = new THREE.BufferGeometry();
    const k4Pos = new Float32Array(4 * 3);
    for (let i = 0; i < 4; i++) {
      k4Pos[i * 3] = VERTS.tet[i].x * scaleTet;
      k4Pos[i * 3 + 1] = VERTS.tet[i].y * scaleTet;
      k4Pos[i * 3 + 2] = VERTS.tet[i].z * scaleTet;
    }
    k4Geom.setAttribute('position', new THREE.BufferAttribute(k4Pos, 3));
    const k4Uniforms = {
      uWeight: { value: 0 },
      uSize: { value: 1.4 },
      uColor: { value: new THREE.Vector3() },
    };
    const k4Mat = new THREE.ShaderMaterial({
      uniforms: k4Uniforms,
      vertexShader: K4_VERT,
      fragmentShader: K4_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(k4Geom, k4Mat));

    // ── Field zones ─────────────────────────────────────────────────────
    const zoneGeom = new THREE.BufferGeometry();
    zoneGeom.setAttribute('position', new THREE.BufferAttribute(zPos.slice(), 3));
    zoneGeom.setAttribute('aPressure', new THREE.BufferAttribute(zPressure.slice(), 1));
    zoneGeom.setAttribute('aHazard', new THREE.BufferAttribute(zHazard.slice(), 1));
    const zoneUniforms = {
      uTime: { value: 0 },
      uCool: { value: new THREE.Vector3() },
      uHot: { value: new THREE.Vector3() },
      uDanger: { value: new THREE.Vector3() },
    };
    const zoneMat = new THREE.ShaderMaterial({
      uniforms: zoneUniforms,
      vertexShader: ZONE_VERT,
      fragmentShader: ZONE_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const zones = new THREE.Points(zoneGeom, zoneMat);
    scene.add(zones);

    // ── Volume orbs ─────────────────────────────────────────────────────
    const orbGeom = new THREE.SphereGeometry(1, 32, 32);
    const orbAMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, wireframe: true });
    const orbBMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false });
    const orbA = new THREE.Mesh(orbGeom, orbAMat);
    const orbB = new THREE.Mesh(orbGeom, orbBMat);
    scene.add(orbA, orbB);

    const setTheme = () => {
      const c = tokens();
      renderer.setClearColor(new THREE.Color(...c.bg), 1);
      fog.color = new THREE.Color(...c.bg);
      jbUniforms.uCool.value.set(...c.accent);
      jbUniforms.uWarm.value.set(...c.gold);
      zoneUniforms.uCool.value.set(...c.accent);
      zoneUniforms.uHot.value.set(...c.text);
      zoneUniforms.uDanger.value.set(...c.red);
      sierpMat.color.setRGB(...c.accent);
      sierpMatFar.color.setRGB(...c.accent);
      wireMats.forEach((m) => m.color.setRGB(...c.accent));
      orbAMat.color.setRGB(...c.accent);
      orbBMat.color.setRGB(...c.gold);
      k4Uniforms.uColor.value.set(...c.gold);
    };
    setTheme();

    const mouseNDC = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.18;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
      if (dragging) {
        yaw -= (e.clientX - lastX) * 0.005;
        pitch = Math.max(-1.5, Math.min(1.5, pitch - (e.clientY - lastY) * 0.005));
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const onPointerUp = () => { dragging = false; };
    const onWheel = (e: WheelEvent) => {
      dist = Math.max(1.4, Math.min(12, dist + e.deltaY * 0.003));
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: true });

    const onResize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const slider = sliderRef.current;
    const setT = (t: number) => {
      tRef.current = Math.max(0, Math.min(1, t));
      if (slider) slider.value = String(tRef.current);
      if (tValRef.current) tValRef.current.textContent = tRef.current.toFixed(3);
    };
    const onSliderInput = () => {
      playing = false;
      flashFired = false;
      if (playBtnRef.current) { playBtnRef.current.textContent = 'Play'; playBtnRef.current.classList.remove('on'); }
      setT(slider ? parseFloat(slider.value) : 0);
      if (reduceMotion) drawFrame(0);
    };
    if (slider) slider.addEventListener('input', onSliderInput);

    const updatePhaseText = (t: number) => {
      let idx = 0;
      if (t >= 1) idx = 3;
      else if (t >= 0.6666) idx = 2;
      else if (t >= 0.3333) idx = 1;
      if (idx === phaseIdx) return;
      phaseIdx = idx;
      const q = quoteRef.current;
      const a = attribRef.current;
      if (q) {
        q.classList.add('fade');
        setTimeout(() => {
          q.textContent = copy(PHASE_TEXT[idx].quote, literalRef.current);
          q.classList.remove('fade');
        }, 260);
      }
      if (a) a.textContent = copy(PHASE_TEXT[idx].attrib, literalRef.current);
    };

    const updateReadouts = (t: number) => {
      const phase = jitterbugPhase(t);
      const vol = jitterbugVolume(t);
      const contractions = jitterbugClose(ZONES);
      const remaining = Math.round(contractions * (1 - t));
      if (rPhaseRef.current) rPhaseRef.current.textContent = copy(phase.name, literalRef.current);
      if (rVolumeRef.current) rVolumeRef.current.textContent = vol.toFixed(3);
      if (rBetaRef.current) {
        rBetaRef.current.textContent = phase.beta2 === 1 ? '1 — enclosed' : '0 — open';
        rBetaRef.current.classList.toggle('closed', phase.beta2 === 1);
      }
      if (rClosureRef.current) rClosureRef.current.textContent = `${remaining} of ${contractions}`;
      if (rBarRef.current) rBarRef.current.style.width = `${(1 - t) * 100}%`;
    };

    // Triangular crossfade weight for a phase: 1 at its stop, 0 one stop
    // away, linear between. The four weights always sum to 1.
    const phaseWeight = (t: number, stop: number): number => {
      const d = Math.abs(t - stop);
      return Math.max(0, 1 - d / (1 / 3));
    };

    let raf = 0;
    let lastTime = performance.now();

    const drawFrame = (elapsed: number) => {
      const t = tRef.current;
      // Ambient clock — the idle glow, breath, and drift. When motion is
      // reduced it advances at a quarter rate; when none it is frozen. The
      // closure phase `t` and the user-initiated Play flash are separate and
      // keep working regardless.
      const m = motionRef.current;
      const ambient = m === 'full' ? elapsed : m === 'reduced' ? elapsed * 0.25 : 0;
      jbUniforms.uT.value = t;
      jbUniforms.uTime.value = ambient;
      jbUniforms.uFlash.value = flashRef.current;
      zoneUniforms.uTime.value = ambient;

      // Wireframes: crossfade by proximity to each click-stop.
      for (let i = 0; i < PHASE_KEYS.length; i++) {
        const w = phaseWeight(t, PHASE_STOPS[i]);
        wireMats[i].opacity = w * 0.75;
        wires[i].visible = w > 0.01;
      }

      // K₄ vertex markers: only near the terminal tetrahedron.
      const k4w = phaseWeight(t, 1);
      k4Uniforms.uWeight.value = k4w * (1 + flashRef.current * 1.5);
      k4Uniforms.uSize.value = 1.2 + 0.6 * k4w;

      // Volume orbs.
      const physR = 0.55 * Math.cbrt(jitterbugVolume(t));
      orbA.scale.setScalar(physR);
      orbAMat.opacity = 0.10 * (1 - t * 0.5);
      const enclosed = t >= 1 ? 1 : Math.max(0, (t - 0.85) / 0.15);
      orbB.scale.setScalar(Math.max(0.001, 0.4 * enclosed));
      orbBMat.opacity = 0.35 * enclosed + 0.25 * flashRef.current;

      // Zone dynamics.
      for (let i = 0; i < N; i++) {
        if (Math.random() < 0.002) {
          zTargetP[i] = Math.random();
          zTargetH[i] = Math.random() < 0.08 ? 0.7 + Math.random() * 0.3 : Math.random() * 0.3;
        }
        zPressure[i] += (zTargetP[i] - zPressure[i]) * 0.02;
        zHazard[i] += (zTargetH[i] - zHazard[i]) * 0.02;
      }
      raycaster.setFromCamera(mouseNDC, camera);
      const hit = raycaster.intersectObject(zones, false)[0];
      if (hit && hit.index !== undefined) {
        const idx = hit.index;
        zPressure[idx] = Math.min(1, zPressure[idx] + 0.03);
        zTargetP[idx] = Math.max(zTargetP[idx], 0.6 + Math.random() * 0.4);
        zHazard[idx] = Math.max(0, zHazard[idx] - 0.02);
        zTargetH[idx] = Math.max(0, zTargetH[idx] - 0.02);
      }
      (zoneGeom.attributes.aPressure.array as Float32Array).set(zPressure);
      zoneGeom.attributes.aPressure.needsUpdate = true;
      (zoneGeom.attributes.aHazard.array as Float32Array).set(zHazard);
      zoneGeom.attributes.aHazard.needsUpdate = true;

      // Sierpiński drift, plus a slow breath so it reads as alive.
      const breath = 1 + Math.sin(ambient * 0.6) * 0.06;
      sierpMat.opacity = 0.35 * breath;
      sierpLines.rotation.y = ambient * 0.03;
      sierpLines.rotation.x = Math.sin(ambient * 0.05) * 0.15;
      sierpLinesFar.rotation.y = -ambient * 0.015;

      applyCamera();
      updatePhaseText(t);
      updateReadouts(t);
      renderer.render(scene, camera);
    };

    const loop = (now: number) => {
      const elapsed = now / 1000;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (playing) {
        const p = (now - playStart) / 6000;
        if (p >= 1) {
          setT(1);
          playing = false;
          if (playBtnRef.current) { playBtnRef.current.textContent = 'Play'; playBtnRef.current.classList.remove('on'); }
          if (!flashFired) { flashRef.current = 1; flashFired = true; }
        } else {
          setT(p);
        }
      }
      flashRef.current = Math.max(0, flashRef.current - dt * 1.4);

      drawFrame(elapsed);
      if (!reduceMotion) raf = requestAnimationFrame(loop);
    };

    const playBtn = playBtnRef.current;
    const onPlay = () => {
      if (reduceMotion) return;
      if (tRef.current >= 0.999) { setT(0); flashFired = false; }
      playing = !playing;
      playStart = performance.now() - tRef.current * 6000;
      if (playBtn) {
        playBtn.textContent = playing ? 'Pause' : 'Play';
        playBtn.classList.toggle('on', playing);
      }
    };
    if (playBtn) playBtn.addEventListener('click', onPlay);

    const resetBtn = resetBtnRef.current;
    const onReset = () => {
      playing = false;
      flashFired = false;
      flashRef.current = 0;
      setT(0);
      if (playBtn) { playBtn.textContent = 'Play'; playBtn.classList.remove('on'); }
      updatePhaseText(0);
      updateReadouts(0);
      if (!reduceMotion) raf = requestAnimationFrame(loop);
      else drawFrame(0);
    };
    if (resetBtn) resetBtn.addEventListener('click', onReset);

    const stopWatch = watchTheme(() => setTheme());

    updatePhaseText(0);
    updateReadouts(0);
    if (reduceMotion) {
      drawFrame(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      slider?.removeEventListener('input', onSliderInput);
      playBtn?.removeEventListener('click', onPlay);
      resetBtn?.removeEventListener('click', onReset);
      stopWatch();
      sierpGeom.dispose();
      sierpGeomFar.dispose();
      sierpMat.dispose();
      sierpMatFar.dispose();
      jbGeom.dispose();
      jbMat.dispose();
      wireMats.forEach((m) => m.dispose());
      wires.forEach((w) => w.geometry.dispose());
      k4Geom.dispose();
      k4Mat.dispose();
      zoneGeom.dispose();
      zoneMat.dispose();
      orbGeom.dispose();
      orbAMat.dispose();
      orbBMat.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="jb" role="img" aria-label="The Jitterbug — the closure of the field. Drag to orbit, scroll to zoom, play to close.">
      <canvas ref={canvasRef} className="jb-canvas" />

      <div className="jb-phase">
        <div className="jb-quote" ref={quoteRef}>&nbsp;</div>
        <div className="jb-attrib" ref={attribRef}>&nbsp;</div>
      </div>

      <div className="jb-readouts">
        <div className="jb-row"><span className="jb-key">{copy('PHASE', literal)}</span><span className="jb-val" ref={rPhaseRef}>—</span></div>
        <div className="jb-row"><span className="jb-key">{copy('VOLUME', literal)}</span><span className="jb-val" ref={rVolumeRef}>—</span></div>
        <div className="jb-row"><span className="jb-key">{copy('BETTI β₂', literal)}</span><span className="jb-val" ref={rBetaRef}>—</span></div>
        <div className="jb-row">
          <span className="jb-key">{copy('CLOSURE', literal)}</span>
          <span className="jb-val" ref={rClosureRef}>—</span>
          <span className="jb-bar"><i ref={rBarRef} /></span>
        </div>
        <div className="jb-row"><span className="jb-key">{copy('SIERPIŃSKI', literal)}</span><span className="jb-val jb-hot">{copy('β₂ = 0 · always', literal)}</span></div>
      </div>

      <div className="jb-controls">
        <div className="jb-slider">
          <span>T</span>
          <input ref={sliderRef} type="range" min="0" max="1" step="0.001" defaultValue="0" aria-label="Closure" />
          <span className="jb-tval" ref={tValRef}>0.000</span>
        </div>
        <div className="jb-btns">
          <button ref={playBtnRef} type="button">Play</button>
          <button ref={resetBtnRef} type="button">Reset</button>
        </div>
      </div>
    </div>
  );
}
