// StarfieldField — unified GPU round-star field.
// Integrates the best from all starfield iterations:
//  - analytic soft round glow (bright core + halo), no textures → smooth orbs, no squares
//  - per-star size / phase / tint (twinkle) — from NotificationStarfield
//  - breathing pulse — from NotificationStarfield
//  - spoon-aware opacity/count/speed + urgent → rose/violet — from cockpit shader
//  - theme-aware warm/cool tint via --p31-star-* tokens
//  - zero CPU per-frame work: animation lives entirely in the shader + group rotation
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform float uPulse;
  uniform float uSurge;
  uniform vec3 uWarm;
  uniform vec3 uCool;
  attribute float aSize;
  attribute float aPhase;
  attribute float aTint;
  varying vec3 vColor;
  varying float vGlow;
  void main() {
    float pulse = 1.0 + uPulse * sin(uTime * 1.1 + aPhase * 6.2831853);
    vec3 p = position * pulse;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float d = max(-mv.z, 1.0);
    gl_PointSize = clamp(aSize * uScale / d * (1.0 + uSurge * 0.8), 1.0, 220.0);
    gl_Position = projectionMatrix * mv;
    vColor = mix(uWarm, uCool, aTint);
    vGlow = 0.5 + 0.5 * sin(uTime * (0.4 + aPhase) + aPhase * 6.2831853);
  }
`;

const FRAG = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vGlow;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.32, 0.0, d);
    float halo = smoothstep(0.5, 0.14, d) * 0.5;
    float alpha = (core + halo) * uOpacity * (0.6 + 0.4 * vGlow);
    gl_FragColor = vec4(vColor * (0.75 + 0.25 * vGlow), alpha);
  }
`;

export interface StarfieldFieldProps {
  count?: number;
  spoons?: number;
  highUnread?: number;
  pulseAt?: number;
  reduceMotion?: boolean;
  calm?: boolean;
  warm?: string;
  cool?: string;
  speed?: number;
}

export function StarfieldField({
  count = 1600,
  spoons = 3,
  highUnread = 0,
  pulseAt = 0,
  reduceMotion = false,
  calm = false,
  warm = '#d9a066',
  cool = '#8a7a68',
  speed = 1,
}: StarfieldFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const { gl } = useThree();

  const uniforms = useRef({
    uTime: { value: 0 },
    uScale: { value: 400 },
    uPulse: { value: 0.02 },
    uSurge: { value: 0 },
    uOpacity: { value: 0.5 },
    uWarm: { value: new THREE.Color(warm) },
    uCool: { value: new THREE.Color(cool) },
  });

  useEffect(() => {
    uniforms.current.uWarm.value.set(warm);
    uniforms.current.uCool.value.set(cool);
  }, [warm, cool]);

  const geometry = useMemo(() => {
    const n = count;
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const phase = new Float32Array(n);
    const tint = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = 18 + Math.random() * 16;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);
      size[i] = 0.08 + Math.random() * 0.30;
      phase[i] = Math.random();
      tint[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    g.setAttribute('aTint', new THREE.BufferAttribute(tint, 1));
    return g;
  }, [count]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: uniforms.current,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  // Dispose imperative GPU resources: geometry is recreated when count changes,
  // the shader material lives for the component lifetime.
  useEffect(() => () => {
    geometry.dispose();
  }, [geometry]);
  useEffect(() => () => {
    material.dispose();
  }, [material]);

  useFrame((_, delta) => {
    if (reduceMotion || calm) return;
    timeRef.current += delta;
    const u = uniforms.current;
    const t = spoons / 5;
    u.uTime.value = timeRef.current;
    // Transient notification surge (decays over ~4s)
    const age = pulseAt ? (Date.now() - pulseAt) / 1000 : 999;
    const surge = Math.max(0, 1 - age / 4);
    u.uSurge.value = surge;
    u.uOpacity.value = 0.18 + t * 0.55 + surge * 0.35;
    u.uPulse.value = spoons <= 1 ? 0.008 : 0.02;
    if (highUnread > 0) {
      u.uWarm.value.set('#f43f5e');
      u.uCool.value.set('#8b5cf6');
    } else {
      u.uWarm.value.set(warm);
      u.uCool.value.set(cool);
    }
    const sizeV = gl.getDrawingBufferSize(new THREE.Vector2());
    u.uScale.value = sizeV.y / 2;
    if (pointsRef.current) {
      const spin = (highUnread > 0 ? 0.05 : 0.012) * (0.3 + 0.7 * t) * (1 + surge * 3) * speed;
      pointsRef.current.rotation.y += delta * spin;
      pointsRef.current.rotation.x += delta * spin * 0.3;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

export default StarfieldField;
