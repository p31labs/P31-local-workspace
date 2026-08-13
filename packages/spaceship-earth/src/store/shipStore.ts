import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as THREE from 'three';
import { DockRecord, allocatePort, computeDockEdges, computeProbabilities, computeSystemProbabilities, detectEdgeCases, generateDockJSON } from '../engine/dockMath';
import { DOME_FACE_CENTROIDS } from '../math/domeMap';
import { domeConfig } from '../config/domeConfig';
import type { LedMode, ShipNode } from '../config/domeConfig';

export type { LedMode } from '../config/domeConfig';
export type { ShipNode } from '../config/domeConfig';

function generatePortPositions(count: number): [number, number, number][] {
  return DOME_FACE_CENTROIDS.slice(0, count).map(v => [v[0], v[1], v[2]]);
}

// Port count follows the dome's configured geometry (320 faces @ detail=2),
// never a magic literal.
const PORT_COUNT = DOME_FACE_CENTROIDS.length;
const PORT_POSITIONS = generatePortPositions(PORT_COUNT);

// The demo node constellation was removed in Phase 3: nodes now come from the
// source registry (personalConstellation connector → dataset pipeline).
// nodeData/nodePositions remain empty here and are only read by the orphaned
// legacy Nodes/Edges renderers, which render nothing with zero nodes.
const seedNodes: ShipNode[] = [];
const initialNodePositions: [number, number, number][] = [];

export interface ShipStore {
  spoons: number;
  coherence: number;
  engagement: number;
  didKey: string;
  selectedNode: number | null;
  viewMode: 'ambient' | 'detail';
  nodePositions: [number, number, number][];
  nodeData: ShipNode[];
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
  demoMode: boolean;
  
  // SMART notification system (Phase 4)
  lastNotifPulse?: number;
  highUnread?: number;
  
  // K4 wireframe overlay toggle
  showK4Wireframe: boolean;
  nodeScreenPos: { x: number; y: number };
  nodeVisible: boolean;
  
  // Gaze tracking (opt-in, local-only)
  gazeActive: boolean;

  // Dual anchored HUD state
  hudLeft: 'data' | null;
  hudRight: 'system' | 'hardware' | null;

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
   setNodeScreenPos: (pos: { x: number; y: number }) => void;
   setNodeVisible: (visible: boolean) => void;
    setGazeActive: (active: boolean) => void;
    setHudLeft: (section: 'data' | null) => void;
    setHudRight: (section: 'system' | 'hardware' | null) => void;
    setDemoMode: (mode: boolean) => void;
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
      nodePositions: initialNodePositions,
      nodeData: seedNodes,
      dockedPorts: [],
      memberCount: 0,
      dunaTarget: 0,
      portPositions: PORT_POSITIONS,
      selectedPort: null,
      hoveredPort: null,
      dockRecords: [],
      ledMode: domeConfig.led.mode,
      ledSpeed: domeConfig.led.speed,
      ledColor: domeConfig.led.color,
      ledBrightness: domeConfig.led.brightness,
      ledColors: domeConfig.led.colors,
      ledCollapsed: domeConfig.led.collapsed,
      demoIndex: 0,
      demoMode: false,
      showK4Wireframe: false,
      nodeScreenPos: { x: 0, y: 0 },
      nodeVisible: false,
      gazeActive: false,
      hudLeft: null,
      hudRight: null,
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
      setNodeScreenPos: (pos) => set({ nodeScreenPos: pos }),
      setNodeVisible: (visible) => set({ nodeVisible: visible }),
      setGazeActive: (active) => set({ gazeActive: active }),
      setHudLeft: (section) => set({ hudLeft: section }),
      setHudRight: (section) => set({ hudRight: section }),
      setDemoMode: (mode) => set({ demoMode: mode }),
      nextDemoMember: () => {
        const state = get();
        if (!state.demoMode) return null;
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
        hudLeft: state.hudLeft,
        hudRight: state.hudRight,
      }),
    }
  )
);
