// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// DragPreview — Ghost atom that follows the pointer
//
// Matches VoxelAtom's visual character: smooth sphere,
// additive glow, element emissive color. Not a faceted
// icosahedron — a soft orb that looks like it belongs
// in the same universe as the placed atoms.
//
// All snap/raycast/lerp mechanics preserved exactly.
// Only the visual rendering changed.
// ═══════════════════════════════════════════════════════

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { ELEMENTS } from '../data/elements';
import { getAvailableBondSitePositions } from '../engine/chemistry';

// Pre-allocated objects (zero GC pressure in render loop)
const _ndc = new THREE.Vector2();
const _raycaster = new THREE.Raycaster();
const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _intersection = new THREE.Vector3();
const _snapTarget = new THREE.Vector3();
const _snappedPos = new THREE.Vector3();

const SNAP_RADIUS = 2.0;
const UNSNAP_RADIUS = 2.5;
const LERP_DAMPING = 10.0;
const EPSILON = 0.01;

// Smooth sphere matching VoxelAtom
const PREVIEW_GEOMETRY = new THREE.SphereGeometry(0.5, 24, 24);

export function DragPreview() {
  const dragging = useGameStore((s) => s.dragging);
  const dragPointer = useGameStore((s) => s.dragPointer);
  const snappedSite = useGameStore((s) => s.snappedSite);
  const atoms = useGameStore((s) => s.atoms);
  const { camera } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(0, 0, -10));
  const snapTargetsRef = useRef<
    { atomId: number | null; position: THREE.Vector3 }[]
  >([]);

  // Recompute snap targets when atoms change
  const atomsLen = atoms.length;
  const prevAtomsLen = useRef(-1);
  if (prevAtomsLen.current !== atomsLen) {
    prevAtomsLen.current = atomsLen;
    const targets: { atomId: number | null; position: THREE.Vector3 }[] = [];
    if (atoms.length === 0) {
      targets.push({ atomId: null, position: new THREE.Vector3(0, 0, 0) });
    } else {
      for (const atom of atoms) {
        const sites = getAvailableBondSitePositions(atom, atoms);
        for (const pos of sites) {
          targets.push({ atomId: atom.id, position: pos });
        }
      }
      // WCD-48: When all bonds are filled, add a "new start" snap target
      if (targets.length === 0) {
        let cx = 0, cy = 0, cz = 0;
        for (const atom of atoms) {
          cx += atom.position.x;
          cy += atom.position.y;
          cz += atom.position.z;
        }
        cx /= atoms.length;
        cy /= atoms.length;
        cz /= atoms.length;
        targets.push({ atomId: null, position: new THREE.Vector3(cx + 2.5, cy, cz) });
      }
    }
    snapTargetsRef.current = targets;
  }

  useFrame((_state, delta) => {
    if (!dragging || !dragPointer || !groupRef.current) return;

    // Convert screen coords to 3D via raycast onto z=0 plane
    _ndc.set(
      (dragPointer.x / window.innerWidth) * 2 - 1,
      -(dragPointer.y / window.innerHeight) * 2 + 1,
    );
    _raycaster.setFromCamera(_ndc, camera);
    const hit = _raycaster.ray.intersectPlane(_plane, _intersection);

    let targetPos: THREE.Vector3;
    if (snappedSite) {
      targetPos = _snapTarget.set(
        snappedSite.position.x,
        snappedSite.position.y,
        snappedSite.position.z,
      );
    } else if (hit) {
      targetPos = _snapTarget.copy(_intersection);
    } else {
      return;
    }

    // Snap detection — Fitts's Law radius
    if (hit && !snappedSite) {
      let nearestDist = Infinity;
      let nearest: (typeof snapTargetsRef.current)[number] | null = null;
      for (const target of snapTargetsRef.current) {
        const d = _intersection.distanceTo(target.position);
        if (d < SNAP_RADIUS && d < nearestDist) {
          nearestDist = d;
          nearest = target;
        }
      }
      if (nearest) {
        useGameStore.getState().snapToSite(nearest.atomId, {
          x: nearest.position.x,
          y: nearest.position.y,
          z: nearest.position.z,
        });
      }
    }

    // Unsnap with hysteresis
    if (hit && snappedSite) {
      _snappedPos.set(
        snappedSite.position.x,
        snappedSite.position.y,
        snappedSite.position.z,
      );
      if (_intersection.distanceTo(_snappedPos) > UNSNAP_RADIUS) {
        useGameStore.getState().unsnapFromSite();
      }
    }

    // Delta-scaled lerp — frame-rate independent
    const dampingFactor = snappedSite ? LERP_DAMPING * 2 : LERP_DAMPING;
    const alpha = 1 - Math.exp(-dampingFactor * delta);
    currentPos.current.lerp(targetPos, alpha);

    // Epsilon snap — prevents asymptotic approach
    if (currentPos.current.distanceTo(targetPos) < EPSILON) {
      currentPos.current.copy(targetPos);
    }

    groupRef.current.position.copy(currentPos.current);
    groupRef.current.visible = true;
  });

  if (!dragging) return null;

  const element = ELEMENTS[dragging];
  const isSnapped = snappedSite != null;
  const clampedSize = Math.min(0.65, element.size);

  return (
    <group ref={groupRef} visible={false} scale={clampedSize}>
      {/* Shell — ghostly outline, same character as VoxelAtom */}
      <mesh geometry={PREVIEW_GEOMETRY}>
        <meshBasicMaterial
          color={element.color}
          transparent
          opacity={isSnapped ? 0.4 : 0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Core — emissive center glow */}
      <mesh geometry={PREVIEW_GEOMETRY} scale={0.7}>
        <meshBasicMaterial
          color={element.emissive}
          transparent
          opacity={isSnapped ? 0.8 : 0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
