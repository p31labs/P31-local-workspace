/**
 * The music maker — a zone in 3D space.
 *
 * A single spatial zone rendered as a points-sprite (the same additive-glow
 * family as JitterbugScene's field zones, but a distinct material): the zone
 * sits at its placed position, its glow follows the @p31/field decay curve
 * (a struck zone brightens, then cools), and it carries its AAF action so an
 * agent or a test can trigger it non-visually.
 *
 * Color contract (enforced by the design gate): no hex/rgb/oklch literals.
 * Every color arrives as a `vec3` uniform resolved from a `--p31-*` token.
 *
 * Implementation follows the JitterbugScene house pattern: geometry and
 * material are built imperatively (React never re-creates them). The zone
 * hands its THREE.Points to the parent scene via onReady; the scene loop
 * updates uniforms per frame and reduced motion draws a static frame.
 */
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export interface MusicZoneProps {
  id: string;
  position: [number, number, number];
  accentRgb: [number, number, number];
  goldRgb: [number, number, number];
  /** Called once with the imperatively-built THREE.Points. */
  onReady: (points: THREE.Points, id: string) => void;
  onDispose: (id: string) => void;
}

const ZONE_VERT = `
uniform float uTime;
uniform float uGlow;
uniform vec3 uAccent;
uniform vec3 uGold;
attribute float aRandom;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec3 pos = position;
  float pulse = 1.0 + 0.08 * sin(uTime * 2.0 + aRandom * 6.28318) * uGlow;
  pos *= pulse;
  vec3 base = mix(uAccent, uGold, uGlow);
  vColor = base;
  vAlpha = 0.45 + 0.55 * uGlow;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = (34.0 / -mv.z) * (0.8 + uGlow * 1.2);
  gl_Position = projectionMatrix * mv;
}
`;

const ZONE_FRAG = `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  float a = pow(smoothstep(0.5, 0.0, r), 1.8);
  if (a < 0.02) discard;
  gl_FragColor = vec4(vColor, a * vAlpha);
}
`;

export function MusicZone({ id, position, accentRgb, goldRgb, onReady, onDispose }: MusicZoneProps) {
  const seed = useMemo(() => Math.random(), []);

  const { geometry, material, points } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array([position[0], position[1], position[2]]);
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aRandom', new THREE.BufferAttribute(Float32Array.from([seed]), 1));

    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uGlow: { value: 0 },
        uAccent: { value: new THREE.Vector3(...accentRgb) },
        uGold: { value: new THREE.Vector3(...goldRgb) },
      },
      vertexShader: ZONE_VERT,
      fragmentShader: ZONE_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const p = new THREE.Points(g, m);
    p.position.set(position[0], position[1], position[2]);
    return { geometry: g, material: m, points: p };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onReady(points, id);
    return () => {
      onDispose(id);
      geometry.dispose();
      material.dispose();
    };
  }, [points, id, onReady, onDispose, geometry, material]);

  // No DOM — this component registers a THREE.Points with its parent scene.
  return null;
}

export type { MusicZoneProps as MusicZoneComponentProps };