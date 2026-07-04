import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
// PARTICLE PHYSICS DATA
// ═══════════════════════════════════════════════════════════════

const PARTICLES = {
  proton:   { name: 'Proton',   symbol: 'p⁺',  mass: 938.3,  charge: 1,  color: 0xff4444, size: 0.18, stable: true },
  neutron:  { name: 'Neutron',  symbol: 'n⁰',  mass: 939.6,  charge: 0,  color: 0x8888aa, size: 0.18, stable: true },
  electron: { name: 'Electron', symbol: 'e⁻',  mass: 0.511,  charge: -1, color: 0x44aaff, size: 0.08, stable: true },
  positron: { name: 'Positron', symbol: 'e⁺',  mass: 0.511,  charge: 1,  color: 0xff88cc, size: 0.08, stable: true },
  photon:   { name: 'Photon',   symbol: 'γ',   mass: 0,      charge: 0,  color: 0xffff44, size: 0.05, stable: true },
  muon:     { name: 'Muon',     symbol: 'μ⁻',  mass: 105.7,  charge: -1, color: 0x44ffaa, size: 0.10, stable: false },
  pion_p:   { name: 'Pion⁺',   symbol: 'π⁺',  mass: 139.6,  charge: 1,  color: 0xff6633, size: 0.10, stable: false },
  pion_m:   { name: 'Pion⁻',   symbol: 'π⁻',  mass: 139.6,  charge: -1, color: 0x33ccff, size: 0.10, stable: false },
  pion_0:   { name: 'Pion⁰',   symbol: 'π⁰',  mass: 135.0,  charge: 0,  color: 0xaaaa66, size: 0.10, stable: false },
  kaon:     { name: 'Kaon⁺',   symbol: 'K⁺',  mass: 493.7,  charge: 1,  color: 0xcc44ff, size: 0.12, stable: false },
  w_boson:  { name: 'W Boson',  symbol: 'W±',  mass: 80379,  charge: 1,  color: 0xff2222, size: 0.22, stable: false },
  z_boson:  { name: 'Z Boson',  symbol: 'Z⁰',  mass: 91188,  charge: 0,  color: 0x22ff88, size: 0.22, stable: false },
  higgs:    { name: 'Higgs',    symbol: 'H⁰',  mass: 125100, charge: 0,  color: 0xffd700, size: 0.28, stable: false },
  phosphorus: { name: '³¹P',   symbol: '³¹P', mass: 28851.5, charge: 15, color: 0xff6600, size: 0.24, stable: true },
};

const BEAM_PARTICLES = ['proton', 'electron', 'positron', 'phosphorus'];

// Decay channels by collision energy threshold (GeV)
function getDecayProducts(energy) {
  const products = [];
  const count = Math.min(Math.floor(3 + energy / 20), 24);

  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    const e = energy;

    if (e > 200 && roll < 0.02) {
      products.push('higgs');
    } else if (e > 100 && roll < 0.06) {
      products.push(Math.random() > 0.5 ? 'w_boson' : 'z_boson');
    } else if (e > 10 && roll < 0.15) {
      products.push('kaon');
    } else if (roll < 0.30) {
      products.push(Math.random() > 0.5 ? 'pion_p' : 'pion_m');
    } else if (roll < 0.45) {
      products.push('pion_0');
    } else if (roll < 0.60) {
      products.push('muon');
    } else if (roll < 0.80) {
      products.push('photon');
    } else {
      products.push(Math.random() > 0.5 ? 'electron' : 'positron');
    }
  }
  return products;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const FONT = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace";

export default function ParticleCollider() {
  const mountRef = useRef(null);
  const frameRef = useRef(0);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const stateRef = useRef({
    phase: 'idle', // idle, charging, firing, collision, cascade, cooldown
    t: 0,
    chargeT: 0,
    beamParticles: [],
    cascadeParticles: [],
    trails: [],
    detectorFlash: 0,
    collisionPoint: new THREE.Vector3(0, 0, 0),
    energy: 0,
    decayLog: [],
    totalCollisions: 0,
  });

  const [beamA, setBeamA] = useState('proton');
  const [beamB, setBeamB] = useState('proton');
  const [energy, setEnergy] = useState(50);
  const [phase, setPhase] = useState('idle');
  const [decayLog, setDecayLog] = useState([]);
  const [stats, setStats] = useState({ total: 0, higgs: 0, bosons: 0 });
  const [cameraAngle, setCameraAngle] = useState({ rx: 0, ry: 0.3, trx: 0, try_: 0.3 });
  const mouseRef = useRef({ down: false, x: 0, y: 0, moved: false });
  const configRef = useRef({ beamA: 'proton', beamB: 'proton', energy: 50 });

  // Keep config ref synced
  useEffect(() => { configRef.current = { beamA, beamB, energy }; }, [beamA, beamB, energy]);

  const fire = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'idle' && s.phase !== 'cooldown') return;
    s.phase = 'charging';
    s.chargeT = 0;
    s.beamParticles = [];
    s.cascadeParticles = [];
    s.trails = [];
    s.decayLog = [];
    s.energy = configRef.current.energy;
    setPhase('charging');
  }, []);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030608);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 3, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    scene.add(new THREE.AmbientLight(0x222244, 0.4));
    const keyLight = new THREE.PointLight(0x4466aa, 0.8, 40);
    keyLight.position.set(5, 8, 10);
    scene.add(keyLight);

    // ── Detector rings ──
    const detectorRings = [];
    const ringRadii = [2.0, 3.2, 4.5, 6.0];
    const ringColors = [0x112233, 0x0a1a2a, 0x0d1520, 0x081018];
    for (let i = 0; i < ringRadii.length; i++) {
      const ringGeo = new THREE.TorusGeometry(ringRadii[i], 0.03, 8, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: ringColors[i],
        emissive: new THREE.Color(ringColors[i]).multiplyScalar(2),
        transparent: true, opacity: 0.6, metalness: 0.8, roughness: 0.2,
      });
      // XZ ring
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      detectorRings.push(ring);

      // YZ ring
      const ring2 = new THREE.Mesh(ringGeo.clone(), ringMat.clone());
      ring2.rotation.y = Math.PI / 2;
      ring2.rotation.x = Math.PI / 2;
      scene.add(ring2);
      detectorRings.push(ring2);
    }

    // ── Beam pipe (the tube) ──
    const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 30, 16, 1, true);
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a, emissive: new THREE.Color(0x0a1520),
      transparent: true, opacity: 0.3, metalness: 0.9, roughness: 0.1, side: THREE.DoubleSide,
    });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.rotation.z = Math.PI / 2;
    scene.add(pipe);

    // ── Grid floor ──
    const gridHelper = new THREE.GridHelper(30, 30, 0x0a1520, 0x060e18);
    gridHelper.position.y = -6.5;
    scene.add(gridHelper);

    // ── Stars ──
    const starsPos = [];
    for (let i = 0; i < 800; i++) {
      const r = 40 + Math.random() * 60;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starsPos.push(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph));
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsPos, 3));
    scene.add(new THREE.Points(starsGeo,
      new THREE.PointsMaterial({ color: 0x223344, size: 0.06, sizeAttenuation: true })));

    // ── Collision flash sphere ──
    const flashGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0,
    });
    const flashMesh = new THREE.Mesh(flashGeo, flashMat);
    scene.add(flashMesh);

    // ── Particle pool ──
    const particlePool = [];
    const trailPool = [];
    const MAX_PARTICLES = 60;
    const TRAIL_SEGMENTS = 40;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const geo = new THREE.SphereGeometry(1, 8, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.8, transparent: true, opacity: 1.0,
        metalness: 0.3, roughness: 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      particlePool.push(mesh);

      // Trail
      const trailGeo = new THREE.BufferGeometry();
      const trailPositions = new Float32Array(TRAIL_SEGMENTS * 3);
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      const trailMat = new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.5,
      });
      const trailLine = new THREE.Line(trailGeo, trailMat);
      trailLine.visible = false;
      trailLine.frustumCulled = false;
      scene.add(trailLine);
      trailPool.push({ line: trailLine, positions: trailPositions, head: 0 });
    }

    // ── Beam particles (visual only) ──
    const beamPool = [];
    for (let i = 0; i < 40; i++) {
      const geo = new THREE.SphereGeometry(0.06, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      beamPool.push(mesh);
    }

    // ═══════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ═══════════════════════════════════════════════════════════

    let prevTime = performance.now();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      const s = stateRef.current;
      s.t += dt;

      const cfg = configRef.current;
      const pA = PARTICLES[cfg.beamA];
      const pB = PARTICLES[cfg.beamB];

      // ── CHARGING ──
      if (s.phase === 'charging') {
        s.chargeT += dt;
        const progress = Math.min(s.chargeT / 1.5, 1);

        // Beam particles stream toward center
        for (let i = 0; i < 20; i++) {
          const bp = beamPool[i];
          if (!bp) continue;
          bp.visible = true;
          const side = i < 10 ? -1 : 1;
          const localI = i % 10;
          const phase = (s.chargeT * 3 + localI * 0.1) % 1;
          const startX = side * 15;
          const endX = side * (15 - progress * 14.5);
          bp.position.x = startX + (endX - startX) * phase;
          bp.position.y = (Math.random() - 0.5) * 0.15 * progress;
          bp.position.z = (Math.random() - 0.5) * 0.15 * progress;
          bp.material.color.setHex(side < 0 ? pA.color : pB.color);
          bp.material.opacity = 0.3 + 0.7 * progress * (1 - phase);
          bp.scale.setScalar(0.5 + progress * 0.5);
        }

        // Detector rings glow
        for (const ring of detectorRings) {
          ring.material.emissiveIntensity = 0.5 + progress * 2;
        }

        // Pipe glows
        pipeMat.emissive.setHex(0x1a3050);
        pipeMat.emissiveIntensity = progress * 1.5;

        if (progress >= 1) {
          s.phase = 'firing';
          s.chargeT = 0;
          setPhase('firing');
        }
      }

      // ── FIRING — two main beam particles approach ──
      if (s.phase === 'firing') {
        s.chargeT += dt;
        const fireProgress = Math.min(s.chargeT / 0.4, 1);

        // Hide stream particles
        for (const bp of beamPool) bp.visible = false;

        // Show two main particles
        const mainA = particlePool[0];
        const mainB = particlePool[1];
        mainA.visible = true;
        mainB.visible = true;
        mainA.position.set(-15 + fireProgress * 15, 0, 0);
        mainB.position.set(15 - fireProgress * 15, 0, 0);
        mainA.material.color.setHex(pA.color);
        mainA.material.emissive.setHex(pA.color);
        mainA.scale.setScalar(pA.size * 2);
        mainB.material.color.setHex(pB.color);
        mainB.material.emissive.setHex(pB.color);
        mainB.scale.setScalar(pB.size * 2);
        mainA.material.opacity = 1;
        mainB.material.opacity = 1;

        // Trails for beam particles
        const tA = trailPool[0];
        const tB = trailPool[1];
        tA.line.visible = true;
        tB.line.visible = true;
        tA.line.material.color.setHex(pA.color);
        tB.line.material.color.setHex(pB.color);

        // Update trail positions
        for (const [t, p] of [[tA, mainA], [tB, mainB]]) {
          const pos = t.positions;
          // Shift all positions
          for (let j = TRAIL_SEGMENTS - 1; j > 0; j--) {
            pos[j * 3] = pos[(j - 1) * 3];
            pos[j * 3 + 1] = pos[(j - 1) * 3 + 1];
            pos[j * 3 + 2] = pos[(j - 1) * 3 + 2];
          }
          pos[0] = p.position.x;
          pos[1] = p.position.y;
          pos[2] = p.position.z;
          t.line.geometry.attributes.position.needsUpdate = true;
        }

        if (fireProgress >= 1) {
          // COLLISION!
          s.phase = 'collision';
          s.chargeT = 0;
          mainA.visible = false;
          mainB.visible = false;
          tA.line.visible = false;
          tB.line.visible = false;

          // Reset trails
          tA.positions.fill(0);
          tB.positions.fill(0);
          tA.line.geometry.attributes.position.needsUpdate = true;
          tB.line.geometry.attributes.position.needsUpdate = true;

          // Generate decay products
          const products = getDecayProducts(cfg.energy);
          s.cascadeParticles = products.map((pKey, idx) => {
            const p = PARTICLES[pKey];
            // Spherically distributed momenta with some jet-like structure
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 2 + Math.random() * (cfg.energy / 15);
            const jitter = 0.3;
            return {
              key: pKey,
              x: 0, y: 0, z: 0,
              vx: speed * Math.sin(phi) * Math.cos(theta) + (Math.random() - 0.5) * jitter,
              vy: speed * Math.sin(phi) * Math.sin(theta) + (Math.random() - 0.5) * jitter,
              vz: speed * Math.cos(phi) + (Math.random() - 0.5) * jitter,
              life: 1.0,
              decay: p.stable ? 0.15 + Math.random() * 0.1 : 0.3 + Math.random() * 0.4,
              charge: p.charge,
              idx: idx + 2,
            };
          });

          // Stats
          s.totalCollisions++;
          const higgsCount = products.filter(p => p === 'higgs').length;
          const bosonCount = products.filter(p => p === 'w_boson' || p === 'z_boson').length;
          s.decayLog = products;

          setDecayLog(products);
          setStats(prev => ({
            total: prev.total + 1,
            higgs: prev.higgs + higgsCount,
            bosons: prev.bosons + bosonCount,
          }));
          setPhase('collision');
        }
      }

      // ── COLLISION FLASH ──
      if (s.phase === 'collision') {
        s.chargeT += dt;
        const flashProgress = Math.min(s.chargeT / 0.15, 1);

        flashMesh.material.opacity = (1 - flashProgress) * 0.9;
        flashMesh.scale.setScalar(0.5 + flashProgress * 4);
        flashMesh.material.color.setHex(0xffffff);

        // Detector rings flash
        for (const ring of detectorRings) {
          ring.material.emissiveIntensity = (1 - flashProgress) * 8;
          ring.material.emissive.setHex(0x88ccff);
        }

        if (flashProgress >= 1) {
          s.phase = 'cascade';
          flashMesh.material.opacity = 0;
          setPhase('cascade');
        }
      }

      // ── CASCADE — particles fly outward ──
      if (s.phase === 'cascade') {
        s.chargeT += dt;
        let allDead = true;

        // Magnetic field curvature for charged particles
        const B = 0.15;

        for (const cp of s.cascadeParticles) {
          if (cp.life <= 0) continue;
          allDead = false;

          cp.life -= cp.decay * dt;

          // Lorentz-like curvature for charged particles
          if (cp.charge !== 0) {
            const sign = cp.charge > 0 ? 1 : -1;
            const speed = Math.sqrt(cp.vx * cp.vx + cp.vy * cp.vy + cp.vz * cp.vz);
            if (speed > 0.01) {
              // Cross product with B-field (along Z)
              const fx = sign * B * cp.vy;
              const fy = -sign * B * cp.vx;
              cp.vx += fx * dt;
              cp.vy += fy * dt;
            }
          }

          cp.x += cp.vx * dt * 5;
          cp.y += cp.vy * dt * 5;
          cp.z += cp.vz * dt * 5;

          const pInfo = PARTICLES[cp.key];
          const mesh = particlePool[cp.idx];
          if (mesh && cp.idx < MAX_PARTICLES) {
            mesh.visible = cp.life > 0;
            mesh.position.set(cp.x, cp.y, cp.z);
            mesh.material.color.setHex(pInfo.color);
            mesh.material.emissive.setHex(pInfo.color);
            mesh.material.emissiveIntensity = 0.6 * cp.life;
            mesh.material.opacity = Math.max(0, cp.life);
            mesh.scale.setScalar(pInfo.size * (0.5 + cp.life * 0.5));

            // Update trail
            const trail = trailPool[cp.idx];
            if (trail) {
              trail.line.visible = cp.life > 0.1;
              trail.line.material.color.setHex(pInfo.color);
              trail.line.material.opacity = cp.life * 0.4;
              const pos = trail.positions;
              for (let j = TRAIL_SEGMENTS - 1; j > 0; j--) {
                pos[j * 3] = pos[(j - 1) * 3];
                pos[j * 3 + 1] = pos[(j - 1) * 3 + 1];
                pos[j * 3 + 2] = pos[(j - 1) * 3 + 2];
              }
              pos[0] = cp.x;
              pos[1] = cp.y;
              pos[2] = cp.z;
              trail.line.geometry.attributes.position.needsUpdate = true;
            }
          }
        }

        // Detector rings fade
        for (const ring of detectorRings) {
          ring.material.emissiveIntensity *= 0.97;
        }

        if (allDead || s.chargeT > 6) {
          s.phase = 'cooldown';
          s.chargeT = 0;
          setPhase('cooldown');

          // Clean up
          for (let i = 0; i < MAX_PARTICLES; i++) {
            particlePool[i].visible = false;
            trailPool[i].line.visible = false;
            trailPool[i].positions.fill(0);
            trailPool[i].line.geometry.attributes.position.needsUpdate = true;
          }
          for (const ring of detectorRings) {
            ring.material.emissiveIntensity = 0.5;
            ring.material.emissive.setHex(0x112233);
          }
          pipeMat.emissiveIntensity = 0;
        }
      }

      // ── COOLDOWN ──
      if (s.phase === 'cooldown') {
        s.chargeT += dt;
        if (s.chargeT > 0.5) {
          s.phase = 'idle';
          setPhase('idle');
        }
      }

      // ── IDLE ambient ──
      if (s.phase === 'idle') {
        for (const bp of beamPool) bp.visible = false;
        pipeMat.emissiveIntensity = 0.1 + 0.05 * Math.sin(s.t * 2);
      }

      // Camera orbit
      const cam = cameraAngle;
      cam.trx += (cam.rx - cam.trx) * 0.05;
      cam.try_ += (cam.ry - cam.try_) * 0.05;
      const D = 14;
      camera.position.x = D * Math.sin(cam.trx) * Math.cos(cam.try_);
      camera.position.y = D * Math.sin(cam.try_) + 1;
      camera.position.z = D * Math.cos(cam.trx) * Math.cos(cam.try_);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // ── Input ──
    const getXY = (e) => {
      if (e.touches?.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (e.changedTouches?.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    };
    const onDown = (e) => {
      const { x, y } = getXY(e);
      const rect = el.getBoundingClientRect();
      mouseRef.current = { down: true, x: x - rect.left, y: y - rect.top, moved: false };
    };
    const onMove = (e) => {
      const mr = mouseRef.current;
      if (!mr.down) return;
      const { x, y } = getXY(e);
      const rect = el.getBoundingClientRect();
      const nx = x - rect.left, ny = y - rect.top;
      const dx = nx - mr.x, dy = ny - mr.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) mr.moved = true;
      setCameraAngle(prev => {
        const newRy = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, prev.ry + dy * 0.004));
        return { ...prev, rx: prev.rx + dx * 0.005, ry: newRy };
      });
      mr.x = nx;
      mr.y = ny;
    };
    const onUp = () => { mouseRef.current.down = false; };

    el.addEventListener('mousedown', onDown);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('touchstart', onDown, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onUp);

    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseup', onUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  // Count unique decay products
  const decayCounts = useMemo(() => {
    const map = {};
    for (const p of decayLog) {
      const info = PARTICLES[p];
      map[p] = (map[p] || 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ key, count, info: PARTICLES[key] }));
  }, [decayLog]);

  const canFire = phase === 'idle' || phase === 'cooldown';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#030608', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab', touchAction: 'none' }} />

      {/* ── Top bar: beam config ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        padding: '12px 16px', zIndex: 10,
        background: 'linear-gradient(to bottom, rgba(3,6,8,0.9) 0%, transparent 100%)',
      }}>
        {/* Beam A */}
        <div style={{ display: 'flex', gap: 4 }}>
          {BEAM_PARTICLES.map(k => {
            const p = PARTICLES[k];
            const sel = beamA === k;
            return (
              <button key={k} onClick={() => setBeamA(k)} style={{
                background: sel ? `${cssHex(p.color)}22` : 'transparent',
                border: `1px solid ${sel ? cssHex(p.color) : '#1a2a3a'}`,
                color: sel ? cssHex(p.color) : '#3a4a5a',
                padding: '3px 8px', borderRadius: 3, fontSize: 9,
                fontFamily: FONT, cursor: 'pointer', letterSpacing: 1, transition: 'all 0.2s',
              }}>
                {p.symbol}
              </button>
            );
          })}
        </div>

        {/* Energy slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#3a4a5a', fontSize: 8, fontFamily: FONT, letterSpacing: 1 }}>ENERGY</span>
          <input type="range" min="5" max="300" value={energy} onChange={e => setEnergy(Number(e.target.value))}
            style={{ width: 120, accentColor: '#ff6633', cursor: 'pointer' }}
          />
          <span style={{ color: '#ff6633', fontSize: 10, fontFamily: FONT, minWidth: 55, textAlign: 'right' }}>
            {energy} GeV
          </span>
        </div>

        {/* Beam B */}
        <div style={{ display: 'flex', gap: 4 }}>
          {BEAM_PARTICLES.map(k => {
            const p = PARTICLES[k];
            const sel = beamB === k;
            return (
              <button key={k} onClick={() => setBeamB(k)} style={{
                background: sel ? `${cssHex(p.color)}22` : 'transparent',
                border: `1px solid ${sel ? cssHex(p.color) : '#1a2a3a'}`,
                color: sel ? cssHex(p.color) : '#3a4a5a',
                padding: '3px 8px', borderRadius: 3, fontSize: 9,
                fontFamily: FONT, cursor: 'pointer', letterSpacing: 1, transition: 'all 0.2s',
              }}>
                {p.symbol}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Fire button ── */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
      }}>
        <button onClick={fire} disabled={!canFire} style={{
          background: canFire
            ? 'linear-gradient(135deg, #ff4444 0%, #ff6633 50%, #ffaa22 100%)'
            : '#1a1a2a',
          border: 'none',
          color: canFire ? '#fff' : '#3a3a4a',
          padding: '10px 36px',
          borderRadius: 6,
          fontSize: 12,
          fontFamily: FONT,
          fontWeight: 700,
          letterSpacing: 3,
          cursor: canFire ? 'pointer' : 'default',
          textTransform: 'uppercase',
          transition: 'all 0.3s',
          boxShadow: canFire ? '0 0 20px rgba(255,68,68,0.3)' : 'none',
        }}>
          {phase === 'charging' ? 'CHARGING...' : phase === 'firing' ? 'FIRING!' : phase === 'collision' ? 'IMPACT!' : phase === 'cascade' ? 'CASCADE' : 'COLLIDE'}
        </button>
      </div>

      {/* ── Decay products readout ── */}
      {decayCounts.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 16, right: 16, maxWidth: 200,
          background: 'rgba(3,6,8,0.92)', backdropFilter: 'blur(12px)',
          border: '1px solid #1a2a3a', borderRadius: 6, padding: 12,
          fontFamily: FONT, zIndex: 15,
        }}>
          <div style={{ color: '#3a4a5a', fontSize: 8, letterSpacing: 1.5, marginBottom: 8 }}>DECAY PRODUCTS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {decayCounts.map(({ key, count, info }) => (
              <span key={key} style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 2,
                background: `${cssHex(info.color)}15`,
                border: `1px solid ${cssHex(info.color)}33`,
                color: cssHex(info.color),
              }}>
                {info.symbol}{count > 1 ? ` ×${count}` : ''}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 8, color: '#2a3a4a', fontSize: 8 }}>
            {decayLog.length} particles &middot; {energy} GeV
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16,
        fontFamily: FONT, fontSize: 8, color: '#2a3a4a', letterSpacing: 1,
        zIndex: 10, lineHeight: 2,
      }}>
        <div>COLLISIONS: <span style={{ color: '#4a5a6a' }}>{stats.total}</span></div>
        <div>HIGGS: <span style={{ color: stats.higgs > 0 ? '#ffd700' : '#2a3a4a' }}>{stats.higgs}</span></div>
        <div>W/Z BOSONS: <span style={{ color: stats.bosons > 0 ? '#44ff88' : '#2a3a4a' }}>{stats.bosons}</span></div>
      </div>

      {/* ── Phase indicator ── */}
      <div style={{
        position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
        fontFamily: FONT, fontSize: 8, letterSpacing: 2, zIndex: 10,
        color: phase === 'collision' ? '#ff4444' : phase === 'cascade' ? '#ffaa22' : '#1a2a3a',
        transition: 'color 0.3s',
      }}>
        {PARTICLES[beamA].symbol} + {PARTICLES[beamB].symbol} → ?
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute', top: 80, right: 16, fontFamily: FONT,
        fontSize: 7, color: '#121a24', letterSpacing: 1, lineHeight: 2,
        textAlign: 'right', zIndex: 5,
      }}>
        <div>DRAG ORBIT</div>
        <div>SELECT BEAMS</div>
        <div>ADJUST ENERGY</div>
      </div>
    </div>
  );
}

function cssHex(threeHex) {
  return '#' + threeHex.toString(16).padStart(6, '0');
}
