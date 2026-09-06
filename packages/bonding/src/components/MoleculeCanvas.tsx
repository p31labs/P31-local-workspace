// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// MoleculeCanvas: the main 3D scene
//
// Contains:
//   - R3F Canvas with PerspectiveCamera
//   - CoherenceArc (background color shift over 37min)
//   - MolecularWarp (molecular particle field + warp)
//   - All VoxelAtoms
//   - All BondBeams
//   - GhostSites (during drag)
//   - DragPreview (during drag)
//   - WCD-15: Bloom removed (AdditiveBlending on cores instead)
//   - OrbitControls (auto-rotate when idle)
// ═══════════════════════════════════════════════════════

import { Suspense, useCallback, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
// WCD-15: EffectComposer + Bloom removed — too heavy for tablet TBDR GPUs.
// Glow now faked via AdditiveBlending on atom cores (see VoxelAtom.tsx).
import { VoxelAtom } from './VoxelAtom';
import { BondBeam } from './BondBeam';
import { GhostSite } from './GhostSite';
import { DragPreview } from './DragPreview';
import { MolecularWarp } from './MolecularWarp';
import { CompletionBurst } from './CompletionBurst';
import { BondSpark } from './BondSpark';
import { PlacementRing } from './PlacementRing';
import { ELEMENTS } from '../data/elements';
import { useGameStore } from '../store/gameStore';
import { getAvailableBondSitePositions, generateFormula } from '../engine/chemistry';
import { getPersonality } from '../engine/personalities';
import type { PersonalityAnimationHint } from './VoxelAtom';

const COHERENCE_MS = 37 * 60 * 1000;
const BG_START = new THREE.Color('#000000');
const BG_END = new THREE.Color('#050308');

/**
 * CoherenceArc: shifts background from true black (#050505)
 * to a barely-warm tint (#0a0508) over the 37-minute coherence window.
 * Also manages scene fog for atmospheric depth.
 */
function CoherenceArc() {
  const sessionStartTime = useGameStore((s) => s.sessionStartTime);
  const { scene } = useThree();

  useFrame(() => {
    if (!scene.background) return;
    const bg = scene.background as THREE.Color;
    if (!sessionStartTime) {
      bg.copy(BG_START);
      return;
    }
    const phase = Math.min(
      (Date.now() - sessionStartTime) / COHERENCE_MS,
      1.0,
    );
    bg.copy(BG_START).lerp(BG_END, phase);
  });

  return null;
}

/**
 * CompletionZoom: brief camera zoom pulse on molecule completion.
 * Distance shrinks 10% over 0.3s, eases back over 0.8s.
 */
function CompletionZoom() {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const prevPhaseRef = useRef(gamePhase);
  const zoomRef = useRef<{ startTime: number; active: boolean }>({ startTime: 0, active: false });
  const { camera } = useThree();

  useEffect(() => {
    if (gamePhase === 'complete' && prevPhaseRef.current !== 'complete') {
      zoomRef.current = { startTime: performance.now() / 1000, active: true };
      // Also trigger warp
      useGameStore.getState().triggerWarp();
    }
    prevPhaseRef.current = gamePhase;
  }, [gamePhase]);

  useFrame((state) => {
    if (!zoomRef.current.active) return;
    const t = state.clock.elapsedTime - zoomRef.current.startTime;
    const baseDist = 5; // default camera Z

    if (t < 0.3) {
      // Zoom in
      const ease = t / 0.3;
      camera.position.z = baseDist - baseDist * 0.1 * ease;
    } else if (t < 1.1) {
      // Ease back
      const ease = 1 - Math.pow(1 - (t - 0.3) / 0.8, 3);
      camera.position.z = baseDist * 0.9 + baseDist * 0.1 * ease;
    } else {
      camera.position.z = baseDist;
      zoomRef.current.active = false;
    }
  });

  return null;
}


/**
 * AtomsWithPersonality: computes personality hint ONCE on completion,
 * then renders all VoxelAtoms with shared hint. Avoids N redundant
 * getPersonality() calls per frame.
 */
function AtomsWithPersonality({ atoms, gamePhase }: { atoms: ReturnType<typeof useGameStore.getState>['atoms']; gamePhase: string }) {
  const pHint = useMemo<PersonalityAnimationHint | null>(() => {
    if (gamePhase !== 'complete' || atoms.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const a of atoms) {
      counts[a.element] = (counts[a.element] ?? 0) + 1;
    }
    const formula = generateFormula(atoms);
    const p = getPersonality(formula, counts);
    return { speed: p.animationHint.speed, pulse: p.animationHint.pulse, vibrate: p.animationHint.vibrate, scale: p.animationHint.scale };
  }, [atoms, gamePhase]);

  return (
    <>
      {atoms.map((atom) => {
        const isNewest = atom.id === atoms[atoms.length - 1]?.id;
        const excitement = gamePhase === 'complete' ? 0.8 : isNewest && atoms.length > 1 ? 0.4 : 0.0;
        return (
          <VoxelAtom
            key={atom.id}
            element={ELEMENTS[atom.element]}
            position={[atom.position.x, atom.position.y, atom.position.z]}
            excitement={excitement}
            personalityHint={pHint}
          />
        );
      })}
    </>
  );
}

/**
 * Scene: all 3D content. Separated from Canvas for Suspense boundary.
 */
function Scene({ atmosphereCoherence }: { atmosphereCoherence: number }) {
  const atoms = useGameStore((s) => s.atoms);
  const bonds = useGameStore((s) => s.bonds);
  const dragging = useGameStore((s) => s.dragging);
  const snappedSite = useGameStore((s) => s.snappedSite);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const previewElement = useGameStore((s) => s.previewElement);

  // Bond site positions — expensive chemistry calc, depends only on atoms
  const bondSitePositions = useMemo(() => {
    if (atoms.length === 0) return [];
    const sites: {
      atomId: number | null;
      position: { x: number; y: number; z: number };
    }[] = [];
    for (const atom of atoms) {
      const unfilled = getAvailableBondSitePositions(atom, atoms);
      for (const pos of unfilled) {
        sites.push({
          atomId: atom.id,
          position: { x: pos.x, y: pos.y, z: pos.z },
        });
      }
    }
    return sites;
  }, [atoms]);

  // Ghost sites visibility — cheap filter on top of cached positions
  const ghostSites = useMemo(() => {
    if (gamePhase === 'complete') return [];
    if (!dragging && !(previewElement && atoms.length > 0)) return [];
    if (atoms.length === 0) {
      return [{ atomId: null as number | null, position: { x: 0, y: 0, z: 0 } }];
    }
    return bondSitePositions;
  }, [bondSitePositions, dragging, gamePhase, previewElement, atoms.length]);

  const selectedColor = dragging
    ? ELEMENTS[dragging].color
    : previewElement
      ? ELEMENTS[previewElement].color
      : '#ffffff';

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CoherenceArc />

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#fffaf0" />

      {/* WCD-15: Environment map — cheap cubemap for standard material reflections.
          background={false} keeps our void/CoherenceArc background visible. */}
      <Environment preset="city" background={false} />

      {/* Molecular field — element-colored particles */}
      <MolecularWarp coherence={atmosphereCoherence} />

      {/* Personality hint — computed ONCE on completion, shared across all atoms */}
      <AtomsWithPersonality atoms={atoms} gamePhase={gamePhase} />


      {/* Bond beams */}
      {bonds.map((bond) => {
        const from = atoms.find((a) => a.id === bond.from);
        const to = atoms.find((a) => a.id === bond.to);
        if (!from || !to) return null;
        return (
          <BondBeam
            key={bond.id}
            start={from.position}
            end={to.position}
            fromElement={from.element}
            toElement={to.element}
          />
        );
      })}

      {/* Ghost bond sites (visible during drag) */}
      {ghostSites.map((site, i) => {
        const isSnapped =
          snappedSite != null &&
          Math.abs(snappedSite.position.x - site.position.x) < 0.01 &&
          Math.abs(snappedSite.position.y - site.position.y) < 0.01 &&
          Math.abs(snappedSite.position.z - site.position.z) < 0.01;
        const parentAtom = site.atomId != null ? atoms.find((a) => a.id === site.atomId) : null;
        const parentPos: [number, number, number] | undefined = parentAtom
          ? [parentAtom.position.x, parentAtom.position.y, parentAtom.position.z]
          : undefined;
        return (
          <GhostSite
            key={`ghost-${site.atomId ?? 'center'}-${i}`}
            position={[site.position.x, site.position.y, site.position.z]}
            color={selectedColor}
            isSnapped={isSnapped}
            parentPosition={parentPos}
          />
        );
      })}

      {/* Drag preview (follows pointer) */}
      <DragPreview />

      {/* Completion supernova — 3D particle burst */}
      <CompletionBurst />

      {/* Bond formation sparks */}
      <BondSpark />

      {/* Atom placement rings */}
      <PlacementRing />

      {/* Completion camera zoom */}
      <CompletionZoom />

      {/* Camera controls — WCD-19: zoom clamped to prevent giant/tiny atoms */}
      <OrbitControls
        enablePan={false}
        enabled={!dragging}
        autoRotate={!dragging && atoms.length > 0}
        autoRotateSpeed={0.28 + 0.52 * atmosphereCoherence}
        minDistance={3}
        maxDistance={15}
        makeDefault
      />
    </>
  );
}

/**
 * MoleculeCanvas: the R3F Canvas wrapper.
 * Full viewport, flat tone mapping.
 */
export function MoleculeCanvas({
  atmosphereCoherence = 6.5 / 12,
}: {
  atmosphereCoherence?: number;
}) {
  const triggerWarp = useGameStore((s) => s.triggerWarp);
  const lastMissRef = useRef(0);

  const handlePointerMissed = useCallback(() => {
    const now = Date.now();
    if (now - lastMissRef.current < 400) {
      triggerWarp();
      lastMissRef.current = 0;
    } else {
      lastMissRef.current = now;
    }
  }, [triggerWarp]);

  return (
    <div style={{ width: '100%', height: '100%', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <Canvas
        flat
        onPointerMissed={handlePointerMissed}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('[BONDING] WebGL context lost — will restore');
          });
          canvas.addEventListener('webglcontextrestored', () => {
            console.log('[BONDING] WebGL context restored');
          });
        }}
      >
        {/* WCD-08: Y offset 0.3 centers molecule in the visual gap between TopBar and ElementDock */}
        <PerspectiveCamera makeDefault position={[0, 0.3, 5]} fov={50} />
        <Suspense fallback={
          <Html center>
            <div className="load-pulse" style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 14,
              letterSpacing: '0.1em',
              fontFamily: 'JetBrains Mono, monospace',
              textAlign: 'center',
            }}>
              <div className="spinner" style={{ width: 24, height: 24, borderColor: 'rgba(255,255,255,0.3)', borderRightColor: 'transparent', marginBottom: 8, marginInline: 'auto' }} />
              BONDING
            </div>
          </Html>
        }>
          <Scene atmosphereCoherence={atmosphereCoherence} />
        </Suspense>
      </Canvas>
    </div>
  );
}
