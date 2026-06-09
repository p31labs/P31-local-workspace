import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useFBO } from '@react-three/drei';

const SIM_RES = 256;

const sharedVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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

    // Initial condition: u=1, v=0 except center seed
    if (uInit > 0.5) {
      float u = 1.0;
      float v = 0.0;
      vec2 centered = uv - 0.5;
      float d = length(centered);
      if (d < 0.1) v = 1.0;
      gl_FragColor = vec4(u, v, 0.0, 1.0);
      return;
    }

    vec4 center = texture2D(uPrev, uv);
    float u = center.r;
    float v = center.g;

    // 4-neighbor Laplacian (wrap not needed; clamp edges by clamping UVs in neighbors? We'll use clampToEdge)
    float uL = texture2D(uPrev, uv - vec2(pixel.x, 0.0)).r;
    float uR = texture2D(uPrev, uv + vec2(pixel.x, 0.0)).r;
    float uU = texture2D(uPrev, uv + vec2(0.0, pixel.y)).r;
    float uD = texture2D(uPrev, uv - vec2(0.0, pixel.y)).r;
    float vL = texture2D(uPrev, uv - vec2(pixel.x, 0.0)).g;
    float vR = texture2D(uPrev, uv + vec2(pixel.x, 0.0)).g;
    float vU = texture2D(uPrev, uv + vec2(0.0, pixel.y)).g;
    float vD = texture2D(uPrev, uv - vec2(0.0, pixel.y)).g;

    float lapU = (uL + uR + uU + uD - 4.0 * u) / (pixel.x * pixel.x);
    float lapV = (vL + vR + vU + vD - 4.0 * v) / (pixel.x * pixel.x);

    // Nutrient burst adds V locally
    float dvBurst = 0.0;
    if (uNutrientBurst > 0.0) {
      vec2 centered = uv - 0.5;
      float d = length(centered);
      float radius = 0.2;
      if (d < radius) {
        dvBurst = 0.5 * uNutrientBurst;
      }
    }

    float uvv = u * v * v;
    float feed = uFeed;
    float du = 1.0 * lapU - uvv + feed * (1.0 - u);
    float dv = 0.5 * lapV + uvv - (feed + uKill) * v + dvBurst;

    float newU = clamp(u + du * uDt, 0.0, 1.0);
    float newV = clamp(v + dv * uDt, 0.0, 1.0);

    gl_FragColor = vec4(newU, newV, 0.0, 1.0);
  }
`;

const displayFragment = `
  precision mediump float;
  uniform sampler2D uState;
  uniform float uTime;
  uniform float uNutrientBurst;
  varying vec2 vUv;

  void main() {
    vec4 state = texture2D(uState, vUv);
    float v = state.g;

    vec3 deep   = vec3(0.04, 0.02, 0.08);
    vec3 violet = vec3(0.55, 0.33, 0.70);
    vec3 cyan   = vec3(0.2,  0.9,  0.8);

    float intensity = v;
    vec3 col = mix(deep, violet, smoothstep(0.0, 0.5, intensity));
    col = mix(col, cyan, smoothstep(0.5, 1.0, intensity) * (0.5 + uNutrientBurst * 0.5));

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function AbyssalNodeScene() {
  const { gl, size } = useThree();
  const burstValue = useRef(0.0);

  // Simulation scene (offscreen)
  const simScene = useMemo(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPrev: { value: null as unknown as THREE.Texture },
        uResolution: { value: new THREE.Vector2(SIM_RES, SIM_RES) },
        uDt: { value: 1.0 },
        uFeed: { value: 0.055 },
        uKill: { value: 0.062 },
        uNutrientBurst: { value: 0.0 },
        uInit: { value: 0.0 },
      },
      vertexShader: sharedVertex,
      fragmentShader: simFragment,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    return { scene, camera, material };
  }, []);

   // Ping-pong FBOs
   const fboA = useFBO(SIM_RES, SIM_RES, {
     minFilter: THREE.NearestFilter,
     magFilter: THREE.NearestFilter,
     format: THREE.RGBAFormat,
     type: THREE.FloatType,
     depthBuffer: false,
     stencilBuffer: false,
     wrapS: THREE.ClampToEdgeWrapping,
     wrapT: THREE.ClampToEdgeWrapping,
   });
   const fboB = useFBO(SIM_RES, SIM_RES, {
     minFilter: THREE.NearestFilter,
     magFilter: THREE.NearestFilter,
     format: THREE.RGBAFormat,
     type: THREE.FloatType,
     depthBuffer: false,
     stencilBuffer: false,
     wrapS: THREE.ClampToEdgeWrapping,
     wrapT: THREE.ClampToEdgeWrapping,
   });
  const readFBO = useRef(fboA);
  const writeFBO = useRef(fboB);
  const initialized = useRef(false);

  // Nutrient burst event listener
  useEffect(() => {
    const onBurst = () => {
      burstValue.current = 1.0;
    };
    window.addEventListener('p31:nutrientBurst', onBurst);
    return () => window.removeEventListener('p31:nutrientBurst', onBurst);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Dispose FBOs
      fboA.texture?.dispose();
      fboB.texture?.dispose();
      // Dispose simulation scene resources
      const simMat = simScene.material as THREE.ShaderMaterial;
      simMat.uniforms.uPrev.value?.dispose();
      simMat.dispose();
      (simScene.scene.children[0] as THREE.Mesh).geometry.dispose();
      // Dispose display resources
      displayMaterial.uniforms.uState.value?.dispose();
      displayMaterial.dispose();
      displayGeometry.dispose();
    };
  }, []);

  // Display material (main canvas)
  const displayGeometry = useMemo(() => new THREE.PlaneGeometry(8, 8), []);
  const displayMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uState: { value: null as unknown as THREE.Texture },
      uTime: { value: 0.0 },
      uNutrientBurst: { value: 0.0 },
    },
    vertexShader: sharedVertex,
    fragmentShader: displayFragment,
    depthWrite: false,
    depthTest: false,
  }), []);

  useFrame(() => {
    const simMat = simScene.material as THREE.ShaderMaterial;
    const dispMat = displayMaterial as THREE.ShaderMaterial;

    // Update display uniforms
    dispMat.uniforms.uTime.value = performance.now() / 1000;
    dispMat.uniforms.uNutrientBurst.value = burstValue.current;
    dispMat.uniforms.uState.value = readFBO.current.texture;

    // Initialize simulation on first frame
    if (!initialized.current) {
      simMat.uniforms.uInit.value = 1.0;
       // Render initial state to readFBO
       gl.viewport.x = 0;
       gl.viewport.y = 0;
       gl.viewport.z = SIM_RES;
       gl.viewport.w = SIM_RES;
       gl.setScissor(0, 0, SIM_RES, SIM_RES);
       gl.setScissorTest(true);

       gl.viewport(0, 0, SIM_RES, SIM_RES);
       gl.scissor(0, 0, SIM_RES, SIM_RES);
       gl.setRenderTarget(readFBO.current);
       gl.render(simScene.scene, simScene.camera);
       gl.setRenderTarget(null);
       // Restore viewport to canvas size
       gl.viewport(0, 0, size.width, size.height);
       gl.scissor(0, 0, size.width, size.height);
      initialized.current = true;
      return;
    }

     // Simulation step: render to writeFBO
     simMat.uniforms.uPrev.value = readFBO.current.texture;
     simMat.uniforms.uNutrientBurst.value = burstValue.current;
     simMat.uniforms.uInit.value = 0.0;

     // Set viewport and scissor for FBO render
     gl.viewport.x = 0;
     gl.viewport.y = 0;
     gl.viewport.z = SIM_RES;
     gl.viewport.w = SIM_RES;
     gl.setScissor(0, 0, SIM_RES, SIM_RES);
     gl.setScissorTest(true);

     gl.viewport(0, 0, SIM_RES, SIM_RES);
     gl.scissor(0, 0, SIM_RES, SIM_RES);
     gl.setRenderTarget(writeFBO.current);
     gl.render(simScene.scene, simScene.camera);
     gl.setRenderTarget(null);
     gl.viewport(0, 0, size.width, size.height);
     gl.scissor(0, 0, size.width, size.height);

    // Swap buffers
    const temp = readFBO.current;
    readFBO.current = writeFBO.current;
    writeFBO.current = temp;

    // Decay burst
    if (burstValue.current > 0) {
      burstValue.current = Math.max(0, burstValue.current - 0.02); // ~1s decay
    }
  });

  return <mesh geometry={displayGeometry} material={displayMaterial} />;
}

export default AbyssalNodeScene;