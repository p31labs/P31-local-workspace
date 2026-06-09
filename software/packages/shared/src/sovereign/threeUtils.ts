import * as THREE from 'three';

export const disposeThreeNode = (node: THREE.Object3D) => {
  if (!node) return;
  while (node.children && node.children.length > 0) {
    disposeThreeNode(node.children[0]);
    node.remove(node.children[0]);
  }
  if ('geometry' in node && node.geometry) (node.geometry as THREE.BufferGeometry).dispose();
  if ('material' in node && node.material) {
    if (Array.isArray(node.material)) node.material.forEach((m: THREE.Material) => m.dispose());
    else (node.material as THREE.Material).dispose();
  }
};
