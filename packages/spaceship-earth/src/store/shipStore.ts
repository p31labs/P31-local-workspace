import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as THREE from 'three';
import { DockRecord, allocatePort, computeDockEdges, computeProbabilities, computeSystemProbabilities, detectEdgeCases, generateDockJSON } from '../engine/dockMath';

const NODE_DATA = [
  { id: 'willow', label: 'Willow', type: 'family' as const, color: '#ff9944' },
  { id: 'sebastian', label: 'Sebastian', type: 'family' as const, color: '#ff9944' },
  { id: 'elara', label: 'Elara', type: 'family' as const, color: '#ff9944' },
  { id: 'orion', label: 'Orion', type: 'family' as const, color: '#ff9944' },
  { id: 'mesh', label: 'Mesh', type: 'system' as const, color: '#44aaff' },
  { id: 'ledger', label: 'Ledger', type: 'system' as const, color: '#44aaff' },
  { id: 'identity', label: 'Identity', type: 'system' as const, color: '#44aaff' },
  { id: 'sync', label: 'Sync', type: 'system' as const, color: '#44aaff' },
  { id: 'somatic', label: 'Somatic', type: 'care' as const, color: '#44ffaa' },
  { id: 'bonding', label: 'Bonding', type: 'care' as const, color: '#44ffaa' },
  { id: 'rituals', label: 'Rituals', type: 'care' as const, color: '#44ffaa' },
  { id: 'love', label: 'LOVE', type: 'care' as const, color: '#44ffaa' },
];

function icosahedronVertices(radius = 3): [number, number, number][] {
  const t = (1 + Math.sqrt(5)) / 2;
  const raw: [number, number, number][] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
  return raw.map(([x, y, z]) => {
    const len = Math.sqrt(x * x + y * y + z * z);
    const s = radius / len;
    return [x * s, y * s, z * s];
  });
}

function generatePortPositions(count: number): [number, number, number][] {
  const geo = new THREE.IcosahedronGeometry(12, 3);
  const pos = geo.getAttribute('position');
  const idx = geo.getIndex();
  if (!idx) return [];

  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count; i++) {
    verts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
  }

  const centroids: THREE.Vector3[] = [];
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i);
    const b = idx.getX(i + 1);
    const c = idx.getX(i + 2);
    const centroid = new THREE.Vector3()
      .add(verts[a])
      .add(verts[b])
      .add(verts[c])
      .multiplyScalar(1 / 3);
    centroids.push(centroid);
  }

  centroids.sort((a, b) => a.length() - b.length());
  return centroids.slice(0, count).map((p) => [p.x, p.y, p.z]);
}

const PORT_COUNT = 120;
const PORT_POSITIONS = generatePortPositions(PORT_COUNT);

export type LedMode = 'rainbow' | 'chase' | 'solid' | 'breath' | 'gradient' | 'dual-chase' | 'off';

export interface ShipStore {
  spoons: number;
  coherence: number;
  engagement: number;
  didKey: string;
  selectedNode: number | null;
  viewMode: 'ambient' | 'detail';
  nodePositions: [number, number, number][];
  nodeData: typeof NODE_DATA;
  dockedPorts: number[];
  memberCount: number;
  dunaTarget: number;
  portPositions: [number, number, number][];
  selectedPort: number | null;
  hoveredPort: number | null;
  dockRecords: DockRecord[];
  ledMode: LedMode;
  ledSpeed: number;
  ledColor: string;
  ledBrightness: number;
  ledColors: string[];
  ledCollapsed: boolean;
  demoIndex: number;
  
  // SMART notification system (Phase 4)
  lastNotifPulse?: number;
  highUnread?: number;
  
  // K4 wireframe overlay toggle
  showK4Wireframe: boolean;
  
  setSpoons: (s: number) => void;
  setCoherence: (c: number) => void;
  setEngagement: (e: number) => void;
  setSelectedNode: (idx: number | null) => void;
  setDidKey: (key: string) => void;
  dockMember: (memberId: string, axis: 'family' | 'system' | 'care' | 'shield') => void;
  undockMember: (portIndex: number) => void;
  setSelectedPort: (idx: number | null) => void;
  setHoveredPort: (idx: number | null) => void;
  dockMemberAt: (portIndex: number, memberId: string, axis: 'family' | 'system' | 'care' | 'shield') => void;
  setMemberCount: (count: number) => void;
  setLedMode: (mode: LedMode) => void;
  setLedSpeed: (speed: number) => void;
  setLedColor: (color: string) => void;
  setLedBrightness: (brightness: number) => void;
   setLedColors: (colors: string[]) => void;
   setLedCollapsed: (collapsed: boolean) => void;
   setShowK4Wireframe: (show: boolean) => void;
   nextDemoMember: () => { id: string; index: number };
 }

export const useShipStore = create<ShipStore>()(
  persist(
    (set, get) => ({
      spoons: 4,
      coherence: 0.8,
      engagement: 5,
      didKey: '',
      selectedNode: null,
      viewMode: 'ambient',
      nodePositions: icosahedronVertices(3),
      nodeData: NODE_DATA,
      dockedPorts: [],
      memberCount: 0,
      dunaTarget: 100,
      portPositions: PORT_POSITIONS,
      selectedPort: null,
      hoveredPort: null,
      dockRecords: [],
      ledMode: 'rainbow',
      ledSpeed: 5,
      ledColor: '#22d3ee',
      ledBrightness: 80,
      ledColors: ['#ff9944', '#22d3ee', '#44ffaa'],
      ledCollapsed: true,
      demoIndex: 0,
      showK4Wireframe: false,
      setSpoons: (s) => set({ spoons: Math.max(0, Math.min(5, s)) }),
      setCoherence: (c) => set({ coherence: Math.max(0, Math.min(1, c)) }),
      setEngagement: (e) => set({ engagement: Math.max(0, Math.min(10, e)) }),
      setSelectedNode: (idx) => set({ selectedNode: idx, viewMode: idx !== null ? 'detail' : 'ambient' }),
      setDidKey: (key) => set({ didKey: key }),
      dockMember: (memberId, axis) => {
        const state = get();
        const portPos = (idx: number) => new THREE.Vector3(...state.portPositions[idx]);
        const portIndex = allocatePort(state.dockedPorts, PORT_COUNT, portPos);
        if (portIndex < 0) return;

        const portPosVec = portPos(portIndex);
        const dockedPositions = state.dockedPorts.map((i) => portPos(i));
        const edges = computeDockEdges(portPosVec, dockedPositions);
        const memberAxes = state.dockRecords.map((r) => r.axis);
        const probs = computeProbabilities(edges, memberAxes, axis);
        const edgeCases = detectEdgeCases(probs, state.dockedPorts);
        const sysProbs = computeSystemProbabilities([...state.dockedPorts, portIndex], PORT_COUNT, probs);
        const record = generateDockJSON(memberId, portIndex, Date.now(), axis, state.portPositions[portIndex], probs, sysProbs, edgeCases);

        set({
          dockedPorts: [...state.dockedPorts, portIndex],
          memberCount: state.memberCount + 1,
          dockRecords: [...state.dockRecords, record],
          coherence: sysProbs.coherence,
          engagement: sysProbs.engagement,
        });
      },
      undockMember: (portIndex) => {
        set((state) => ({
          dockedPorts: state.dockedPorts.filter((i) => i !== portIndex),
          dockRecords: state.dockRecords.filter((r) => r.portIndex !== portIndex),
          memberCount: Math.max(0, state.memberCount - 1),
        }));
      },
      setSelectedPort: (idx) => set({ selectedPort: idx }),
      setHoveredPort: (idx) => set({ hoveredPort: idx }),
      dockMemberAt: (portIndex: number, memberId: string, axis: 'family' | 'system' | 'care' | 'shield') => {
        const state = get();
        if (state.dockedPorts.includes(portIndex)) return;
        const portPos = (idx: number) => new THREE.Vector3(...state.portPositions[idx]);
        const portPosVec = portPos(portIndex);
        const dockedPositions = state.dockedPorts.map((i) => portPos(i));
        const edges = computeDockEdges(portPosVec, dockedPositions);
        const memberAxes = state.dockRecords.map((r) => r.axis);
        const probs = computeProbabilities(edges, memberAxes, axis);
        const edgeCases = detectEdgeCases(probs, state.dockedPorts);
        const sysProbs = computeSystemProbabilities([...state.dockedPorts, portIndex], PORT_COUNT, probs);
        const record = generateDockJSON(memberId, portIndex, Date.now(), axis, state.portPositions[portIndex], probs, sysProbs, edgeCases);
        set({
          dockedPorts: [...state.dockedPorts, portIndex],
          memberCount: state.memberCount + 1,
          dockRecords: [...state.dockRecords, record],
          coherence: sysProbs.coherence,
          engagement: sysProbs.engagement,
        });
      },
      setMemberCount: (count) => set({ memberCount: count }),
      setLedMode: (mode) => set({ ledMode: mode }),
      setLedSpeed: (speed) => set({ ledSpeed: Math.min(10, Math.max(0, speed)) }),
      setLedColor: (color) => set({ ledColor: color }),
      setLedBrightness: (b) => set({ ledBrightness: Math.min(100, Math.max(0, b)) }),
      setLedColors: (colors) => set({ ledColors: colors }),
      setLedCollapsed: (collapsed) => set({ ledCollapsed: collapsed }),
      setShowK4Wireframe: (show) => set({ showK4Wireframe: show }),
      nextDemoMember: () => {
        const state = get();
        const idx = state.demoIndex;
        set({ demoIndex: idx + 1 });
        return { id: `Member ${String(idx + 1).padStart(3, '0')}`, index: idx };
      },
    }),
    {
      name: 'ship-led-storage',
      partialize: (state) => ({
        ledMode: state.ledMode,
        ledSpeed: state.ledSpeed,
        ledColor: state.ledColor,
        ledBrightness: state.ledBrightness,
        ledColors: state.ledColors,
        ledCollapsed: state.ledCollapsed,
        showK4Wireframe: state.showK4Wireframe,
      }),
    }
  )
);
