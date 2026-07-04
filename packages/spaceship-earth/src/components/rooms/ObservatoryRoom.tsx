// ObservatoryRoom.tsx — Geodesic Data Engine
// Full P31 graph plotted on inscribed tetrahedron inside geodesic shell
// Drop into: spaceship-earth/src/components/rooms/ObservatoryRoom.tsx

import { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
// GRAPH DATA
// [label, a, b, c, d, state, bus, notes?]
// Axes: a=Body b=Mesh c=Forge d=Shield
// ═══════════════════════════════════════════════════════════════

type VertexTuple = [string, number, number, number, number, string, string, string?];

const VERTICES: Record<string, VertexTuple> = {
  // ── BODY (vital, health, cognition) ──
  'med-calcitriol': ['Calcitriol', 4, 0, 0, 0, 'ongoing', 'vital', '12hr dose cycle'],
  'med-effexor': ['Effexor XR', 4, 0, 0, 0, 'ongoing', 'vital'],
  'med-vyvanse': ['Vyvanse', 3, 0, 1, 0, 'ongoing', 'vital'],
  'med-calcium': ['Ca\u00B2\u207A/Mg\u00B2\u207A', 4, 0, 0, 0, 'ongoing', 'vital'],
  'spoon-budget': ['Spoon Budget', 4, 0, 0, 0, 'active', 'vital', '12/20'],
  'audhd': ['AuDHD Dx', 4, 0, 0, 0, 'active', 'vital', '2025'],
  'hypopara': ['Hypoparathyroid', 4, 0, 0, 0, 'ongoing', 'vital', 'Since 2003'],
  'exec-dys': ['Exec Dysfunction', 3, 0, 1, 0, 'active', 'vital'],
  'fawn': ['Fawn Response', 3, 1, 0, 0, 'monitoring', 'vital'],
  'decoherence': ['Decoherence', 3, 0, 0, 1, 'monitoring', 'ac'],
  'snap': ['SNAP', 3, 1, 0, 0, 'active', 'vital'],
  'medicaid': ['Medicaid', 3, 1, 0, 0, 'active', 'vital', 'All 3 covered'],

  // ── MESH (family, support, connections) ──
  'kids-bash': ['Sebastian', 0, 4, 0, 0, 'monitoring', 'vital', 'T-7 to birthday'],
  'kids-willow': ['Willow', 0, 4, 0, 0, 'monitoring', 'vital'],
  'brenda': ['Brenda O\'Dell', 0, 4, 0, 0, 'active', 'vital', 'Mom, support person'],
  'tyler': ['Tyler', 0, 3, 1, 0, 'active', 'ac', 'Beta tester'],
  'robby': ['Robby Allen', 0, 2, 0, 2, 'complete', 'ac', 'Signed 3112B'],
  'bonding-game': ['BONDING', 0, 3, 1, 0, 'deployed', 'ac', '488 tests, live'],
  'bonding-mp': ['Multiplayer', 0, 3, 1, 0, 'deployed', 'ac'],
  'bonding-quest': ['Quest Chains', 0, 2, 2, 0, 'stretch', 'dc'],
  'kids-encopresis': ['Encopresis Doc', 1, 3, 0, 0, 'active', 'ac'],

  // ── FORGE (products, tech, creation) ──
  'p31-labs': ['P31 Labs', 1, 1, 2, 0, 'active', 'ac', '501(c)(3)'],
  'spaceship': ['Spaceship Earth', 0, 1, 3, 0, 'deployed', 'ac', 'p31ca.org'],
  'buffer': ['The Buffer', 2, 1, 1, 0, 'building', 'dc', '~85%'],
  'node-one': ['Node One', 1, 0, 3, 0, 'prototype', 'dc', 'ESP32-S3'],
  'whale': ['Whale Channel', 0, 2, 2, 0, 'planned', 'dc'],
  'centaur': ['The Centaur', 1, 1, 2, 0, 'active', 'ac'],
  'andromeda': ['Andromeda Mono', 0, 0, 4, 0, 'active', 'ac', '927 tests'],
  'genesis': ['Genesis Block', 0, 1, 3, 0, 'deployed', 'ac', 'SHA-256 chain'],
  'love-econ': ['L.O.V.E.', 1, 1, 2, 0, 'deployed', 'ac', 'Soulbound'],
  'phosphorus31': ['phosphorus31.org', 0, 0, 3, 1, 'deployed', 'ac'],
  'p31ca-site': ['p31ca.org', 0, 1, 3, 0, 'deployed', 'ac'],
  'hcb': ['HCB Fiscal', 0, 0, 2, 2, 'pending', 'ac', 'ref 4XDUXX'],
  'stripe-wallet': ['Stripe Wallet', 0, 0, 3, 1, 'planned', 'dc'],
  'cloudflare': ['Cloudflare Pages', 0, 0, 4, 0, 'active', 'ac'],
  'relay': ['CF Worker Relay', 0, 0, 4, 0, 'deployed', 'ac'],
  'posner': ['Posner Molecule', 2, 0, 2, 0, 'active', 'dc', 'Ca9(PO4)6'],
  'larmor': ['863 Hz', 1, 0, 1, 2, 'active', 'dc', 'Larmor canonical'],
  'ivm': ['IVM Geometry', 0, 0, 4, 0, 'active', 'dc'],
  'wye-delta': ['Wye to Delta', 0, 1, 3, 0, 'active', 'dc'],
  'soulsafe': ['SOULSAFE', 0, 0, 2, 2, 'active', 'ac'],

  // ── SHIELD (legal, FERS, protective) ──
  'opm-3112a': ['SF 3112A', 1, 0, 0, 3, 'complete', 'ac'],
  'opm-3112b': ['SF 3112B', 0, 0, 0, 4, 'complete', 'ac'],
  'opm-3112c': ['SF 3112C', 1, 0, 0, 3, 'complete', 'ac'],
  'opm-3112d': ['SF 3112D', 0, 0, 0, 4, 'missing', 'ac', 'Agency owes'],
  'opm-3112e': ['SF 3112E', 0, 0, 0, 4, 'missing', 'ac', 'Agency owes'],
  'opm-sf3107': ['SF 3107', 0, 0, 0, 4, 'todo', 'ac'],
  'opm-deadline': ['OPM ~Sep 26', 0, 0, 0, 4, 'countdown', 'vital'],
  'opm-mail': ['Mail Boyers PA', 0, 0, 0, 4, 'actionable', 'ac'],
  'court-mar12': ['March 12 Hearing', 1, 1, 0, 3, 'countdown', 'vital', 'T-9'],
  'court-contempt': ['Contempt Response', 0, 0, 0, 4, 'complete', 'ac', 'Docket 74'],
  'court-vexatious': ['Vexatious Response', 0, 0, 0, 4, 'complete', 'ac', 'Docket 69'],
  'court-ada': ['ADA Accommodation', 1, 0, 0, 3, 'complete', 'ac'],
  'court-void': ['Void Ab Initio', 0, 0, 0, 4, 'active', 'ac', 'Core strategy'],
  'court-tsp': ['TSP Fraud Evidence', 0, 0, 1, 3, 'complete', 'ac', 'IRS-verified'],
  'ssa-psych': ['SSA Psych Exam', 4, 0, 0, 0, 'complete', 'ac', 'Feb 20'],
  'ssa-medical': ['SSA Medical Exam', 4, 0, 0, 0, 'complete', 'ac', 'Feb 26'],
  'ssa-decision': ['SSA Determination', 3, 0, 0, 1, 'waiting', 'ac'],
};

const EDGES: [string, string, string][] = [
  // Body internals
  ['med-calcitriol', 'hypopara', 'treats'], ['med-calcium', 'hypopara', 'treats'],
  ['med-effexor', 'audhd', 'treats'], ['med-vyvanse', 'audhd', 'treats'],
  ['audhd', 'exec-dys', 'causes'], ['audhd', 'fawn', 'causes'],
  ['fawn', 'decoherence', 'triggers'], ['exec-dys', 'spoon-budget', 'drains'],
  // Family mesh
  ['kids-bash', 'bonding-game', 'plays'], ['kids-willow', 'bonding-game', 'plays'],
  ['bonding-game', 'bonding-mp', 'includes'], ['bonding-game', 'bonding-quest', 'includes'],
  ['bonding-game', 'love-econ', 'earns'], ['bonding-mp', 'relay', 'uses'],
  // FERS chain
  ['opm-3112a', 'opm-3112b', 'requires'], ['opm-3112b', 'opm-3112c', 'requires'],
  ['opm-3112c', 'opm-3112d', 'requires'], ['opm-3112d', 'opm-3112e', 'requires'],
  ['opm-3112e', 'opm-sf3107', 'requires'], ['opm-sf3107', 'opm-mail', 'then'],
  ['opm-deadline', 'opm-mail', 'deadline'],
  // Legal chain
  ['court-mar12', 'court-contempt', 'includes'], ['court-mar12', 'court-vexatious', 'includes'],
  ['court-mar12', 'court-ada', 'includes'], ['court-mar12', 'court-void', 'strategy'],
  ['court-void', 'court-tsp', 'evidence'],
  // Products
  ['p31-labs', 'spaceship', 'builds'], ['p31-labs', 'buffer', 'builds'],
  ['p31-labs', 'node-one', 'builds'], ['p31-labs', 'bonding-game', 'builds'],
  ['p31-labs', 'whale', 'plans'], ['p31-labs', 'centaur', 'uses'],
  ['spaceship', 'genesis', 'uses'], ['spaceship', 'love-econ', 'displays'],
  ['andromeda', 'spaceship', 'contains'], ['andromeda', 'bonding-game', 'contains'],
  // Infrastructure
  ['phosphorus31', 'cloudflare', 'hosted'], ['p31ca-site', 'cloudflare', 'hosted'],
  ['p31-labs', 'hcb', 'fiscal'], ['p31-labs', 'stripe-wallet', 'planned'],
  ['relay', 'cloudflare', 'hosted'], ['genesis', 'relay', 'sends'],
  // Concepts
  ['posner', 'larmor', 'resonates'], ['posner', 'ivm', 'geometry'],
  ['ivm', 'wye-delta', 'topology'], ['soulsafe', 'andromeda', 'governs'],
  // Support
  ['brenda', 'court-ada', 'support'], ['tyler', 'bonding-mp', 'tests'],
  ['robby', 'opm-3112b', 'signed'],
  // SSA
  ['ssa-psych', 'audhd', 'evaluates'], ['ssa-medical', 'hypopara', 'evaluates'],
  ['ssa-decision', 'ssa-psych', 'depends'], ['ssa-decision', 'ssa-medical', 'depends'],
  // Benefits
  ['snap', 'spoon-budget', 'sustains'], ['medicaid', 'med-calcitriol', 'covers'],
  ['medicaid', 'kids-bash', 'covers'], ['medicaid', 'kids-willow', 'covers'],
];

// ═══════════════════════════════════════════════════════════════
// GEOMETRY CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PHI = (1 + Math.sqrt(5)) / 2;

const TETRA_VERTS = [
  new THREE.Vector3(0, 1, 0),                                        // A = Body
  new THREE.Vector3(0, -1 / 3, Math.sqrt(8 / 9)),                    // B = Mesh
  new THREE.Vector3(-Math.sqrt(2 / 3), -1 / 3, -Math.sqrt(2 / 9)),  // C = Forge
  new THREE.Vector3(Math.sqrt(2 / 3), -1 / 3, -Math.sqrt(2 / 9)),   // D = Shield
];

const AXIS_KEYS = ['a', 'b', 'c', 'd'] as const;
type AxisKey = typeof AXIS_KEYS[number];

const AXIS_COLORS: Record<AxisKey, THREE.Color> = {
  a: new THREE.Color(0xff9944),
  b: new THREE.Color(0x44aaff),
  c: new THREE.Color(0x44ffaa),
  d: new THREE.Color(0xff4466),
};

const AXIS_CSS: Record<AxisKey, string> = {
  a: '#ff9944', b: '#44aaff', c: '#44ffaa', d: '#ff4466',
};
const AXIS_LABELS: Record<AxisKey, string> = {
  a: 'Body', b: 'Mesh', c: 'Forge', d: 'Shield',
};

const STATE_GLOW: Record<string, number> = {
  countdown: 2.0, critical: 2.5, todo: 0.8, actionable: 1.5, done: 0.4,
  complete: 0.4, active: 1.0, ongoing: 0.6, monitoring: 0.6, info: 0.3,
  waiting: 0.5, deployed: 0.7, building: 0.9, planned: 0.3, prototype: 0.5,
  stretch: 0.4, missing: 1.2, pending: 1.0,
};

const BUS_CSS: Record<string, string> = {
  vital: '#ff6633', ac: '#33aacc', dc: '#cccc44',
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// Deterministic hash for node spread
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

function baryToPosition(a: number, b: number, c: number, d: number, nodeId = '', shellRadius = 3.0): THREE.Vector3 {
  const sum = a + b + c + d || 1;
  const pos = new THREE.Vector3(0, 0, 0);
  pos.addScaledVector(TETRA_VERTS[0], a / sum);
  pos.addScaledVector(TETRA_VERTS[1], b / sum);
  pos.addScaledVector(TETRA_VERTS[2], c / sum);
  pos.addScaledVector(TETRA_VERTS[3], d / sum);

  // Project onto the geodesic shell surface
  pos.normalize();

  // Deterministic tangential spread so same-weight nodes don't stack
  if (nodeId) {
    const h = hashStr(nodeId);
    const spreadAngle = 0.18;
    const theta = ((h & 0xffff) / 0xffff) * Math.PI * 2;
    const phi = (((h >> 16) & 0xffff) / 0xffff) * spreadAngle;
    const up = Math.abs(pos.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const t1 = new THREE.Vector3().crossVectors(pos, up).normalize();
    const t2 = new THREE.Vector3().crossVectors(pos, t1).normalize();
    pos.addScaledVector(t1, Math.cos(theta) * Math.sin(phi));
    pos.addScaledVector(t2, Math.sin(theta) * Math.sin(phi));
  }

  pos.normalize().multiplyScalar(shellRadius);
  return pos;
}

function getDominantAxis(a: number, b: number, c: number, d: number): AxisKey {
  const vals = { a, b, c, d };
  let max = -1;
  let axis: AxisKey = 'a';
  for (const k of AXIS_KEYS) {
    if (vals[k] > max) { max = vals[k]; axis = k; }
  }
  return axis;
}

function getNodeColor(a: number, b: number, c: number, d: number): THREE.Color {
  const sum = a + b + c + d || 1;
  const color = new THREE.Color(0, 0, 0);
  for (const k of AXIS_KEYS) {
    const w = ({ a, b, c, d })[k] / sum;
    color.r += AXIS_COLORS[k].r * w;
    color.g += AXIS_COLORS[k].g * w;
    color.b += AXIS_COLORS[k].b * w;
  }
  return color;
}

function buildGeodesicShell(radius: number, subdivisions: number) {
  const t = PHI;
  const rawVerts: [number, number, number][] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
  let verts = rawVerts.map(([x, y, z]) => {
    const l = Math.sqrt(x * x + y * y + z * z);
    return new THREE.Vector3(x / l * radius, y / l * radius, z / l * radius);
  });
  let faces: number[][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  for (let sub = 0; sub < subdivisions; sub++) {
    const midCache: Record<string, number> = {};
    const getMid = (i: number, j: number): number => {
      const key = Math.min(i, j) + '_' + Math.max(i, j);
      if (midCache[key] !== undefined) return midCache[key];
      const mid = verts[i].clone().add(verts[j]).multiplyScalar(0.5)
        .normalize().multiplyScalar(radius);
      const idx = verts.length;
      verts.push(mid);
      midCache[key] = idx;
      return idx;
    };
    const newFaces: number[][] = [];
    for (const [a, b, c] of faces) {
      const ab = getMid(a, b), bc = getMid(b, c), ca = getMid(c, a);
      newFaces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = newFaces;
  }

  const edgeSet = new Set<string>();
  for (const [a, b, c] of faces) {
    edgeSet.add(Math.min(a, b) + '_' + Math.max(a, b));
    edgeSet.add(Math.min(b, c) + '_' + Math.max(b, c));
    edgeSet.add(Math.min(a, c) + '_' + Math.max(a, c));
  }
  const edges: [number, number][] = [];
  edgeSet.forEach(e => {
    const [a, b] = e.split('_').map(Number);
    edges.push([a, b]);
  });
  return { verts, edges };
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface NodeInfo {
  id: string;
  label: string;
  a: number; b: number; c: number; d: number;
  state: string;
  bus: string;
  notes?: string;
}

interface ConnectionInfo {
  id: string;
  label: string;
  type: string;
  axis: AxisKey;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ObservatoryRoom() {
  const mountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const mouseRef = useRef({
    down: false, x: 0, y: 0,
    rx: 0.4, ry: 0.15, trx: 0.4, try_: 0.15,
    moved: false,
  });
  const spheresRef = useRef<THREE.Mesh[]>([]);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const raycaster = useRef(new THREE.Raycaster());

  const [selected, setSelected] = useState<NodeInfo | null>(null);
  const [filter, setFilter] = useState<AxisKey | null>(null);

  const connections = useMemo<ConnectionInfo[]>(() => {
    if (!selected) return [];
    return EDGES
      .filter(([s, t]) => s === selected.id || t === selected.id)
      .map(([s, t, type]) => {
        const otherId = s === selected.id ? t : s;
        const other = VERTICES[otherId];
        if (!other) return null;
        return { id: otherId, label: other[0], type, axis: getDominantAxis(other[1], other[2], other[3], other[4]) };
      })
      .filter((c): c is ConnectionInfo => c !== null);
  }, [selected]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060a12);
    scene.fog = new THREE.FogExp2(0x060a12, 0.04);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0.5, 6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0x223344, 0.5));
    const pt1 = new THREE.PointLight(0x6688cc, 1.2, 25);
    pt1.position.set(3, 4, 5);
    scene.add(pt1);
    const pt2 = new THREE.PointLight(0xff6644, 0.4, 18);
    pt2.position.set(-4, -2, 3);
    scene.add(pt2);

    // ── Outer geodesic shell (2V) ──
    const outerShell = buildGeodesicShell(3.2, 2);
    const outerPos: number[] = [];
    for (const [a, b] of outerShell.edges) {
      outerPos.push(outerShell.verts[a].x, outerShell.verts[a].y, outerShell.verts[a].z);
      outerPos.push(outerShell.verts[b].x, outerShell.verts[b].y, outerShell.verts[b].z);
    }
    const outerGeo = new THREE.BufferGeometry();
    outerGeo.setAttribute('position', new THREE.Float32BufferAttribute(outerPos, 3));
    const outerLines = new THREE.LineSegments(outerGeo,
      new THREE.LineBasicMaterial({ color: 0x1a2a3a, transparent: true, opacity: 0.15 }));
    scene.add(outerLines);

    // ── Inner geodesic shell (1V) ──
    const innerShell = buildGeodesicShell(1.2, 1);
    const innerPos: number[] = [];
    for (const [a, b] of innerShell.edges) {
      innerPos.push(innerShell.verts[a].x, innerShell.verts[a].y, innerShell.verts[a].z);
      innerPos.push(innerShell.verts[b].x, innerShell.verts[b].y, innerShell.verts[b].z);
    }
    const innerGeo = new THREE.BufferGeometry();
    innerGeo.setAttribute('position', new THREE.Float32BufferAttribute(innerPos, 3));
    const innerLines = new THREE.LineSegments(innerGeo,
      new THREE.LineBasicMaterial({ color: 0x182838, transparent: true, opacity: 0.08 }));
    scene.add(innerLines);

    // ── Tetrahedron frame ──
    const tetraScale = 2.8;
    const tv = TETRA_VERTS.map(v => v.clone().multiplyScalar(tetraScale));
    const tetraPos: number[] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        tetraPos.push(tv[i].x, tv[i].y, tv[i].z, tv[j].x, tv[j].y, tv[j].z);
      }
    }
    const tetraGeo = new THREE.BufferGeometry();
    tetraGeo.setAttribute('position', new THREE.Float32BufferAttribute(tetraPos, 3));
    scene.add(new THREE.LineSegments(tetraGeo,
      new THREE.LineBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.2 })));

    // ── Axis vertex markers ──
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.SphereGeometry(0.07, 14, 14);
      const mat = new THREE.MeshBasicMaterial({ color: AXIS_COLORS[AXIS_KEYS[i]], transparent: true, opacity: 0.7 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(tv[i]);
      scene.add(mesh);
    }

    // ── Graph nodes ──
    const sphereGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const spheres: THREE.Mesh[] = [];
    for (const [id, data] of Object.entries(VERTICES)) {
      const [label, a, b, c, d, state, bus, notes] = data;
      const pos = baryToPosition(a, b, c, d, id);
      const col = getNodeColor(a, b, c, d);
      const glow = STATE_GLOW[state] || 0.5;
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col.clone().multiplyScalar(0.25 * glow),
        roughness: 0.35, metalness: 0.15,
      });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.copy(pos);
      mesh.userData = { id, label, a, b, c, d, state, bus, notes };
      mesh.scale.setScalar(state === 'countdown' ? 1.5 : state === 'missing' ? 1.3 : 1.0);
      scene.add(mesh);
      spheres.push(mesh);
    }
    spheresRef.current = spheres;

    // ── Data edges ──
    const edgePos: number[] = [];
    for (const [src, tgt] of EDGES) {
      const sd = VERTICES[src], td = VERTICES[tgt];
      if (!sd || !td) continue;
      const sp = baryToPosition(sd[1], sd[2], sd[3], sd[4], src);
      const tp = baryToPosition(td[1], td[2], td[3], td[4], tgt);
      edgePos.push(sp.x, sp.y, sp.z, tp.x, tp.y, tp.z);
    }
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePos, 3));
    scene.add(new THREE.LineSegments(edgeGeo,
      new THREE.LineBasicMaterial({ color: 0x1e2e3e, transparent: true, opacity: 0.25 })));

    // ── Stars ──
    const starsPos: number[] = [];
    for (let i = 0; i < 600; i++) {
      const r = 18 + Math.random() * 35;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starsPos.push(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph));
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsPos, 3));
    scene.add(new THREE.Points(starsGeo,
      new THREE.PointsMaterial({ color: 0x334455, size: 0.06, sizeAttenuation: true })));

    // ── Animation loop ──
    let t = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.002;

      // Breathing
      const breath = 1.0 + 0.015 * Math.sin(t * 1.8);
      outerLines.scale.setScalar(breath);
      innerLines.scale.setScalar(breath * 0.97);

      // Countdown pulse
      for (const s of spheres) {
        if (s.userData.state === 'countdown') {
          s.scale.setScalar(1.3 + 0.35 * Math.sin(t * 3.5 + s.position.x * 2));
          (s.material as THREE.MeshStandardMaterial).emissiveIntensity =
            0.4 + 0.6 * Math.abs(Math.sin(t * 2.5));
        }
      }

      // Camera orbit from mouse drag
      const m = mouseRef.current;
      m.trx += (m.rx - m.trx) * 0.04;
      m.try_ += (m.ry - m.try_) * 0.04;
      const D = 6.0;
      camera.position.x = D * Math.sin(m.trx) * Math.cos(m.try_);
      camera.position.y = D * Math.sin(m.try_) + 0.3;
      camera.position.z = D * Math.cos(m.trx) * Math.cos(m.try_);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // ── Input ──
    const getXY = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if ('changedTouches' in e && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getXY(e);
      const rect = el.getBoundingClientRect();
      const m = mouseRef.current;
      m.down = true; m.x = x - rect.left; m.y = y - rect.top; m.moved = false;
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      const m = mouseRef.current;
      if (!m.down) return;
      const { x, y } = getXY(e);
      const rect = el.getBoundingClientRect();
      const nx = x - rect.left, ny = y - rect.top;
      const dx = nx - m.x, dy = ny - m.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) m.moved = true;
      m.rx += dx * 0.005;
      m.ry += dy * 0.004;
      m.ry = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, m.ry));
      m.x = nx; m.y = ny;
    };
    const onUp = () => { mouseRef.current.down = false; };
    const onClick = (e: MouseEvent | TouchEvent) => {
      if (mouseRef.current.moved) return;
      const { x, y } = getXY(e);
      const rect = el.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((x - rect.left) / rect.width) * 2 - 1,
        -((y - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.current.setFromCamera(mouse, camera);
      const hits = raycaster.current.intersectObjects(spheres);
      if (hits.length > 0) setSelected(hits[0].object.userData as NodeInfo);
      else setSelected(null);
    };

    el.addEventListener('mousedown', onDown);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('click', onClick);
    el.addEventListener('touchstart', onDown, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', (e: TouchEvent) => { onUp(); onClick(e); });

    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseup', onUp);
      el.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  // Apply axis filter
  useEffect(() => {
    for (const s of spheresRef.current) {
      if (!filter) { s.visible = true; continue; }
      s.visible = getDominantAxis(s.userData.a, s.userData.b, s.userData.c, s.userData.d) === filter;
    }
  }, [filter]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#060a12', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab', touchAction: 'none' }} />

      {/* Axis filters */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, zIndex: 10 }}>
        {AXIS_KEYS.map(k => (
          <button key={k} onClick={() => setFilter(filter === k ? null : k)} style={{
            background: filter === k ? AXIS_CSS[k] + '22' : 'transparent',
            border: `1px solid ${filter === k ? AXIS_CSS[k] : '#1a2a3a'}`,
            color: AXIS_CSS[k], padding: '3px 10px', borderRadius: 3, fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
            letterSpacing: 1, textTransform: 'uppercase' as const, transition: 'all 0.2s',
          }}>
            {AXIS_LABELS[k]}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{
        position: 'absolute', top: 12, right: 12, color: '#2a3a4a', fontSize: 9,
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, zIndex: 10,
      }}>
        {Object.keys(VERTICES).length} NODES &middot; {EDGES.length} EDGES
      </div>

      {/* Selected panel */}
      {selected && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12, right: 12, maxWidth: 420,
          background: 'rgba(6,10,18,0.92)', backdropFilter: 'blur(12px)',
          border: '1px solid #1a2a3a', borderRadius: 6, padding: 14, zIndex: 20,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ color: '#e8e8e8', fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>
              {selected.label}
            </span>
            <button onClick={() => setSelected(null)} style={{
              background: 'none', border: 'none', color: '#3a4a5a', cursor: 'pointer', fontSize: 14, padding: '0 4px',
            }}>&#x2715;</button>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#5a6a7a', marginBottom: 6 }}>
            <span style={{ color: AXIS_CSS[getDominantAxis(selected.a, selected.b, selected.c, selected.d)] }}>
              {AXIS_LABELS[getDominantAxis(selected.a, selected.b, selected.c, selected.d)]}
            </span>
            <span style={{
              color: selected.state === 'countdown' ? '#ff6633' : selected.state === 'complete' ? '#44cc77'
                : selected.state === 'missing' ? '#ff4466' : selected.state === 'deployed' ? '#44ffaa' : '#8899aa',
            }}>{selected.state}</span>
            <span style={{ color: BUS_CSS[selected.bus] || '#8899aa' }}>{selected.bus}</span>
          </div>
          {selected.notes && <div style={{ color: '#4a5a6a', fontSize: 9, marginBottom: 6 }}>{selected.notes}</div>}
          {connections.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {connections.map((c, i) => (
                <span key={i} onClick={() => {
                  const d = VERTICES[c.id];
                  if (d) setSelected({ id: c.id, label: d[0], a: d[1], b: d[2], c: d[3], d: d[4], state: d[5], bus: d[6], notes: d[7] });
                }} style={{
                  fontSize: 8, padding: '2px 8px', borderRadius: 2, cursor: 'pointer',
                  background: '#0a0e16', border: '1px solid #151e28',
                  color: AXIS_CSS[c.axis], transition: 'all 0.15s', letterSpacing: 0.5,
                }}>
                  {c.label} <span style={{ color: '#2a3a4a', marginLeft: 2 }}>({c.type})</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        position: 'absolute', bottom: selected ? 180 : 12, right: 12, color: '#1a2838',
        fontSize: 8, textAlign: 'right' as const, letterSpacing: 1, transition: 'bottom 0.3s',
        lineHeight: 1.8, fontFamily: "'JetBrains Mono', monospace", zIndex: 5,
      }}>
        <div>DRAG ROTATE</div>
        <div>CLICK SELECT</div>
      </div>
    </div>
  );
}
