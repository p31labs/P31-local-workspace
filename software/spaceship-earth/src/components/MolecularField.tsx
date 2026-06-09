// Persistent molecular starfield — void background, tinted particles, sparse bonds.
// Mounts behind the main R3F Canvas (Canvas uses alpha clear).

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const PARTICLE_COUNT = 2400;
const BG_COLOR = 0x050505;

export function MolecularField() {
  const mountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth,
      H = el.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG_COLOR);

    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 250);
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.NoToneMapping;
    el.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const r = 10 + Math.pow(Math.random(), 0.5) * 95;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      positions[i3] = r * Math.sin(ph) * Math.cos(th);
      positions[i3 + 1] = r * Math.sin(ph) * Math.sin(th);
      positions[i3 + 2] = r * Math.cos(ph);

      const roll = Math.random();
      let c: THREE.Color;
      if (roll < 0.09) {
        c = new THREE.Color(0x00ff88).multiplyScalar(0.3 + Math.random() * 0.6);
      } else if (roll < 0.2) {
        c = new THREE.Color(0x22d3ee).multiplyScalar(0.25 + Math.random() * 0.45);
      } else if (roll < 0.65) {
        c = new THREE.Color().setHSL(0.54 + Math.random() * 0.1, 0.42, 0.22 + Math.random() * 0.32);
      } else {
        c = new THREE.Color().setHSL(0.1 + Math.random() * 0.05, 0.35, 0.18 + Math.random() * 0.2);
      }
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      velocities[i3] = (Math.random() - 0.5) * 0.0004;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.0004;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.0004;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = 32;
    dotCanvas.height = 32;
    const dotCtx = dotCanvas.getContext('2d')!;
    const grad = dotCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.5)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    dotCtx.fillStyle = grad;
    dotCtx.fillRect(0, 0, 32, 32);
    const dotTex = new THREE.CanvasTexture(dotCanvas);

    const mat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.18,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: dotTex,
    });

    const points = new THREE.Points(geo, mat);
    group.add(points);

    const bondPairs: [number, number][] = [];
    const distAt = (arr: Float32Array, i: number, j: number) => {
      const ax = arr[i * 3],
        ay = arr[i * 3 + 1],
        az = arr[i * 3 + 2];
      const bx = arr[j * 3],
        by = arr[j * 3 + 1],
        bz = arr[j * 3 + 2];
      return Math.hypot(ax - bx, ay - by, az - bz);
    };
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let links = 0;
      const cap = 2 + (i % 3);
      for (let t = 0; t < 24 && links < cap; t++) {
        const j = (i * 29 + t * 13 + 5) % PARTICLE_COUNT;
        if (j === i) continue;
        const d = distAt(positions, i, j);
        if (d > 2.2 && d < 14) {
          bondPairs.push([i, j]);
          links++;
        }
      }
    }
    const bondLineFloats = new Float32Array(bondPairs.length * 6);
    const bondGeo = new THREE.BufferGeometry();
    bondGeo.setAttribute('position', new THREE.BufferAttribute(bondLineFloats, 3));
    for (let k = 0; k < bondPairs.length; k++) {
      const [i, j] = bondPairs[k];
      bondLineFloats[k * 6] = positions[i * 3];
      bondLineFloats[k * 6 + 1] = positions[i * 3 + 1];
      bondLineFloats[k * 6 + 2] = positions[i * 3 + 2];
      bondLineFloats[k * 6 + 3] = positions[j * 3];
      bondLineFloats[k * 6 + 4] = positions[j * 3 + 1];
      bondLineFloats[k * 6 + 5] = positions[j * 3 + 2];
    }
    const bondMat = new THREE.LineBasicMaterial({
      color: 0x2a5558,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    group.add(new THREE.LineSegments(bondGeo, bondMat));

    let angle = 0;
    let lastTime = 0;
    const MIN_DT = 1000 / 30;
    const animate = (time: number) => {
      frameRef.current = requestAnimationFrame(animate);
      if (time - lastTime < MIN_DT) return;
      lastTime = time;
      angle += 0.00025;

      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        pos.array[i3] += velocities[i3];
        pos.array[i3 + 1] += velocities[i3 + 1];
        pos.array[i3 + 2] += velocities[i3 + 2];
        const x = pos.array[i3],
          y = pos.array[i3 + 1],
          z = pos.array[i3 + 2];
        const d = Math.sqrt(x * x + y * y + z * z);
        if (d > 118 || d < 8) {
          const target = 22 + Math.random() * 70;
          const s = target / (d || 1);
          pos.array[i3] *= s;
          pos.array[i3 + 1] *= s;
          pos.array[i3 + 2] *= s;
        }
      }
      pos.needsUpdate = true;
      const bp = bondGeo.attributes.position as THREE.BufferAttribute;
      const bpa = bp.array as Float32Array;
      for (let k = 0; k < bondPairs.length; k++) {
        const [i, j] = bondPairs[k];
        bpa[k * 6] = pos.array[i * 3];
        bpa[k * 6 + 1] = pos.array[i * 3 + 1];
        bpa[k * 6 + 2] = pos.array[i * 3 + 2];
        bpa[k * 6 + 3] = pos.array[j * 3];
        bpa[k * 6 + 4] = pos.array[j * 3 + 1];
        bpa[k * 6 + 5] = pos.array[j * 3 + 2];
      }
      bp.needsUpdate = true;

      group.rotation.y = angle * 0.4;
      group.rotation.x = Math.sin(angle * 0.2) * 0.08;

      camera.position.x = Math.sin(angle) * 0.35;
      camera.position.y = Math.cos(angle * 0.65) * 0.2;
      camera.lookAt(0, 0, -24);

      renderer.render(scene, camera);
    };
    requestAnimationFrame(animate);

    const onResize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      geo.dispose();
      bondGeo.dispose();
      mat.dispose();
      bondMat.dispose();
      dotTex.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
