import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NotificationStarfieldProps {
  isUrgent?: boolean;
  count?: number;
}

export function NotificationStarfield({ isUrgent = false, count = 2000 }: NotificationStarfieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { geometry, basePositions } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 8 + Math.random() * 6;

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      colors[i * 3]     = 0.0;
      colors[i * 3 + 1] = 0.83;
      colors[i * 3 + 2] = 1.0;

      sizes[i] = 0.5 + Math.random() * 1.5;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    return { geometry: geo, basePositions: positions.slice() };
  }, [count]);

  const material = useMemo(() => new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame((_, delta) => {
    timeRef.current += delta * (isUrgent ? 2.5 : 0.4);
    if (!pointsRef.current) return;

    const positions = geometry.attributes.position.array as Float32Array;
    const colors = geometry.attributes.color.array as Float32Array;
    const phases = geometry.attributes.phase.array as Float32Array;
    const t = timeRef.current;

    for (let i = 0; i < count; i++) {
      const phase = phases[i];
      const pulse = 0.92 + 0.08 * Math.sin(t * 1.8 + phase);

      positions[i * 3]     = basePositions[i * 3]     * pulse;
      positions[i * 3 + 1] = basePositions[i * 3 + 1] * pulse;
      positions[i * 3 + 2] = basePositions[i * 3 + 2] * pulse;

      if (isUrgent) {
        const urgency = 0.5 + 0.5 * Math.sin(t * 4 + phase);
        colors[i * 3]     = 0.8 + 0.2 * urgency;
        colors[i * 3 + 1] = 0.2 * (1 - urgency);
        colors[i * 3 + 2] = 0.2 * (1 - urgency);
      } else {
        colors[i * 3]     = 0.0;
        colors[i * 3 + 1] = 0.6 + 0.23 * Math.abs(Math.sin(t * 0.5 + phase));
        colors[i * 3 + 2] = 1.0;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;

    pointsRef.current.rotation.y += delta * (isUrgent ? 0.06 : 0.015);
    pointsRef.current.rotation.x += delta * (isUrgent ? 0.02 : 0.005);
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

export default NotificationStarfield;
