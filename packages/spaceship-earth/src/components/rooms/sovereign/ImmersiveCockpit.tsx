import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useSovereignStore } from '../../../sovereign/useSovereignStore';
import { prefersReducedMotion } from '../../../hooks/useReducedMotion';

/**
 * ImmersiveCockpitUI — High Performance Hero Visualizer
 *
 * Refactored to eliminate heavy post-processing (UnrealBloomPass) and complex
 * shader math that caused severe lag on mobile devices.
 *
 * Scene contents:
 * - Deep Space Starfield (Lightweight THREE.Points)
 * - Orbiting Energy Cloud (Lightweight THREE.Points)
 * - Living Jitterbug Core (Smoothly oscillating Sacred Geometry)
 * - Additive Blending Sprite Glow (Zero-cost bloom effect)
 */

const _defaultCam = new THREE.Vector3(6, 4, 10);
const _colA = new THREE.Color();

export function ImmersiveCockpitUI({ isIdle }: { isIdle?: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // ── 1. Scene Setup ───────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05050b, 0.04);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(20, 15, 30); // Start far for the intro dolly-in

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    mountRef.current.appendChild(renderer.domElement);

    // ── 2. Controls (Fixed Zoom fighting) ─────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 40;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    let isIntroAnim = true;
    let introProg = 0;

    // The moment the user interacts, cancel the intro animation so they have full control
    controls.addEventListener('start', () => {
      isIntroAnim = false;
    });

    // ── 3. Background Starfield ──────────────────────────────────
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 120;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 120;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));

    // Create a soft circular dot texture programmatically
    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = 16; dotCanvas.height = 16;
    const dotCtx = dotCanvas.getContext('2d')!;
    dotCtx.beginPath(); dotCtx.arc(8, 8, 8, 0, Math.PI * 2);
    dotCtx.fillStyle = '#ffffff'; dotCtx.fill();
    const dotTex = new THREE.CanvasTexture(dotCanvas);

    const starMat = new THREE.PointsMaterial({
      color: 0x4db8a8, size: 0.15, map: dotTex, transparent: true, opacity: 0.2, depthWrite: false,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── 4. The Jitterbug Core (Geometry & Nodes) ─────────────────
    const C = 1 / Math.sqrt(2); const T = 1 / Math.sqrt(3);
    const COORDS = {
      cubo: [new THREE.Vector3(C, C, 0), new THREE.Vector3(C, -C, 0), new THREE.Vector3(-C, C, 0), new THREE.Vector3(-C, -C, 0), new THREE.Vector3(C, 0, C), new THREE.Vector3(C, 0, -C), new THREE.Vector3(-C, 0, C), new THREE.Vector3(-C, 0, -C), new THREE.Vector3(0, C, C), new THREE.Vector3(0, C, -C), new THREE.Vector3(0, -C, C), new THREE.Vector3(0, -C, -C)],
      octa: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1)],
      tetra: [new THREE.Vector3(T, T, T), new THREE.Vector3(T, -T, -T), new THREE.Vector3(-T, T, -T), new THREE.Vector3(-T, -T, T), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)],
    };

    const coreGroup = new THREE.Group();

    // 12 Nodes
    const nodeGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const nodes: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const mesh = new THREE.Mesh(nodeGeo, nodeMat.clone());
      nodes.push(mesh);
      coreGroup.add(mesh);
    }

    // Dynamic Edges
    const edgeGeo = new THREE.BufferGeometry();
    const edgePos = new Float32Array(66 * 6);
    const edgeCol = new Float32Array(66 * 6);
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
    edgeGeo.setAttribute('color', new THREE.BufferAttribute(edgeCol, 3));
    const edgeMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    coreGroup.add(edgeLines);
    scene.add(coreGroup);

    // ── 5. Orbiting Energy Cloud ─────────────────────────────────
    const cloudGeo = new THREE.BufferGeometry();
    const cloudPos = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      const r = 2.5 + Math.random() * 2;
      const tAng = Math.random() * Math.PI * 2;
      const pAng = Math.acos(2 * Math.random() - 1);
      cloudPos[i * 3] = r * Math.sin(pAng) * Math.cos(tAng);
      cloudPos[i * 3 + 1] = r * Math.sin(pAng) * Math.sin(tAng);
      cloudPos[i * 3 + 2] = r * Math.cos(pAng);
    }
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPos, 3));
    const cloudMat = new THREE.PointsMaterial({
      color: 0xcda852, size: 0.08, map: dotTex, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const energyCloud = new THREE.Points(cloudGeo, cloudMat);
    scene.add(energyCloud);

    // ── 6. Zero-Cost Fake Bloom (Sprite Glow) ────────────────────
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256; glowCanvas.height = 256;
    const glowCtx = glowCanvas.getContext('2d')!;
    const glowGrad = glowCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    glowGrad.addColorStop(0.2, 'rgba(77, 184, 168, 0.5)');
    glowGrad.addColorStop(0.6, 'rgba(139, 124, 201, 0.1)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    glowCtx.fillStyle = glowGrad;
    glowCtx.fillRect(0, 0, 256, 256);

    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowSpriteMat = new THREE.SpriteMaterial({
      map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9,
    });
    const coreGlow = new THREE.Sprite(glowSpriteMat);
    coreGlow.scale.set(7, 7, 1);
    scene.add(coreGlow);

    // ── 7. Render Loop ───────────────────────────────────────────
    let animationId: number;
    let frameCount = 0;
    const jPos: THREE.Vector3[] = Array.from({ length: 12 }, () => new THREE.Vector3());
    const scratchVec = new THREE.Vector3();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      frameCount++;

      const reduceMotion = prefersReducedMotion();
      if (reduceMotion && (frameCount % 12) !== 0) return;
      if (!reduceMotion && isIdle && (frameCount & 1) === 1) return;

      timeRef.current += 0.012; // Slow, majestic pace
      const t = timeRef.current;
      const state = useSovereignStore.getState();
      const accentHex = parseInt((state.accentColor ?? '#4db8a8').replace('#', ''), 16);

      // Update Theme Colors dynamically
      for (const n of nodes) {
        (n.material as THREE.MeshBasicMaterial).color.setHex(accentHex);
      }
      glowSpriteMat.color.setHex(accentHex);
      cloudMat.color.setHex(accentHex);

      // Intro Dolly-in Camera Logic
      if (isIntroAnim && introProg < 1) {
        introProg += 0.01;
        const ease = 1 - Math.pow(1 - introProg, 3); // Cubic ease-out
        camera.position.lerpVectors(new THREE.Vector3(20, 15, 30), _defaultCam, ease);
      }
      controls.update();

      // Gentle continuous rotation
      coreGroup.rotation.y += 0.003;
      coreGroup.rotation.x += 0.001;
      energyCloud.rotation.y -= 0.002;
      energyCloud.rotation.z += 0.001;

      // Jitterbug Morphing Logic (Breathes continuously between shapes)
      const morphCycle = (Math.sin(t * 0.4) + 1) / 2; // 0 to 1
      let phase = 0;
      let lerp = 0;

      if (morphCycle < 0.5) {
        phase = 0; // Cubo to Octa
        lerp = morphCycle * 2;
      } else {
        phase = 1; // Octa to Tetra
        lerp = (morphCycle - 0.5) * 2;
      }

      const coreScale = 2.0;

      // Update Nodes
      for (let i = 0; i < 12; i++) {
        if (phase === 0) scratchVec.lerpVectors(COORDS.cubo[i], COORDS.octa[i], lerp);
        else scratchVec.lerpVectors(COORDS.octa[i], COORDS.tetra[i], lerp);

        scratchVec.multiplyScalar(coreScale);
        nodes[i].position.copy(scratchVec);
        jPos[i].copy(scratchVec);

        // Shrink nodes that collapse into the center during the Tetra phase
        if (phase === 1 && i >= 4) {
          nodes[i].scale.setScalar(Math.max(0.001, 1 - lerp));
        } else {
          nodes[i].scale.setScalar(1);
        }
      }

      // Update Edges (Zero-allocation drawing)
      let eIdx = 0;
      _colA.setHex(accentHex);

      for (let i = 0; i < 12; i++) {
        if (phase === 1 && i >= 4 && lerp > 0.95) continue;
        for (let j = i + 1; j < 12; j++) {
          if (phase === 1 && j >= 4 && lerp > 0.95) continue;

          const dist = jPos[i].distanceTo(jPos[j]);
          if (dist > 0.1 && dist < coreScale * 1.8) {
            const base = eIdx * 6;
            edgePos[base] = jPos[i].x; edgePos[base + 1] = jPos[i].y; edgePos[base + 2] = jPos[i].z;
            edgePos[base + 3] = jPos[j].x; edgePos[base + 4] = jPos[j].y; edgePos[base + 5] = jPos[j].z;

            edgeCol[base] = _colA.r; edgeCol[base + 1] = _colA.g; edgeCol[base + 2] = _colA.b;
            edgeCol[base + 3] = _colA.r; edgeCol[base + 4] = _colA.g; edgeCol[base + 5] = _colA.b;
            eIdx++;
          }
        }
      }
      // Clear remaining buffer memory
      for (let i = eIdx * 6; i < 66 * 6; i++) { edgePos[i] = 0; edgeCol[i] = 0; }
      edgeLines.geometry.attributes.position.needsUpdate = true;
      edgeLines.geometry.attributes.color.needsUpdate = true;

      // Pulse the central glow
      coreGlow.scale.setScalar(6 + Math.sin(t * 2) * 0.5);

      renderer.render(scene, camera);
    };
    animate();

    // ── 8. Cleanup & Resize ──────────────────────────────────────
    const handleResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }, 100);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      controls.dispose();

      // Cleanup GPU memory
      starGeo.dispose(); starMat.dispose();
      nodeGeo.dispose(); nodeMat.dispose();
      nodes.forEach(n => (n.material as THREE.MeshBasicMaterial).dispose());
      edgeGeo.dispose(); edgeMat.dispose();
      cloudGeo.dispose(); cloudMat.dispose();
      dotTex.dispose();
      glowTex.dispose(); glowSpriteMat.dispose();

      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [isIdle]);

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 0, cursor: 'crosshair', background: '#05050b' }} />;
}
