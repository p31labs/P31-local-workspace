// Verify hooks — expose live ship state on `window.*` for the verify suite
// (scripts/verify-ship.cjs). Only installed when MODE !== 'production' OR
// __P31_VERIFY__ is set, mirroring the shell's convention.
import { useShipStore } from '../store/shipStore';
import { icosahedronGeodesic } from '../math/geodesic';
import { VERTICES, EDGES, AXES } from '@p31/shared';

const DOME_RADIUS = 12;
const PORT_COUNT = 120;
const SEGMENTS_PER_EDGE = 20;

export function installVerifyHooks(): () => void {
  const canExpose =
    import.meta.env.MODE !== 'production' ||
    (typeof window !== 'undefined' && (window as any).__P31_VERIFY__);
  if (!canExpose) return () => {};

  const outerShell = icosahedronGeodesic(DOME_RADIUS, 2);
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
