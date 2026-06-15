// dome-cockpit.ts
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ----------------------------------------------------------------------
// Global references (filled in init)
// ----------------------------------------------------------------------
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let controls: OrbitControls;
let composer: EffectComposer;
let bloomPass: UnrealBloomPass;

let pMat: THREE.PointsMaterial;          // particle material
let coreMat: THREE.MeshStandardMaterial; // central core material
let wMat: THREE.LineBasicMaterial;       // wire material
let strutMat: THREE.MeshStandardMaterial;// strut material
let molField: THREE.Points;              // particle system

let sheetController: { dispose: () => void }; // external controller, e.g. CSS2DRenderer

// Flags (set externally or via localStorage)
const domePerfLite = localStorage.getItem('domePerfLite') === 'true';
let domeVISuppressed = false;

// ----------------------------------------------------------------------
// Quantum coherence (spoons → visual intensity)
// ----------------------------------------------------------------------
function quantumCoherence(spoons: number) {
  const coherence = Math.min(1, Math.max(0, spoons / 5));
  if (pMat) pMat.opacity = (domePerfLite ? 0.14 : 0.2) * coherence;
  if (coreMat) coreMat.emissiveIntensity = 0.85 * coherence;
  if (bloomPass && !domeVISuppressed) {
    bloomPass.strength = 0.38 * coherence;
  }
  if (spoons <= 0 && !domeVISuppressed) {
    scene.background = new THREE.Color(0x111111);
    renderer.setClearColor(0x111111);
    scene.fog = new THREE.Fog(0x111111, 14, 92);
  } else {
    scene.background = new THREE.Color(0x050508);
    renderer.setClearColor(0x050508);
    scene.fog = new THREE.Fog(0x050508, 14, 92);
  }
}

// ----------------------------------------------------------------------
// Adaptive quality (adjust particle count & bloom based on frame timing)
// ----------------------------------------------------------------------
function createAdaptiveQuality() {
  let quality: 'high' | 'medium' | 'low' = 'high';
  const samples: number[] = [];
  let last = performance.now();

  return function tickAdaptive() {
    const now = performance.now();
    samples.push(now - last);
    if (samples.length > 60) samples.shift();
    last = now;

    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    const next = avg > 22 ? 'low' : avg < 14 ? 'high' : 'medium';
    if (next !== quality) {
      quality = next;
      let targetParticles = 0;
      if (next === 'high') targetParticles = domePerfLite ? 4000 : 12000;
      else if (next === 'medium') targetParticles = domePerfLite ? 2000 : 5000;
      else targetParticles = domePerfLite ? 800 : 1500;

      if (molField && molField.geometry) {
        (molField.geometry as THREE.BufferGeometry).setDrawRange(0, targetParticles);
      }
      if (bloomPass) {
        bloomPass.strength = next === 'high' ? 0.38 : next === 'medium' ? 0.2 : 0;
      }
      if (renderer) renderer.shadowMap.enabled = next === 'high';
    }
  };
}

// ----------------------------------------------------------------------
// Full disposal of Three.js resources
// ----------------------------------------------------------------------
function disposeScene() {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
      else mesh.material.dispose();
    }
  });
  renderer.dispose();
  if (controls) controls.dispose();
  if (composer) composer.passes.forEach(pass => (pass as any).dispose?.());
  if (sheetController) sheetController.dispose();
}

// ----------------------------------------------------------------------
// Saved dome shell visual parameters (for quick restore)
// ----------------------------------------------------------------------
const domeShellSaved = {
  wireColorHex: 0x88aaff,
  wireOpacity: 0.35,
  strutOpacity: 0.6,
  coreColorHex: 0xffaa66,
  coreEmissiveIntensity: 0.85,
};

// ----------------------------------------------------------------------
// Initialisation (call this from your React useEffect or as main)
// ----------------------------------------------------------------------
export function initDomeCockpit(
  container: HTMLElement,
  getCurrentSpoons: () => number,
  externalSheetController?: { dispose: () => void }
) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050508);
  scene.fog = new THREE.Fog(0x050508, 14, 92);

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(8, 6, 12);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(0x050508);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;

  const renderScene = new RenderPass(scene, camera);
  bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 0.38, 0.4, 0.85);
  bloomPass.threshold = 0.1;
  bloomPass.strength = 0.38;
  bloomPass.radius = 0.5;
  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  const particleCount = domePerfLite ? 4000 : 12000;
  const pGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const radius = 3.5 + Math.random() * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i*3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = radius * Math.cos(phi);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pMat = new THREE.PointsMaterial({
    color: 0x77aaff,
    size: 0.08,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending
  });
  molField = new THREE.Points(pGeo, pMat);
  scene.add(molField);

  const coreGeo = new THREE.SphereGeometry(0.9, 32, 32);
  coreMat = new THREE.MeshStandardMaterial({
    color: domeShellSaved.coreColorHex,
    emissive: 0x442200,
    emissiveIntensity: domeShellSaved.coreEmissiveIntensity,
    metalness: 0.7,
    roughness: 0.3
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  scene.add(coreMesh);

  const wirePoints: THREE.Vector3[] = [];
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    wirePoints.push(new THREE.Vector3(Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, 0));
  }
  const wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
  wMat = new THREE.LineBasicMaterial({ color: domeShellSaved.wireColorHex, transparent: true, opacity: domeShellSaved.wireOpacity });
  const wireLoop = new THREE.LineLoop(wireGeo, wMat);
  scene.add(wireLoop);

  const strutMatObj = new THREE.MeshStandardMaterial({ color: 0xaa8866, roughness: 0.4, metalness: 0.6, transparent: true, opacity: domeShellSaved.strutOpacity });

  if (externalSheetController) sheetController = externalSheetController;
  else sheetController = { dispose: () => {} };

  // --- Adaptive quality loop
  const adaptiveTick = createAdaptiveQuality();

  // --- Animation loop
  let animationId: number;
  function animate() {
    animationId = requestAnimationFrame(animate);
    const spoons = getCurrentSpoons();
    quantumCoherence(spoons);
    adaptiveTick();

    controls.update();
    composer.render();
  }
  animate();

  // --- Handle resize
  function handleResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
  }
  window.addEventListener('resize', handleResize);

  // --- Return cleanup function (for useEffect)
  return () => {
    window.removeEventListener('resize', handleResize);
    cancelAnimationFrame(animationId);
    disposeScene();
    if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
  };
}
