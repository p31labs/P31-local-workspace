import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── 1. Authentic P31 Geodesic Math ──────────────────────────────────────────
const PHI = (1 + Math.sqrt(5)) / 2;

const RAW_ICOSA_VERTS: [number, number, number][] = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
];

const ICOSA_FACES: [number, number, number][] = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
];

function buildIcosaSphereDome(rad: number, subs: number) {
  let vertices: [number, number, number][] = RAW_ICOSA_VERTS.map(([x, y, z]) => {
    const l = Math.hypot(x, y, z);
    return [(x / l) * rad, (y / l) * rad, (z / l) * rad];
  });

  let faces: [number, number, number][] = ICOSA_FACES.map(f => [...f] as [number, number, number]);

  for (let s = 0; s < subs; s++) {
    const cache: Record<string, number> = {};
    const getMid = (i: number, j: number): number => {
      const k = `${Math.min(i, j)}_${Math.max(i, j)}`;
      if (cache[k] !== undefined) return cache[k];
      const a = vertices[i], b = vertices[j];
      const nx = a[0] + b[0], ny = a[1] + b[1], nz = a[2] + b[2];
      const len = Math.hypot(nx, ny, nz) || 1;
      const idx = vertices.length;
      vertices.push([(nx / len) * rad, (ny / len) * rad, (nz / len) * rad]);
      cache[k] = idx;
      return idx;
    };

    const nf: [number, number, number][] = [];
    for (const [a, b, c] of faces) {
      const ab = getMid(a, b), bc = getMid(b, c), ca = getMid(c, a);
      nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = nf;
  }

  const edgeSet = new Set<string>();
  for (const [a, b, c] of faces) {
    edgeSet.add(`${Math.min(a, b)}_${Math.max(a, b)}`);
    edgeSet.add(`${Math.min(b, c)}_${Math.max(b, c)}`);
    edgeSet.add(`${Math.min(a, c)}_${Math.max(a, c)}`);
  }
  const edges = Array.from(edgeSet).map(e => e.split('_').map(Number) as [number, number]);

  return { vertices, faces, edges };
}

function buildGeometries(radius: number, detail: number) {
  const { vertices, faces, edges } = buildIcosaSphereDome(radius, detail);

  // Face geometry
  const facePositions = new Float32Array(faces.length * 9);
  faces.forEach((face, i) => {
    for (let v = 0; v < 3; v++) {
      facePositions[i * 9 + v * 3]     = vertices[face[v]][0];
      facePositions[i * 9 + v * 3 + 1] = vertices[face[v]][1];
      facePositions[i * 9 + v * 3 + 2] = vertices[face[v]][2];
    }
  });
  const faceGeo = new THREE.BufferGeometry();
  faceGeo.setAttribute('position', new THREE.BufferAttribute(facePositions, 3));
  faceGeo.computeVertexNormals();

  // Edge geometry
  const edgePositions = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], i) => {
    edgePositions[i * 6]     = vertices[a][0];
    edgePositions[i * 6 + 1] = vertices[a][1];
    edgePositions[i * 6 + 2] = vertices[a][2];
    edgePositions[i * 6 + 3] = vertices[b][0];
    edgePositions[i * 6 + 4] = vertices[b][1];
    edgePositions[i * 6 + 5] = vertices[b][2];
  });
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));

  return { faceGeo, edgeGeo };
}

// ── 2. React Three Fiber Component ──────────────────────────────────────────
interface GeodesicDomeProps {
  isUrgent?: boolean;
  radius?: number;
  detail?: number;
}

export function GeodesicDome({ isUrgent = false, radius = 8, detail = 3 }: GeodesicDomeProps) {
  const outerRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);

  const { faceGeo, edgeGeo } = useMemo(
    () => buildGeometries(radius, detail),
    [radius, detail],
  );

  useEffect(() => () => { faceGeo.dispose(); edgeGeo.dispose(); }, [faceGeo, edgeGeo]);

  useFrame((_, delta) => {
    const speed = isUrgent ? 0.15 : 0.05;
    if (outerRef.current) {
      outerRef.current.rotation.y += delta * speed;
      outerRef.current.rotation.x += delta * speed * 0.5;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * speed * 0.8;
      innerRef.current.rotation.z += delta * speed * 0.3;
    }
  });

  const accentColor = isUrgent ? '#cc6247' : '#00D4FF';

  return (
    <group>
      {/* Outer cockpit shell */}
      <group ref={outerRef}>
        <mesh geometry={faceGeo}>
          <meshPhysicalMaterial
            color={isUrgent ? 0x1a0505 : 0x050508}
            emissive={isUrgent ? new THREE.Color(0x330000) : new THREE.Color(0x000000)}
            roughness={0.15}
            metalness={0.5}
            transmission={0.6}
            thickness={0.8}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={1}
          />
        </mesh>
        <lineSegments geometry={edgeGeo}>
          <lineBasicMaterial
            color={accentColor}
            transparent
            opacity={isUrgent ? 0.80 : 0.25}
          />
        </lineSegments>
      </group>

      {/* Inner navigation shell */}
      <group ref={innerRef} scale={0.97}>
        <mesh geometry={faceGeo}>
          <meshPhysicalMaterial
            color={0x080810}
            roughness={0.1}
            metalness={0.0}
            transmission={0.9}
            thickness={0.3}
            transparent
            opacity={0.30}
            side={THREE.DoubleSide}
          />
        </mesh>
        <lineSegments geometry={edgeGeo}>
          <lineBasicMaterial
            color={accentColor}
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      </group>
    </group>
  );
}

export default GeodesicDome;
