import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useFBO } from '@react-three/drei';
import { emit } from '../lib/arcade-core/eventBus.js';

const SIM_RES = 256;

const sharedVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionModelViewMatrix * vec4(position, 1.0);
  }
`;

const simFragment = `
  precision mediump float;
  uniform sampler2D uPrev;
  uniform vec2 uResolution;
  uniform float uDt;
  uniform float uFeed;
  uniform float uKill;
  uniform float uNutrientBurst;
  uniform float uInit;
  varying vec2 vUv;

  void main() {
    vec2 pixel = 1.0 / uResolution;
    vec2 uv = vUv;
    vec4 prev = texture2D(uPrev, uv);
    vec4 prevLeft = texture2D(uPrev, uv - vec2(pixel.x, 0.0));
    vec4 prevRight = texture2D(uPrev, uv + vec2(pixel.x, 0.0));
    vec4 prevTop = texture2D(uPrev, uv - vec2(0.0, pixel.y));
    vec4 prevBottom = texture2D(uPrev, uv + vec2(0.0, pixel.y));
    float laplacian = 
      prevLeft.r + prevRight.r + prevTop.r + prevBottom.r - 4.0 * prev.r;
    float newR = prev.r + (Dt * (laplacian - prev.r * prev.g + uFeed * (1.0 - prev.r)));
    float newG = prev.g + (Dt * (laplacian + prev.r * prev.g - (uKill + uFeed) * prev.g));
    newR = clamp(newR, 0.0, 1.0);
    newG = clamp(newG, 0.0, 1.0);
    gl_FragColor = vec4(newR, newG, 0.0, 1.0);
  }
`;

interface AbyssalNodeSceneProps {
  spoonLevel?: number; // 0-12
}

export function AbyssalNodeScene({ spoonLevel = 4 }: AbyssalNodeSceneProps) {
  const ref = useRef<null | THREE.Mesh>(null);
  const { prev, curr } = useFBO(SIM_RES, SIM_RES, THREE.RGBAFormat);
  const { gl } = useThree();

  // Base feed and kill rates
  const baseFeed = 0.055;
  const baseKill = 0.062;

  // Adjust feed and kill based on spoon level: lower spoons -> less feed, more kill
  const feed = useMemo(() => {
    const level = Math.max(0, Math.min(12, spoonLevel ?? 4));
    // At spoon 0: feed = baseFeed * 0.5, at spoon 12: feed = baseFeed * 1.5
    return baseFeed * (0.5 + level / 24);
  }, [spoonLevel]);

  const kill = useMemo(() => {
    const level = Math.max(0, Math.min(12, spoonLevel ?? 4));
    // At spoon 0: kill = baseKill * 1.5, at spoon 12: kill = baseKill * 0.5
    return baseKill * (1.5 - level / 24);
  }, [spoonLevel]);

  // Nutrient burst amount (base)
  const nutrientBurst = 0.1;
  // Initial amount
  const init = 0.05;

  useEffect(() => {
    // Initialize with a small amount of nutrients in the center
    curr.gl.bindTexture(gl.TEXTURE_2D, curr.texture);
    curr.gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      Math.floor(SIM_RES / 2) - 5,
      Math.floor(SIM_RES / 2) - 5,
      10,
      10,
      gl.RGBA,
      gl.FLOAT,
      new Float32Array(10 * 10 * 4).fill(0).map((v, i) => i % 4 === 0 ? init : 0)
    );
    curr.gl.bindTexture(gl.TEXTURE_2D, null);
  }, []);

  // Listen for nutrient burst events from the shell (e.g., when user logs a meal)
  useEffect(() => {
    const handleNutrientBurst = () => {
      // Add a burst of nutrients at a random location
      curr.gl.bindTexture(gl.TEXTURE_2D, curr.texture);
      const x = Math.floor(Math.random() * (SIM_RES - 20));
      const y = Math.floor(Math.random() * (SIM_RES - 20));
      const burst = new Float32Array(20 * 20 * 4);
      for (let i = 0; i < 20 * 20; i++) {
        burst[i * 4] = nutrientBurst; // R channel
      }
      curr.gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        x, y, 20, 20,
        gl.RGBA,
        gl.FLOAT,
        burst
      );
      curr.gl.bindTexture(gl.TEXTURE_2D, null);
    };
    window.addEventListener('p31:nutrientBurst', handleNutrientBurst);
    return () => window.removeEventListener('p31:nutrientBurst', handleNutrientBurst);
  }, []);

  useFrame(() => {
    // Run simulation step
    prev.gl.bindTexture(gl.TEXTURE_2D, prev.texture);
    curr.gl.bindTexture(gl.TEXTURE_2D, curr.texture);
    curr.gl.useMaterial(
      new THREE.ShaderMaterial({
        vertexShader: sharedVertex,
        fragmentShader: simFragment,
        uniforms: {
          uPrev: { value: prev.texture },
          uResolution: { value: new THREE.Vector2(SIM_RES, SIM_RES) },
          uDt: { value: 1.0 },
          uFeed: { value: feed },
          uKill: { value: kill },
          uNutrientBurst: { value: nutrientBurst },
          uInit: { value: init },
        },
      })
    );
    // Render current state to prev (ping-pong)
    const temp = prev;
    prev.current = curr;
    curr.current = temp;
    curr.gl.bindTexture(gl.TEXTURE_2D, null);
    prev.gl.bindTexture(gl.TEXTURE_2D, null);
  });

  // Render the current state to screen
  useFrame(() => {
    if (ref.current) {
      ref.current.material.map = curr.texture;
    }
  });

  return (
    <mesh ref={ref} rotation={[0, 0, 0]} scale={[10, 10, 10]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial color={0x88cc88} />
    </mesh>
  );
}
