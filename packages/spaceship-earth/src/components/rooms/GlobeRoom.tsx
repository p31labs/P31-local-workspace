import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MESH_NODES = [
  { lat: 30.93,  lon: -81.96,  tier: 0 }, // Camden County, GA — Node Zero
  { lat: 33.74,  lon: -84.39,  tier: 1 }, // Atlanta
  { lat: 40.71,  lon: -74.01,  tier: 1 }, // New York
  { lat: 37.77,  lon: -122.42, tier: 1 }, // San Francisco
  { lat: 51.51,  lon: -0.13,   tier: 1 }, // London
  { lat: 35.68,  lon: 139.69,  tier: 1 }, // Tokyo
  { lat: -33.87, lon: 151.21,  tier: 1 }, // Sydney
  { lat: 48.85,  lon: 2.35,    tier: 1 }, // Paris
];

function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

const VERT = `
uniform float uTime;
attribute float aSize;
attribute float aDepth;
varying float vDepth;
void main() {
  vDepth = aDepth;
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  float pulse = 1.0 + 0.12 * sin(uTime * 1.2 + position.x * 2.5 + position.z * 1.7);
  gl_PointSize = aSize * pulse * (280.0 / -mvPos.z);
  gl_Position = projectionMatrix * mvPos;
}
`;

const FRAG = `
uniform vec3 uColor;
varying float vDepth;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float alpha = (0.5 - d) * 2.0 * vDepth * 0.9;
  gl_FragColor = vec4(uColor, alpha);
}
`;

export function GlobeRoom() {
  const groupRef = useRef<THREE.Group>(null);

  const { cloudGeo, cloudMat } = useMemo(() => {
    const N = 3000;
    const pos    = new Float32Array(N * 3);
    const sizes  = new Float32Array(N);
    const depths = new Float32Array(N);
    const golden = Math.PI * (3 - Math.sqrt(5)); // golden angle

    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const t = golden * i;
      pos[i * 3]     = r * Math.cos(t) * 2;
      pos[i * 3 + 1] = y * 2;
      pos[i * 3 + 2] = r * Math.sin(t) * 2;
      sizes[i]  = 0.7 + Math.random() * 0.7;
      depths[i] = 0.3 + Math.random() * 0.7;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aDepth',   new THREE.BufferAttribute(depths, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:  { value: 0 },
        uColor: { value: new THREE.Color('#00D4FF') },
      },
      vertexShader:   VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite:  false,
      blending: THREE.AdditiveBlending,
    });

    return { cloudGeo: geo, cloudMat: mat };
  }, []);

  const nodePositions = useMemo(
    () => MESH_NODES.map((n) => latLonToVec3(n.lat, n.lon, 2.06)),
    [],
  );

  const lineGeos = useMemo(() => {
    return nodePositions.map((a, i) =>
      new THREE.BufferGeometry().setFromPoints([a, nodePositions[(i + 1) % nodePositions.length]]),
    );
  }, [nodePositions]);

  const nodeMats = useMemo(
    () => ({
      zero: new THREE.MeshStandardMaterial({
        color: '#7A27FF', emissive: '#7A27FF', emissiveIntensity: 2.5,
        roughness: 0.1, metalness: 0.9,
      }),
      core: new THREE.MeshStandardMaterial({
        color: '#00FF88', emissive: '#00FF88', emissiveIntensity: 2.0,
        roughness: 0.2, metalness: 0.8,
      }),
    }),
    [],
  );

  const nodeGeos = useMemo(
    () => ({
      zero: new THREE.SphereGeometry(0.07, 16, 16),
      core: new THREE.SphereGeometry(0.04, 12, 12),
    }),
    [],
  );

  const haloGeo = useMemo(() => new THREE.SphereGeometry(2.18, 32, 32), []);
  const haloMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#001133', transparent: true, opacity: 0.4, side: THREE.BackSide }),
    [],
  );

  useEffect(
    () => () => {
      cloudGeo.dispose();
      cloudMat.dispose();
      lineGeos.forEach((g) => g.dispose());
      nodeMats.zero.dispose();
      nodeMats.core.dispose();
      nodeGeos.zero.dispose();
      nodeGeos.core.dispose();
      haloGeo.dispose();
      haloMat.dispose();
    },
    [cloudGeo, cloudMat, lineGeos, nodeMats, nodeGeos, haloGeo, haloMat],
  );

  useFrame(({ clock }) => {
    cloudMat.uniforms.uTime.value = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.07;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={haloGeo} material={haloMat} />
      <points geometry={cloudGeo} material={cloudMat} />
      {lineGeos.map((geo, i) => (
        <line key={i}>
          <primitive attach="geometry" object={geo} />
          <lineBasicMaterial color="#00FF88" transparent opacity={0.2} />
        </line>
      ))}
      {nodePositions.map((pos, i) => (
        <mesh
          key={i}
          geometry={i === 0 ? nodeGeos.zero : nodeGeos.core}
          material={i === 0 ? nodeMats.zero : nodeMats.core}
          position={pos}
        />
      ))}
    </group>
  );
}

export default GlobeRoom;
