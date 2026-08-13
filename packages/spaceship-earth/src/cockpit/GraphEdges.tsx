/**
 * @file cockpit/GraphEdges.tsx — Data-driven dome edges
 *
 * Reads the canonical edge layer (`useActiveEdgeData`) and draws each edge as a
 * polyline through its vertices, relinked to the layout-settled endpoints when
 * available. Style (color / opacity / dash / glow / animation) comes straight
 * from the EdgeData carried by the mapper — no static EDGES table, no
 * hardcoded colors.
 *
 * Lines are built imperatively (`<primitive>`) because `line` collides with the
 * SVG intrinsic element in JSX typing.
 */

import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useActiveEdgeData } from '../store/datasetStore';
import { useGraphLayout } from '../hooks/useGraphLayout';
import { useShipStore } from '../store/shipStore';
import type { EdgeData } from '../engine/dataConnectors';

const MAX_EDGES = 512;

function EdgeLine({ edge, path }: { edge: EdgeData; path: [number, number, number][] }) {
  const mainRef = useRef<THREE.LineBasicMaterial>(null!);
  const glowRef = useRef<THREE.LineBasicMaterial>(null!);
  const spoons = useShipStore((s) => s.spoons);

  const style = edge.style;

  const baseColor = useMemo(
    () => (style.color ? new THREE.Color(style.color) : new THREE.Color(0x22d3ee)),
    [style.color],
  );

  const main = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(path.flat()), 3));
    const isDashed = Boolean(style.dasharray);
    const material = isDashed
      ? new THREE.LineDashedMaterial({
          color: baseColor,
          transparent: true,
          opacity: style.opacity ?? 0.7,
          depthWrite: false,
          dashSize: 1,
          gapSize: 0.75,
        })
      : new THREE.LineBasicMaterial({
          color: baseColor,
          transparent: true,
          opacity: style.opacity ?? 0.7,
          depthWrite: false,
        });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    if (isDashed) line.computeLineDistances();
    return line;
  }, [path, style.dasharray, style.opacity, baseColor]);

  const glow = useMemo(() => {
    if (!style.glow) return null;
    const material = new THREE.LineBasicMaterial({
      color: baseColor.clone().multiplyScalar(2),
      transparent: true,
      opacity: (style.opacity ?? 0.7) * 0.2,
      depthWrite: false,
    });
    const line = new THREE.Line(main.geometry, material);
    line.frustumCulled = false;
    return line;
  }, [style.glow, style.opacity, baseColor, main.geometry]);

  useEffect(() => {
    mainRef.current = main.material as THREE.LineBasicMaterial;
    if (glow) glowRef.current = glow.material as THREE.LineBasicMaterial;
  }, [main, glow]);

  // Dispose the imperative line resources when an edge is rebuilt (path/style
  // change re-keys the EdgeLine) or the edge layer unmounts.
  useEffect(() => () => {
    main.geometry.dispose();
    main.material.dispose();
    glow?.material.dispose();
  }, [main, glow]);

  useFrame(({ clock }) => {
    const base = style.opacity ?? 0.7;
    let factor = 1;
    if (spoons >= 2) {
      const t = clock.getElapsedTime();
      const speed = (style.pulseIntensity ?? 1) * (spoons / 5);
      switch (style.animation) {
        case 'breathe':
          factor = 0.75 + 0.25 * Math.sin(t * speed * 0.8);
          break;
        case 'pulse':
          factor = 0.45 + 0.55 * Math.abs(Math.sin(t * speed * 2));
          break;
        case 'subtle-glow':
          factor = 0.85 + 0.15 * Math.sin(t * speed);
          break;
        default:
          factor = 1;
      }
    }
    if (mainRef.current) mainRef.current.opacity = base * factor;
    if (glowRef.current) glowRef.current.opacity = base * 0.2 * factor;
  });

  return (
    <group name="edge">
      {glow && <primitive object={glow} />}
      <primitive object={main} />
    </group>
  );
}

export default function GraphEdges() {
  const edgeData = useActiveEdgeData();
  const { positions, status, strategy } = useGraphLayout();

  const edges = useMemo(() => edgeData.slice(0, MAX_EDGES), [edgeData]);

  const paths = useMemo(() => {
    const out: { edge: EdgeData; path: [number, number, number][] }[] = [];
    for (const edge of edges) {
      const verts = edge.vertices;
      if (!verts || verts.length < 2) continue;
      let path: [number, number, number][] = verts as [number, number, number][];
      const s = positions?.[edge.source];
      const t = positions?.[edge.target];
      if (s || t) {
        // Relink the geodesic polyline to the settled endpoints.
        path = [s ?? path[0], ...path.slice(1, -1), t ?? path[path.length - 1]];
      }
      out.push({ edge, path });
    }
    return out;
  }, [edges, positions]);

  const hidden = status === 'settling' && strategy === 'locked-only' && positions === null;
  if (hidden || paths.length === 0) return null;

  return (
    <group name="graph-edges">
      {paths.map(({ edge, path }, i) => (
        <EdgeLine key={`${edge.source}-${edge.target}-${i}`} edge={edge} path={path} />
      ))}
    </group>
  );
}
