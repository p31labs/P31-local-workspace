import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';

extend({ THREE });

interface Branch {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  depth: number;
}

/**
 * Recursive L-system bonsai with PID-driven branch angles.
 * P-gain → immediate branch straightening
 * I-accumulator → trunk thickness
 * D-filter → branch tip extension (future growth lines)
 * Grounding Wire ("Delta Reset") → prune to trunk, reset gains, regrow.
 */
export function CyberneticBonsaiScene() {
  const groupRef = useRef<THREE.Group>(null);
  const branchesRef = useRef<Branch[]>([]);
  // Material template — cloned per-branch to avoid shared-state visual artifacts
  const baseMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xcda852,
    wireframe: true,
    transparent: true,
    opacity: 0.7,
  }), []);

  // PID gains (initial defaults)
  const [pGain, setPGain] = useState(0.5);
  const [iGain, setIGain] = useState(0.3);
  const [dGain, setDGain] = useState(0.2);

  // Prune flag: when true, only trunk is present
  const [pruned, setPruned] = useState(false);

  // Listen for self-care logging events to tune PID
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { action } = e.detail;
      if (action === 'sighs') setPGain(g => Math.min(1, g + 0.1));
      if (action === 'sleep') setIGain(g => Math.min(1, g + 0.1));
      if (action === 'tasks') setDGain(g => Math.min(1, g + 0.1));
    };
    window.addEventListener('p31:pidAction', handler as EventListener);
    return () => window.removeEventListener('p31:pidAction', handler as EventListener);
  }, []);

  // Grounding wire drop → reset gains, prune, then regrow after 2s
  useEffect(() => {
    const handler = () => {
      setPGain(0.5);
      setIGain(0.3);
      setDGain(0.2);
      setPruned(true);
      setTimeout(() => setPruned(false), 2000);
    };
    window.addEventListener('p31:groundingWireDrop', handler);
    return () => window.removeEventListener('p31:groundingWireDrop', handler);
  }, []);

  // Build recursive tree; gains and prune flag captured from closure
  const buildTree = (prune: boolean) => {
    const group = new THREE.Group();
    branchesRef.current = [];

    const cylinderGeo = new THREE.CylinderGeometry(0.02, 0.05, 1, 6);
    cylinderGeo.translate(0, 0.5, 0); // pivot at base

    /**
     * addBranch: attaches a branch mesh to `parent`.
     * - depth: remaining recursion depth (4 = trunk)
     * - length: unscaled branch length
     * - angle: orientation Euler (applied to branch mesh)
     * - parent: parent Object3D to attach to
     * - parentTipY: Y position of parent's tip in parent-local space (for non-trunk placement)
     */
    const addBranch = (depth: number, length: number, angle: THREE.Euler, parent: THREE.Object3D, parentTipY: number) => {
      if (depth <= 0) return;

      // Spread reduction from P-gain (straighter branches when P high)
      const spread = Math.PI / 6 + (1 - pGain) * 0.3;

      // D-gain extends tip length for terminal branches (depth <= 1)
      let effectiveLength = length;
      if (depth <= 1) {
        effectiveLength = length * (1 + dGain * 0.2);
      }

      // Clone material for independent visual control
      const material = baseMaterial.clone();
      const branch = new THREE.Mesh(cylinderGeo, material);
      branch.position.set(0, parentTipY, 0);
      branch.rotation.set(angle.x, angle.y, angle.z);

      // I-gain affects trunk thickness (depth 4 = trunk/origin)
      let radiusScale = 1;
      if (depth === 4) {
        radiusScale = 1 + iGain * 0.5;
      }
      branch.scale.set(radiusScale, effectiveLength, radiusScale);

      parent.add(branch);
      branchesRef.current.push({ mesh: branch, material, depth });

      // If prune is active, stop recursion after this branch
      if (prune) return;

      // Sub-branches (3-way) — emanate from THIS branch's tip
      const subLen = effectiveLength * 0.75;
      const dir1 = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(spread, 0, 0));
      const dir2 = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(-spread * 0.6, Math.PI * 0.3, 0));
      const dir3 = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(-spread * 0.6, -Math.PI * 0.3, 0));

      for (const dir of [dir1, dir2, dir3]) {
        const nextAngle = new THREE.Euler().setFromQuaternion(
          new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
        );
        addBranch(depth - 1, subLen, nextAngle, branch, effectiveLength);
      }
    };

    // Start trunk: parentTipY = 0 (origin), depth 4
    addBranch(4, 1.2, new THREE.Euler(0, 0, 0), group, 0);
    return group;
  };

  const rootGroup = useMemo(() => buildTree(pruned), [pGain, iGain, dGain, pruned]);

  // Dispose previous tree on rebuild / unmount to avoid GPU leaks
  useEffect(() => {
    return () => {
      if (groupRef.current) {
        groupRef.current.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
              } else {
                obj.material.dispose();
              }
            }
          }
        });
      }
    };
  }, []); // Run cleanup only on unmount (empty deps); rebuilds are GC'd by React

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.001;

    const pulse = 0.5 + Math.sin(Date.now() / 800) * 0.2;
    branchesRef.current.forEach((b) => {
      b.material.opacity = 0.4 + pulse * 0.3 - b.depth * 0.1;
    });
  });

  return <primitive object={rootGroup} ref={groupRef} />;
}

export default CyberneticBonsaiScene;