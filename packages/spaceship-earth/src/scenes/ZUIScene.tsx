/**
 * @file ZUIScene.tsx — Zoomable User Interface (WCD-SE-SDS)
 *
 * Three zoom levels layered over the existing single-canvas cockpit:
 *   MACRO — Geodesic Dome with 3 curved interactive panels
 *   MESO  — the selected panel's zone orbs (sub-spaces)
 *   MICRO — the selected orb's creator faces (karma context)
 *
 * The dome replaces the previous Sierpinski tetrahedron starfield.
 * Camera transitions are driven by the shared useZUICameraStore;
 * the rig takes over the camera only while transitioning, then hands
 * control back to OrbitControls at the new level.
 */

import { useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  ZoomLevel,
  type MacroNode,
  useZUICameraStore,
  getCameraState,
} from '@p31/shared/zui';
import { GeodesicDome } from '../components/mesh/GeodesicDome';

const ARRIVE_EPSILON = 0.05;

const ORB_LABELS = ['Workshop', 'Garden', 'Nook', 'Kitchen', 'Atelier'] as const;
const ORB_ENERGIES = ['kinetic', 'balanced', 'ordered', 'still'] as const;
const ORB_COLORS: Record<string, string> = {
  kinetic: '#fb923c',
  balanced: '#34d399',
  ordered: '#38bdf8',
  still: '#c084fc',
};
const FACE_NAMES = ['Sovereign', 'Co-Builder', 'Guest'] as const;
const FACE_PREVIEWS = ['tending the garden', 'arranging the nook', 'brewing the kettle'] as const;

const PANEL_POSITIONS: Record<string, [number, number, number]> = {
  'dome-workshop': [-1.5, 0.8, 2.0],
  'dome-garden': [1.5, 0.8, 2.0],
  'dome-atelier': [0, -1.8, 2.0],
};

type ZUISceneProps = {
  controlsRef: RefObject<any | null>;
};

/** Registry of MESO orb anchors, shared by the camera rig and MICRO faces. */
const orbRegistry = new Map<string, THREE.Vector3>();

function stringHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function orbColor(energy: string): string {
  return ORB_COLORS[energy] ?? '#22d3ee';
}

function fakePanelNode(panelId: string): MacroNode {
  const wp = PANEL_POSITIONS[panelId] ?? [0, 0, 0];
  return {
    id: panelId,
    worldPosition: wp,
    health: 1,
    zoneLabel: panelId.replace('dome-', ''),
    childCount: 0,
    ivmCoord: { a: 0, b: 0, c: 0, d: 0 },
  };
}

/* ── MESO: local zone orbs ───────────────────────────────────────────── */

type DerivedOrb = {
  id: string;
  label: string;
  energy: string;
  position: THREE.Vector3;
  pulse: number;
  memberCount: number;
};

function deriveOrbs(node: MacroNode): DerivedOrb[] {
  const base = new THREE.Vector3(
    (node.worldPosition[0] ?? 0),
    (node.worldPosition[1] ?? 0),
    (node.worldPosition[2] ?? 0),
  );
  const seed = stringHash(node.id);
  return ORB_LABELS.map((label, i) => {
    const angle = (seed % 1000) + (i * Math.PI * 2) / ORB_LABELS.length;
    const radius = 1.15 + (i % 3) * 0.4;
    const pos = base
      .clone()
      .add(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle + i) * 0.7, Math.sin(angle) * radius));
    return {
      id: `${node.id}-orb-${i}`,
      label,
      energy: ORB_ENERGIES[i % ORB_ENERGIES.length],
      position: pos,
      pulse: 0.55 + (i % 3) * 0.2,
      memberCount: 1 + (i % 4),
    };
  });
}

function ZoneOrbs({ node }: { node: MacroNode }) {
  const orbs = useMemo(() => deriveOrbs(node), [node]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.rotation.y = clock.getElapsedTime() * 0.12;
  });

  // Register orb positions for MICRO target resolution
  for (const orb of orbs) orbRegistry.set(orb.id, orb.position);

  return (
    <group ref={groupRef}>
      {orbs.map((orb) => (
        <group key={orb.id} position={orb.position}>
          <mesh onClick={() => useZUICameraStore.getState().zoomToNode(orb.id, ZoomLevel.MICRO)}>
            <sphereGeometry args={[0.32, 16, 16]} />
            <meshBasicMaterial toneMapped={false} color={orbColor(orb.energy)} />
          </mesh>
          <Html center distanceFactor={9} zIndexRange={[30, 0]}>
            <div className="pointer-events-none whitespace-nowrap rounded-full border border-white/10 bg-black/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-white/70">
              {orb.label}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/* ── MICRO: creator context faces ────────────────────────────────────── */

type DerivedFace = {
  id: string;
  name: string;
  karma: number;
  preview: string;
  position: THREE.Vector3;
};

function deriveFaces(orbId: string): DerivedFace[] {
  const base = orbRegistry.get(orbId);
  if (!base) return [];
  const seed = stringHash(orbId);
  return FACE_NAMES.map((name, i) => {
    const angle = (seed % 1000) + (i * Math.PI * 2) / FACE_NAMES.length;
    const r = 1.05;
    const pos = base
      .clone()
      .add(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle + i) * 0.5, Math.sin(angle) * r));
    return { id: `${orbId}-face-${i}`, name, karma: 12 + i * 7, preview: FACE_PREVIEWS[i], position: pos };
  });
}

function CreatorFaces({ orbId }: { orbId: string }) {
  const faces = useMemo(() => deriveFaces(orbId), [orbId]);

  return (
    <group>
      {faces.map((face) => (
        <Html key={face.id} position={face.position} center zIndexRange={[20, 0]}>
          <div className="pointer-events-none w-40 rounded-xl border border-white/10 bg-black/75 p-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22d3ee]/20 font-mono text-[10px] font-bold text-[#22d3ee]">
                {face.name.charAt(0)}
              </span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-white">{face.name}</span>
            </div>
            <div className="mt-2 font-mono text-[9px] text-[#22d3ee]">KARMA {face.karma}</div>
            <div className="mt-1 font-mono text-[9px] italic text-white/50">{face.preview}</div>
          </div>
        </Html>
      ))}
    </group>
  );
}

/* ── Camera rig ──────────────────────────────────────────────────────── */

type CameraTarget = { pos: THREE.Vector3; look: THREE.Vector3 };

function resolveTarget(
  level: ZoomLevel,
  nodeId: string | null,
  _nodeMap: Map<string, MacroNode>,
): CameraTarget {
  const out: CameraTarget = { pos: new THREE.Vector3(), look: new THREE.Vector3() };

  if (level === ZoomLevel.MACRO) {
    out.pos.set(0, 0, nodeId ? 20 : 3);
    out.look.set(0, 0, 0);
    return out;
  }

  let targetPos = new THREE.Vector3(0, 0, 0);

  if (nodeId) {
    // Try a panel preset first
    const preset = PANEL_POSITIONS[nodeId];
    if (preset) {
      targetPos.set(preset[0], preset[1], preset[2]);
    } else {
      // Look up an orb registry position (for MICRO)
      const orbPos = orbRegistry.get(nodeId);
      if (orbPos) targetPos.copy(orbPos);
    }
  }

  out.look.copy(targetPos);

  if (level === ZoomLevel.MESO) {
    out.pos.copy(targetPos).add(new THREE.Vector3(2, 1.4, 4));
  } else {
    out.pos.copy(targetPos).add(new THREE.Vector3(1.1, 0.8, 2.3));
  }

  return out;
}

function ZUICameraRig({
  controlsRef,
}: {
  controlsRef: RefObject<any | null>;
}) {
  const camera = useThree((s) => s.camera);
  const currentPos = useRef(new THREE.Vector3(0, 0, 3));
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));
  const initialized = useRef(false);

  useFrame((_, delta) => {
    const state = getCameraState();
    const controls = controlsRef.current;

    if (!initialized.current) {
      currentPos.current.copy(camera.position);
      currentLook.current.set(0, 0, 0);
      if (controls?.target) currentLook.current.copy(controls.target);
      initialized.current = true;
    }

    if (state.isTransitioning) {
      const target = resolveTarget(state.currentLevel, state.target.nodeId, new Map());
      const k = 1 - Math.pow(0.0015, delta);
      currentPos.current.lerp(target.pos, k);
      currentLook.current.lerp(target.look, k);
      camera.position.copy(currentPos.current);
      camera.lookAt(currentLook.current);
      if (controls) controls.target.copy(currentLook.current);

      if (
        currentPos.current.distanceTo(target.pos) < ARRIVE_EPSILON &&
        currentLook.current.distanceTo(target.look) < ARRIVE_EPSILON
      ) {
        useZUICameraStore.setState({ isTransitioning: false });
      }
    } else {
      currentPos.current.copy(camera.position);
      currentLook.current.copy(controls?.target ?? new THREE.Vector3());
    }
  });

  return null;
}

/* ── Scene ───────────────────────────────────────────────────────────── */

export function ZUIScene({ controlsRef }: ZUISceneProps) {
  const level = useZUICameraStore((s) => s.currentLevel);
  const targetNodeId = useZUICameraStore((s) => s.target.nodeId);

  // Build a fake MacroNode for the selected panel so ZoneOrbs / CreatorFaces
  // can derive their positions. The dome replaces the Sierpinski node map.
  const selectedNode = useMemo(() => {
    if (!targetNodeId) return null;
    // Direct panel match
    if (PANEL_POSITIONS[targetNodeId]) return fakePanelNode(targetNodeId);
    // Strip orb suffix to find parent panel
    const baseId = targetNodeId.replace(/-orb-\d+$/, '');
    if (PANEL_POSITIONS[baseId]) return fakePanelNode(baseId);
    return null;
  }, [targetNodeId]);

  const microOrbId = level === ZoomLevel.MICRO ? targetNodeId : null;

  return (
    <>
      <ZUICameraRig controlsRef={controlsRef} />

      {/* MACRO: Geodesic Dome with 3 curved panels (replaces Sierpinski) */}
      {level === ZoomLevel.MACRO && <GeodesicDome radius={8} detail={3} />}

      {level >= ZoomLevel.MESO && selectedNode && <ZoneOrbs node={selectedNode} />}
      {microOrbId && <CreatorFaces orbId={microOrbId} />}
    </>
  );
}
