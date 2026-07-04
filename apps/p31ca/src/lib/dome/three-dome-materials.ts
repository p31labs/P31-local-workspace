import * as THREE from "three";

/** /dome panel blocks (no glass transmission — matches product shell). */
export function makeDomeCockpitFaceMaterial(
  assignment: {
    glow: number;
    color: THREE.Color;
  } | null,
  lite: boolean
): THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
  if (assignment) {
    const hot = assignment.glow >= 1.0;
    if (lite) {
      return new THREE.MeshStandardMaterial({
        color: assignment.color,
        emissive: assignment.color.clone().multiplyScalar(hot ? 0.6 : 0.3),
        emissiveIntensity: hot ? 2.0 : 1.0,
        roughness: 0.25,
        metalness: 0.4,
        transparent: true,
        opacity: 0.9,
        side: THREE.FrontSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: assignment.color,
      emissive: assignment.color.clone().multiplyScalar(hot ? 0.6 : 0.3),
      emissiveIntensity: hot ? 3.0 : 1.2,
      roughness: 0.15,
      metalness: 0.5,
      transparent: true,
      opacity: 0.9,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
    });
  }
  if (lite) {
    return new THREE.MeshStandardMaterial({
      color: 0x050508,
      emissive: 0x000000,
      roughness: 0.65,
      metalness: 0.15,
      transparent: true,
      opacity: 0.52,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: 0x050508,
    emissive: 0x000000,
    roughness: 0.6,
    metalness: 0.2,
    transparent: true,
    opacity: 0.52,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
  });
}

/** Hub landing: glass-forward panels + inner shell (transmission off in lite). */
export function makeHubFaceMaterial(
  assignment: {
    glow: number;
    color: THREE.Color;
  } | null,
  lite: boolean
): THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
  if (assignment) {
    const hot = assignment.glow >= 1.0;
    if (lite) {
      return new THREE.MeshStandardMaterial({
        color: assignment.color,
        emissive: assignment.color.clone().multiplyScalar(hot ? 0.6 : 0.3),
        emissiveIntensity: hot ? 2.2 : 1.0,
        roughness: 0.22,
        metalness: 0.35,
        transparent: true,
        opacity: 0.88,
        side: THREE.FrontSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: assignment.color,
      emissive: assignment.color.clone().multiplyScalar(hot ? 0.6 : 0.3),
      emissiveIntensity: hot ? 3.0 : 1.2,
      roughness: 0.08,
      metalness: 0.3,
      transmission: 0.6,
      thickness: 0.8,
      transparent: true,
      opacity: 0.85,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
    });
  }
  if (lite) {
    return new THREE.MeshStandardMaterial({
      color: 0x050508,
      emissive: 0x000000,
      roughness: 0.55,
      metalness: 0.12,
      transparent: true,
      opacity: 0.32,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: 0x050508,
    emissive: 0x000000,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.7,
    thickness: 0.5,
    transparent: true,
    opacity: 0.3,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
  });
}

export function makeHubInnerShellMaterial(lite: boolean): THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
  if (lite) {
    return new THREE.MeshStandardMaterial({
      color: 0x080810,
      roughness: 0.55,
      metalness: 0.08,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: 0x080810,
    roughness: 0.1,
    metalness: 0.0,
    transmission: 0.9,
    thickness: 0.3,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
}
