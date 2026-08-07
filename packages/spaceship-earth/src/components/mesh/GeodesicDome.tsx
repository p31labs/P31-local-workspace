import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useZUICameraStore, ZoomLevel } from '@p31/shared/zui';

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

const PANEL_SPECS = {
  'dome-workshop': { label: 'Workshop', color: '#fb923c', cond: (cx: number, cy: number, _cz: number) => cy > 0.5 && cx < -0.5 },
  'dome-garden':   { label: 'Garden',   color: '#34d399', cond: (cx: number, cy: number, _cz: number) => cy > 0.5 && cx > 0.5 },
  'dome-atelier':  { label: 'Atelier',  color: '#c084fc', cond: (cx: number, cy: number, _cz: number) => cy < -0.5 },
} as const;

type PanelId = keyof typeof PANEL_SPECS;

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

function buildFaceGeo(
  faceList: [number, number, number][],
  verts: [number, number, number][],
): THREE.BufferGeometry {
  const pos = new Float32Array(faceList.length * 9);
  faceList.forEach(([a, b, c], i) => {
    pos[i * 9] = verts[a][0]; pos[i * 9 + 1] = verts[a][1]; pos[i * 9 + 2] = verts[a][2];
    pos[i * 9 + 3] = verts[b][0]; pos[i * 9 + 4] = verts[b][1]; pos[i * 9 + 5] = verts[b][2];
    pos[i * 9 + 6] = verts[c][0]; pos[i * 9 + 7] = verts[c][1]; pos[i * 9 + 8] = verts[c][2];
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function buildAllGeometries(radius: number, detail: number) {
  const { vertices, faces, edges } = buildIcosaSphereDome(radius, detail);

  const panelFaces: Record<PanelId, [number, number, number][]> = {
    'dome-workshop': [],
    'dome-garden': [],
    'dome-atelier': [],
  };
  const structureFaces: [number, number, number][] = [];

  const panelCenters: Record<PanelId, THREE.Vector3> = {} as any;
  const accum: Record<PanelId, THREE.Vector3> = {} as any;

  for (const face of faces) {
    const [a, b, c] = face;
    const cx = (vertices[a][0] + vertices[b][0] + vertices[c][0]) / 3;
    const cy = (vertices[a][1] + vertices[b][1] + vertices[c][1]) / 3;
    const cz = (vertices[a][2] + vertices[b][2] + vertices[c][2]) / 3;

    let key: PanelId | null = null;
    for (const [id, spec] of Object.entries(PANEL_SPECS)) {
      if (spec.cond(cx, cy, cz)) { key = id as PanelId; break; }
    }

    if (key) {
      panelFaces[key].push(face);
      if (!accum[key]) accum[key] = new THREE.Vector3();
      accum[key].x += cx; accum[key].y += cy; accum[key].z += cz;
    } else {
      structureFaces.push(face);
    }
  }

  for (const id of Object.keys(PANEL_SPECS) as PanelId[]) {
    const n = panelFaces[id].length;
    if (n > 0) {
      const a = accum[id];
      // Place label just outside the dome surface
      const dir = a.clone().normalize();
      panelCenters[id] = dir.multiplyScalar(radius * 1.12);
    } else {
      panelCenters[id] = new THREE.Vector3(0, 0, 0);
    }
  }

  const allGeo = buildFaceGeo(faces, vertices);

  const edgePos = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], i) => {
    edgePos[i * 6] = vertices[a][0]; edgePos[i * 6 + 1] = vertices[a][1]; edgePos[i * 6 + 2] = vertices[a][2];
    edgePos[i * 6 + 3] = vertices[b][0]; edgePos[i * 6 + 4] = vertices[b][1]; edgePos[i * 6 + 5] = vertices[b][2];
  });
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));

  return {
    panelGeos: Object.fromEntries(
      Object.entries(panelFaces).map(([id, fs]) => [id, buildFaceGeo(fs, vertices)])
    ) as Record<PanelId, THREE.BufferGeometry>,
    structureGeo: buildFaceGeo(structureFaces, vertices),
    allGeo,
    edgeGeo,
    panelCenters,
  };
}

interface GeodesicDomeProps {
  isUrgent?: boolean;
  radius?: number;
  detail?: number;
}

export function GeodesicDome({ isUrgent = false, radius = 8, detail = 3 }: GeodesicDomeProps) {
  const [hovered, setHovered] = useState<PanelId | null>(null);

  const data = useMemo(() => buildAllGeometries(radius, detail), [radius, detail]);

  useEffect(() => {
    const { panelGeos, structureGeo, allGeo, edgeGeo } = data;
    return () => {
      for (const g of Object.values(panelGeos)) g.dispose();
      structureGeo.dispose();
      allGeo.dispose();
      edgeGeo.dispose();
    };
  }, [data]);

  const accentColor = isUrgent ? '#cc6247' : '#00D4FF';

  return (
    <group>
      {/* Outer structural shell + 3 colored panels */}
      <group>
        {/* Structure faces (gray, non-panel faces) */}
        <mesh geometry={data.structureGeo}>
          <meshPhysicalMaterial
            color={isUrgent ? 0x1a0505 : 0x050508}
            roughness={0.15}
            metalness={0.5}
            transmission={0.6}
            thickness={0.8}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 3 curved panel meshes */}
        {(Object.entries(PANEL_SPECS) as [PanelId, typeof PANEL_SPECS[PanelId]][]).map(([id, spec]) => (
          <mesh
            key={id}
            geometry={data.panelGeos[id]}
            onClick={(e) => { e.stopPropagation(); useZUICameraStore.getState().zoomToNode(id, ZoomLevel.MESO); }}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(id); }}
            onPointerOut={() => setHovered(null)}
          >
            <meshStandardMaterial
              color={spec.color}
              emissive={spec.color}
              emissiveIntensity={hovered === id ? 0.55 : 0.12}
              roughness={0.5}
              metalness={0.1}
              transparent
              opacity={0.88}
              side={THREE.DoubleSide}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        ))}

        {/* Wireframe edge overlay */}
        <lineSegments geometry={data.edgeGeo}>
          <lineBasicMaterial
            color={accentColor}
            transparent
            opacity={isUrgent ? 0.80 : 0.28}
          />
        </lineSegments>
      </group>

      {/* Inner navigation shell */}
      <group scale={0.97}>
        <mesh geometry={data.allGeo}>
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
        <lineSegments geometry={data.edgeGeo}>
          <lineBasicMaterial
            color={accentColor}
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      </group>

      {/* Panel labels */}
      {(Object.entries(PANEL_SPECS) as [PanelId, typeof PANEL_SPECS[PanelId]][]).map(([id, spec]) => (
        <Text
          key={`label-${id}`}
          position={data.panelCenters[id]}
          fontSize={0.55}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="/fonts/JetBrainsMono-Bold.ttf"
          outlineWidth={0.08}
          outlineColor="#000000"
        >
          {spec.label}
        </Text>
      ))}
    </group>
  );
}

export default GeodesicDome;
