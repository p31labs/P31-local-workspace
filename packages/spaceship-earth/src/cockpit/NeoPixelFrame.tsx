import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';
import { icosahedronGeodesic } from '../math/geodesic';

const DOME_RADIUS = 12;
const DEFAULT_SEGMENTS_PER_EDGE = 20;
const PIXEL_RADIUS = 0.045;
const PIXEL_GAP = 0.01;

const LED_MODE_MAP: Record<string, number> = {
  rainbow: 0,
  chase: 1,
  solid: 2,
  breath: 3,
  gradient: 4,
  'dual-chase': 5,
  off: 6,
};

interface NeoPixelFrameProps {
  segmentCount?: number;
}

export default function NeoPixelFrame({ segmentCount = 9600 }: NeoPixelFrameProps) {
  const ledMode = useShipStore((s) => s.ledMode);
  const ledSpeed = useShipStore((s) => s.ledSpeed);
  const ledColor = useShipStore((s) => s.ledColor);
  const ledBrightness = useShipStore((s) => s.ledBrightness);
  const ledColors = useShipStore((s) => s.ledColors);

  const ref = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geo = useMemo(() => new THREE.CylinderGeometry(PIXEL_RADIUS, PIXEL_RADIUS, 1, 6, 1, false), []);

  const { matrices, totalSegments } = useMemo(() => {
    const shell = icosahedronGeodesic(DOME_RADIUS, 2);
    const allSegments: { pos: THREE.Vector3; dir: THREE.Vector3; len: number }[] = [];
    const dummy = new THREE.Object3D();
    const quat = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);

    shell.edges.forEach(([a, b]) => {
      const start = new THREE.Vector3(...shell.vertices[a]);
      const end = new THREE.Vector3(...shell.vertices[b]);
      const dir = new THREE.Vector3().copy(end).sub(start);
      const len = dir.length();
      const dirNorm = dir.clone().normalize();
      const segLen = len / DEFAULT_SEGMENTS_PER_EDGE;

      for (let i = 0; i < DEFAULT_SEGMENTS_PER_EDGE; i++) {
        const t = (i + 0.5) / DEFAULT_SEGMENTS_PER_EDGE;
        const pos = new THREE.Vector3().copy(start).add(dirNorm.clone().multiplyScalar(t * len));
        quat.setFromUnitVectors(up, dirNorm);
        dummy.position.copy(pos);
        dummy.rotation.setFromQuaternion(quat);
        dummy.scale.set(1, segLen - PIXEL_GAP, 1);
        dummy.updateMatrix();
        allSegments.push({ pos: pos.clone(), dir: dirNorm.clone(), len });
      }
    });

    const total = allSegments.length;
    const count = Math.min(segmentCount, total);
    const stride = total / count;
    const results: THREE.Matrix4[] = [];
    const indices = new Set<number>();

    for (let k = 0; k < count; k++) {
      const srcIdx = Math.min(Math.floor(k * stride), total - 1);
      if (indices.has(srcIdx)) continue;
      indices.add(srcIdx);
      const seg = allSegments[srcIdx];
      dummy.position.copy(seg.pos);
      dummy.rotation.setFromQuaternion(quat.setFromUnitVectors(up, seg.dir));
      dummy.scale.set(1, seg.len / DEFAULT_SEGMENTS_PER_EDGE - PIXEL_GAP, 1);
      dummy.updateMatrix();
      results.push(dummy.matrix.clone());
    }

    return { matrices: results, totalSegments: results.length };
  }, [segmentCount]);

  useEffect(() => {
    if (!ref.current) return;
    matrices.forEach((m, i) => ref.current!.setMatrixAt(i, m));
    ref.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMode: { value: LED_MODE_MAP[ledMode] ?? 0 },
          uSpeed: { value: ledSpeed / 10 },
          uColor: { value: new THREE.Color(ledColor) },
          uBrightness: { value: ledBrightness / 100 },
          uColor1: { value: new THREE.Color(ledColors[0] ?? '#ff9944') },
          uColor2: { value: new THREE.Color(ledColors[1] ?? '#22d3ee') },
          uTotal: { value: 9600.0 },
        },
        vertexShader: `
          varying vec3 vPosition;
          varying float vInstanceId;

          void main() {
            vPosition = (instanceMatrix * vec4(position, 1.0)).xyz;
            vInstanceId = float(gl_InstanceID);
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform int uMode;
          uniform float uSpeed;
          uniform vec3 uColor;
          uniform float uBrightness;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform float uTotal;

          varying vec3 vPosition;
          varying float vInstanceId;

          vec3 hsl2rgb(vec3 c) {
            vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
            return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
          }

          void main() {
            vec3 finalColor = uColor;
            float brightness = uBrightness;
            float id = vInstanceId / max(uTotal, 1.0);

            if (uMode == 0) {
              float hue = mod(vPosition.y * 0.2 + uTime * uSpeed * 0.25, 1.0);
              float shimmer = 0.6 + 0.4 * sin(vInstanceId * 0.05 + uTime * 1.5);
              finalColor = hsl2rgb(vec3(hue, 1.0, shimmer * 0.9));
            } else if (uMode == 1) {
              float phase = mod(uTime * uSpeed * 0.15, 1.0);
              float dist = mod(id - phase + 1.0, 1.0);
              float intensity = max(0.0, 1.0 - dist * 4.0);
              brightness *= intensity;
            } else if (uMode == 2) {
              float microPulse = 0.85 + 0.15 * sin(vInstanceId * 0.03 + uTime);
              brightness *= microPulse;
            } else if (uMode == 3) {
              float breathe = 0.3 + 0.7 * (0.5 + 0.5 * sin(uTime * uSpeed * 0.15));
              brightness *= breathe;
            } else if (uMode == 4) {
              float frac = mod(id + uTime * uSpeed * 0.15, 1.0);
              finalColor = mix(uColor1, uColor2, frac);
            } else if (uMode == 5) {
              float phase0 = mod(uTime * uSpeed * 0.15, 1.0);
              float phase1 = mod(phase0 + 0.5, 1.0);
              float dist0 = mod(id - phase0 + 1.0, 1.0);
              float dist1 = mod(id - phase1 + 1.0, 1.0);
              float int0 = max(0.0, 1.0 - dist0 * 4.0);
              float int1 = max(0.0, 1.0 - dist1 * 4.0);
              finalColor = uColor1 * int0 + uColor2 * int1;
            } else if (uMode == 6) {
              brightness = 0.0;
            }

            gl_FragColor = vec4(finalColor * brightness, 1.0);
          }
        `,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    [],
  );

  useEffect(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.uMode.value = LED_MODE_MAP[ledMode] ?? 0;
    matRef.current.uniforms.uSpeed.value = ledSpeed / 10;
    matRef.current.uniforms.uColor.value.set(ledColor);
    matRef.current.uniforms.uBrightness.value = ledBrightness / 100;
    matRef.current.uniforms.uColor1.value.set(ledColors[0] ?? '#ff9944');
    matRef.current.uniforms.uColor2.value.set(ledColors[1] ?? '#22d3ee');
    matRef.current.uniforms.uTotal.value = 9600.0;
  }, [ledMode, ledSpeed, ledColor, ledBrightness, ledColors]);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <instancedMesh ref={ref} args={[geo, undefined, totalSegments]}>
      <primitive ref={matRef} object={material} attach="material" />
    </instancedMesh>
  );
}
