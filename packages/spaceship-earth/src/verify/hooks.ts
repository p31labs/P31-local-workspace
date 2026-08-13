// Verify hooks — expose live ship state on `window.*` for the verify suite
// (scripts/verify-ship.cjs). Only installed when MODE !== 'production' OR
// __P31_VERIFY__ is set, mirroring the shell's convention.
import { useShipStore } from '../store/shipStore';
import { useDatasetStore } from '../store/datasetStore';
import { getNeoPixelBridge } from '../services/neoPixelBridge';
import { nodeZeroBridge } from '../services/nodeZeroBridge';
import { icosahedronGeodesic } from '../math/geodesic';
import { DOME_FACE_CENTROIDS } from '../math/domeMap';
import { domeConfig } from '../config/domeConfig';
import { VERTICES, EDGES, AXES } from '@p31/shared';
import type { NormalizedDataPoint } from '../engine/dataConnectors';

const DEMO_NODE_COUNT = 6;
const DEMO_EDGE_PAIRS: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [0, 5]];

async function loadDemoDataset(): Promise<boolean> {
  const ds = useDatasetStore.getState();
  for (const d of ds.datasets) ds.unloadDataset(d.id);

  const data: NormalizedDataPoint[] = [];
  for (let i = 0; i < DEMO_NODE_COUNT; i++) {
    data.push({
      id: `verify-n${i}`,
      type: 'node',
      vertexIndex: i,
      label: `Node ${i}`,
      value: 1 + i,
      category: i % 2 === 0 ? 'family' : 'legal',
      metadata: { category: i % 2 === 0 ? 'family' : 'legal', criticality: 'primary', temporal: 'active' },
    } as NormalizedDataPoint);
  }
  for (const [s, t] of DEMO_EDGE_PAIRS) {
    data.push({
      id: `verify-e${s}-${t}`,
      type: 'edge',
      source: `verify-n${s}`,
      target: `verify-n${t}`,
      label: `Edge ${s}-${t}`,
      metadata: { category: 'family', criticality: 'primary', temporal: 'active', weight: 1.0 },
    } as NormalizedDataPoint);
  }

  const id = ds.addDataset({
    name: 'verify-demo',
    source: 'local',
    target: 'both',
    data,
    visible: true,
    opacity: 1,
  });
  ds.setActiveVertexDataset(id);

  return new Promise<boolean>((resolve) => {
    const t0 = Date.now();
    const poll = () => {
      const entry = useDatasetStore.getState().datasets.find((d) => d.id === id);
      if (entry && entry.status === 'ready' && (entry.vertexData || entry.edgeData)) return resolve(true);
      if (Date.now() - t0 > 15000) return resolve(false);
      setTimeout(poll, 250);
    };
    poll();
  });
}

const DOME_RADIUS = domeConfig.geometry.radius;
const PORT_COUNT = DOME_FACE_CENTROIDS.length;
const SEGMENTS_PER_EDGE = domeConfig.neoPixel.segmentsPerEdge;

export function installVerifyHooks(): () => void {
  const canExpose =
    import.meta.env.MODE !== 'production' ||
    (typeof window !== 'undefined' && (window as any).__P31_VERIFY__);
  if (!canExpose) return () => {};

  const outerShell = icosahedronGeodesic(DOME_RADIUS, domeConfig.geometry.detail);
  const outerEdges = outerShell.edges.length;

  const expose = () => {
    const s = useShipStore.getState();
    (window as any).__p31_domeStructure = {
      layers: 4,
      mode: 'docking-dome',
      radius: DOME_RADIUS,
      outerEdges,
      ports: PORT_COUNT,
      neoPixelSegments: outerEdges * SEGMENTS_PER_EDGE,
      tetraFrame: 6,
      innerDome: true,
    };
    (window as any).__p31_ship = {
      spoons: s.spoons,
      coherence: s.coherence,
      engagement: s.engagement,
      didKey: s.didKey,
      members: s.memberCount,
      target: s.dunaTarget,
      docked: s.dockedPorts.length,
      selectedPort: s.selectedPort,
      viewMode: s.viewMode,
    };
    (window as any).__p31_led = {
      mode: s.ledMode,
      speed: s.ledSpeed,
      color: s.ledColor,
      brightness: s.ledBrightness,
      colors: s.ledColors,
      collapsed: s.ledCollapsed,
    };
    (window as any).__p31_ledBridge = getNeoPixelBridge();
    (window as any).__p31_nodeZero = nodeZeroBridge;
    (window as any).__p31_loadDemoDataset = loadDemoDataset;
    (window as any).__p31_observatory = {
      nodeCount: VERTICES.length,
      edgeCount: EDGES.length,
      axisCount: Object.keys(AXES).length,
      shellVertices: outerShell.vertices.length,
      shellEdges: outerEdges,
    };
  };

  expose();
  return useShipStore.subscribe(expose);
}
