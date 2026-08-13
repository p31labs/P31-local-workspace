import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

function scanScene(scene: THREE.Scene): void {
  const counts = { lines: 0, points: 0, instances: 0, meshes: 0 };
  scene.traverse((obj: THREE.Object3D) => {
    if ((obj as THREE.Line).isLine) counts.lines += 1;
    if ((obj as THREE.Points).isPoints) counts.points += 1;
    if ((obj as THREE.InstancedMesh).isInstancedMesh) counts.instances += 1;
    if ((obj as THREE.Mesh).isMesh) counts.meshes += 1;
  });
  (window as any).__p31_scene = counts;
}

export default function SceneProbe() {
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const canProbe =
      import.meta.env.MODE !== 'production' ||
      (typeof window !== 'undefined' && (window as any).__P31_VERIFY__);
    if (!canProbe || !scene) return () => {};

    const scan = () => scanScene(scene);
    scan();
    const id = window.setInterval(scan, 400);
    return () => window.clearInterval(id);
  }, [scene]);

  return null;
}
