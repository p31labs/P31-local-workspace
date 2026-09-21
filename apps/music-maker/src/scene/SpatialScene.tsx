/**
 * The music maker — SpatialScene.
 *
 * The planetarium-you-can-hear. Zones sit on a phyllotaxis sphere (or at
 * human-placed positions, which win). A visible listener marker shows "you
 * are here" independent of the camera. Drag rotates the camera; the listener
 * is moved by a separate surface control (the mobile pattern from the
 * prototype: one finger is you).
 *
 * Conventions inherited from JitterbugScene.tsx, verbatim:
 *   • Color contract — no hex/rgb/oklch literals anywhere. Every color is
 *     resolved from a `--p31-*` token via resolveTokenRgb and passed to
 *     shaders/materials as vec3 uniforms.
 *   • Phyllotaxis placement for default/unplaced slots; placed positions win.
 *   • Reduced motion draws a single static frame; the loop does not run.
 *
 * The "played note glows" pressure is computed here per frame with @p31/field
 * decay (§5.4) and written straight into each zone's uGlow uniform.
 *
 * Re-render discipline: the RAF loop lives in one []-dep effect and reads
 * zones/triggers/selectedId through REFS (synced on every render), never the
 * mount-time closure. Without the refs, zones added after mount would never
 * glow. Per-frame DOM updates (the C1 agent buttons' positions) are written
 * directly to the elements via a ref map — no React state at 60fps.
 */
import { memo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { resolveTokenRgb } from '../lib/tokens';
import { MusicZone, type MusicZoneProps } from './MusicZone';
import { zoneGlow, type MusicZone as ZoneModel } from './musicZone';

export interface SpatialSceneProps {
  zones: ZoneModel[];
  /** Zone id -> array of recent trigger timestamps (for the glow decay). */
  triggers: Record<string, number[]>;
  /** The listener position (camera-independent marker + audio). */
  listener: [number, number, number];
  onListenerChange: (position: [number, number, number]) => void;
  /** Called when a zone is triggered by a pointer. */
  onZoneTrigger: (id: string) => void;
  selectedId: string | null;
  /** True under OS prefers-reduced-motion — the scene draws one static frame. */
  reducedMotion: boolean;
  /** The engine's live three-band energy + master level — drives the sphere.
   *  A stable reference so the RAF loop reads it without allocation. */
  getEnergy: () => { bass: number; mid: number; treble: number; master: number };
  /** Render mode: constellation (points+trails), terrain (reactive sphere
   *  prominent), bursts (trigger explosions). One 48px button cycles them. */
  renderMode: 'constellation' | 'terrain' | 'bursts';
}

const RADIUS = 2.2;
const LISTENER_DRAG_SPEED = 0.012;
const TRAIL_LENGTH = 240; // listener path sample count (~4s at 60fps)

// ── Deterministic PRNG + GLSL simplex noise (Ashima / McEwan, MIT) — the
//    same helpers JitterbugScene uses, so geometry and bursts never re-roll.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOISE_GLSL = `
vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

function SpatialSceneImpl({
  zones,
  triggers,
  listener,
  onListenerChange,
  onZoneTrigger,
  selectedId,
  reducedMotion,
  getEnergy,
  renderMode,
}: SpatialSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── A1: refs synced every render — the []-dep effect reads THESE, not the
  //    mount-time closure. Without them a zone added via SSE/WS after mount
  //    would never glow, pulse, or be selectable.
  const zonesRef = useRef(zones);
  zonesRef.current = zones;
  const triggersRef = useRef(triggers);
  triggersRef.current = triggers;
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const onZoneTriggerRef = useRef(onZoneTrigger);
  onZoneTriggerRef.current = onZoneTrigger;
  const onListenerChangeRef = useRef(onListenerChange);
  onListenerChangeRef.current = onListenerChange;
  const getEnergyRef = useRef(getEnergy);
  getEnergyRef.current = getEnergy;
  const renderModeRef = useRef(renderMode);
  renderModeRef.current = renderMode;

  // Zone points + their uniforms, keyed by zone id. Built imperatively once.
  const zoneMap = useRef(new Map<string, THREE.Points>());
  // C1 agent buttons (the AAF surface per zone), keyed by zone id. The frame
  // loop positions them directly — no React state at 60fps.
  const zoneButtons = useRef(new Map<string, HTMLElement>());
  // The in-scene listener position — mutable across frames.
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(...resolveTokenRgb('--p31-bg'));
    const camera = new THREE.PerspectiveCamera(
      55,
      (canvas.clientWidth || window.innerWidth) / (canvas.clientHeight || window.innerHeight),
      0.1,
      100,
    );
    camera.position.set(0, 0, 6);

    // ── Listener marker — a visible "you are here", not the bare camera. ──
    const markerGeom = new THREE.SphereGeometry(0.07, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(...resolveTokenRgb('--p31-text')) });
    const marker = new THREE.Mesh(markerGeom, markerMat);
    const markerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.16, 32),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(...resolveTokenRgb('--p31-accent')),
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    const markerGroup = new THREE.Group();
    markerGroup.add(marker, markerRing);
    scene.add(markerGroup);

    const setMarker = (p: [number, number, number]) => {
      listenerRef.current = p;
      markerGroup.position.set(p[0], p[1], p[2]);
    };
    setMarker(listener);

    // ── The reactive sphere — the membrane that breathes with the music. ──
    // Vertex displacement by band: bass swells the whole form, mid makes
    // ripples, treble adds fine detail. Fresnel rim glow tracks the master
    // level. A sphere that moves with the sound is the difference between a
    // visualizer and an instrument (the research: audio-reactive shaders are
    // the single highest-impact change; Perlin noise + Fresnel beat photo-
    // realism for this purpose). No hex/rgb/oklch literals — colors are
    // tokens resolved to vec3 uniforms.
    const SPHERE_VERT = `
uniform float uTime;
uniform vec3 uAccent;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
varying vec3 vNormal;
varying vec3 vPos;
varying float vEnergy;
${NOISE_GLSL}
void main() {
  vec3 p = position;
  float n = snoise(position * 1.4 + vec3(0.0, uTime * 0.3, 0.0));
  float swell = uBass * 0.35;                     // bass: whole-form swell
  float ripple = uMid * 0.18 * snoise(position * 3.0 + uTime * 0.6); // mid: ripples
  float detail = uTreble * 0.08 * snoise(position * 7.0 - uTime * 0.9); // treble: detail
  p *= 1.0 + swell + ripple + detail;
  vNormal = normalize(normalMatrix * normal);
  vPos = (modelViewMatrix * vec4(p, 1.0)).xyz;
  vEnergy = uBass * 0.5 + uMid * 0.3 + uTreble * 0.2;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
    const SPHERE_FRAG = `
uniform vec3 uAccent;
uniform float uMaster;
varying vec3 vNormal;
varying vec3 vPos;
varying float vEnergy;
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(-vPos);
  float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.0);
  vec3 base = uAccent * (0.18 + 0.10 * vEnergy);
  vec3 rim = uAccent * fresnel * (0.55 + uMaster * 0.45);
  float alpha = 0.22 + fresnel * 0.45 + uMaster * 0.3;
  gl_FragColor = vec4(base + rim, alpha);
}`;
    const sphereGeom = new THREE.SphereGeometry(RADIUS, 64, 40);
    const sphereUniforms = {
      uTime: { value: 0 },
      uAccent: { value: new THREE.Vector3(...resolveTokenRgb('--p31-accent')) },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreble: { value: 0 },
      uMaster: { value: 0 },
    };
    const sphereMat = new THREE.ShaderMaterial({
      uniforms: sphereUniforms,
      vertexShader: SPHERE_VERT,
      fragmentShader: SPHERE_FRAG,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    scene.add(sphere);

    // A faint wireframe outline stays so the space reads as a space even at
    // zero energy (reduced motion / sound off).
    const guide = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 24, 16),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(...resolveTokenRgb('--p31-text')),
        wireframe: true,
        transparent: true,
        opacity: 0.06,
      }),
    );
    scene.add(guide);

    // ── The listener trail — the path is the score, made visible. ────────
    // A fixed-length ring of positions; each frame shifts one sample in and
    // advances the head, so the trail shows where you've been (and the line
    // fades toward the tail). Driven by the listener's actual movement, so it
    // is the performance's visible wake.
    const trailPositions = new Float32Array(TRAIL_LENGTH * 3);
    const trailColors = new Float32Array(TRAIL_LENGTH * 3);
    const trailGeom = new THREE.BufferGeometry();
    trailGeom.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeom.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
    const trailMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const trail = new THREE.Line(trailGeom, trailMat);
    trail.frustumCulled = false;
    scene.add(trail);
    let trailHead = 0;
    const trailAccent = new THREE.Vector3(...resolveTokenRgb('--p31-accent'));
    const trailText = new THREE.Vector3(...resolveTokenRgb('--p31-text'));
    const pushTrail = (p: [number, number, number]) => {
      const i = trailHead % TRAIL_LENGTH;
      trailPositions[i * 3] = p[0];
      trailPositions[i * 3 + 1] = p[1];
      trailPositions[i * 3 + 2] = p[2];
      // Fade colors from the head (bright) to the tail (dim).
      for (let k = 0; k < TRAIL_LENGTH; k++) {
        const age = (i - k + TRAIL_LENGTH) % TRAIL_LENGTH; // 0 = newest
        const fade = 1 - (age / TRAIL_LENGTH);
        trailColors[k * 3] = trailAccent.x * fade;
        trailColors[k * 3 + 1] = trailAccent.y * fade;
        trailColors[k * 3 + 2] = trailAccent.z * fade;
      }
      trailHead = (trailHead + 1) % TRAIL_LENGTH;
      (trailGeom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (trailGeom.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    };
    // Seed the trail with the starting position so it doesn't begin empty.
    for (let k = 0; k < TRAIL_LENGTH; k++) {
      trailPositions[k * 3] = listener[0];
      trailPositions[k * 3 + 1] = listener[1];
      trailPositions[k * 3 + 2] = listener[2];
    }
    trailHead = 0;

    // ── Zone bursts — each trigger is a small radial explosion. ───────────
    // A pool of line-segment bursts, one per recent trigger; each burst has
    // N rays that grow and fade. Reuses the additive glow language.
    const BURST_RAYS = 10;
    const BURST_MAX = 24;
    const burstSegments = new Float32Array(BURST_MAX * BURST_RAYS * 6);
    const burstAlphas = new Float32Array(BURST_MAX);
    const burstGeom = new THREE.BufferGeometry();
    const burstAttr = new THREE.BufferAttribute(burstSegments, 3);
    const burstVertexAlpha = new Float32Array(BURST_MAX * BURST_RAYS * 2);
    burstGeom.setAttribute('position', burstAttr);
    burstGeom.setAttribute('aAlpha', new THREE.BufferAttribute(burstVertexAlpha, 1));
    const BURST_VERT = `
attribute float aAlpha;
varying float vAlpha;
void main() {
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
    const BURST_FRAG = `
uniform vec3 uAccent;
varying float vAlpha;
void main() {
  gl_FragColor = vec4(uAccent, vAlpha);
}`;
    const burstUniforms = {
      uAccent: { value: new THREE.Vector3(...resolveTokenRgb('--p31-accent-gold')) },
    };
    const burstMat = new THREE.ShaderMaterial({
      uniforms: burstUniforms,
      vertexShader: BURST_VERT,
      fragmentShader: BURST_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const bursts = new THREE.LineSegments(burstGeom, burstMat);
    bursts.frustumCulled = false;
    scene.add(bursts);
    // burst state: position, activeAt, seeded ray directions, growth
    const burstState: Array<{
      x: number; y: number; z: number; at: number;
      dirs: Float32Array; active: boolean;
    }> = [];
    let burstCursor = 0;
    const rand = mulberry32(0xb4adc);
    // Per-zone last-seen trigger count, to spawn exactly one burst per new hit.
    const lastBurstCount = new Map<string, number>();
    const spawnBurst = (p: [number, number, number]) => {
      const i = burstCursor % BURST_MAX;
      burstCursor += 1;
      const dirs = new Float32Array(BURST_RAYS * 3);
      for (let r = 0; r < BURST_RAYS; r++) {
        // Random unit-ish direction (seeded, stable).
        const theta = rand() * Math.PI * 2;
        const phi = Math.acos(2 * rand() - 1);
        dirs[r * 3] = Math.sin(phi) * Math.cos(theta);
        dirs[r * 3 + 1] = Math.sin(phi) * Math.sin(theta);
        dirs[r * 3 + 2] = Math.cos(phi);
      }
      burstState[i] = { x: p[0], y: p[1], z: p[2], at: Date.now(), dirs, active: true };
    };

    // ── A4: pointer mode. Mouse = camera orbit (a desktop must not be frozen);
    //    one touch = listener move ("one finger is you"); two touches =
    //    camera orbit. Restores the prototype's explicit mode selection that
    //    was lost in the port (the old touchCount approach never fired either
    //    branch for a mouse).
    let yaw = 0;
    let pitch = 0.35;
    let mode: 'none' | 'camera' | 'listener' = 'none';
    const activePointers = new Set<number>();
    let lastX = 0;
    let lastY = 0;

    const applyCamera = () => {
      const sp = Math.sin(pitch);
      camera.position.set(
        Math.sin(yaw) * sp * 6,
        Math.cos(pitch) * 6,
        Math.cos(yaw) * sp * 6,
      );
      camera.lookAt(0, 0, 0);
    };

    // Tap-to-trigger: a pointerdown+up with negligible movement (no drag) is a
    // tap on a zone. The visual zones are THREE.Points, so a raycast finds the
    // one under the cursor and calls onZoneTrigger. This is the real pointer
    // path for instrument.zone.trigger; the C1 DOM spans are the discoverable
    // AAF surface, not the interaction.
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.22;
    let tapStartX = 0;
    let tapStartY = 0;
    let pointerMoved = false;

    const onPointerDown = (e: PointerEvent) => {
      activePointers.add(e.pointerId);
      lastX = e.clientX;
      lastY = e.clientY;
      tapStartX = e.clientX;
      tapStartY = e.clientY;
      pointerMoved = false;
      if (e.pointerType === 'mouse') mode = 'camera';
      else mode = activePointers.size >= 2 ? 'camera' : 'listener';
      try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (mode === 'none') return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      if (Math.hypot(e.clientX - tapStartX, e.clientY - tapStartY) > 8) pointerMoved = true;
      if (mode === 'camera') {
        yaw -= dx * 0.005;
        pitch = Math.max(-1.5, Math.min(1.5, pitch - dy * 0.005));
      } else if (mode === 'listener') {
        // Move the listener on the sphere surface (one finger is you). The
        // listener move is a gesture-driven action (§8) — ephemeral, never
        // committed; the C1 button for the listener is documented at the
        // call site since there is no single DOM element to hang it on.
        const [lx, ly, lz] = listenerRef.current;
        let nx = lx + dx * LISTENER_DRAG_SPEED;
        let nz = lz + dy * LISTENER_DRAG_SPEED;
        const ny = ly;
        const r = Math.hypot(nx, ny, nz);
        if (r > 0.01) {
          nx *= RADIUS / r;
          nz *= RADIUS / r;
        }
        const next: [number, number, number] = [nx, ny, nz];
        setMarker(next);
        onListenerChangeRef.current(next);
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      const wasTap = !pointerMoved;
      activePointers.delete(e.pointerId);
      if (activePointers.size === 0) mode = 'none';
      try { canvas.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      // A tap (no drag) on the canvas triggers the zone under the cursor.
      if (wasTap && activePointers.size === 0) {
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        const ndc = new THREE.Vector2((e.clientX / w) * 2 - 1, -(e.clientY / h) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects([...zoneMap.current.values()], false);
        const hit = hits.find((x) => x.object && x.object.userData?.zoneId);
        if (hit && hit.object) {
          onZoneTriggerRef.current(hit.object.userData.zoneId);
        }
      }
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    const onResize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Per-frame zone updates: glow decay + pulse clock. ────────────────
    // Optimization threshold (measured, not speculative): each zone is one
    // THREE.Points = one draw call. At the family baseline (8–16 zones) this
    // is fine. If the composition ever exceeds ~20 zones, convert the zones to
    // a single instanced geometry (one draw call) — research on three.js
    // batching: "too many draw calls hurt performance; instancing batches many
    // copies into one." Do NOT convert before there are measured many zones;
    // the current approach is simpler and correct at this scale.
    let raf = 0;
    let ambient = 0;
    const drawFrame = (elapsed: number) => {
      ambient = elapsed;
      const now = Date.now();
      const zs = zonesRef.current;
      const tr = triggersRef.current;
      const sel = selectedRef.current;
      const mode = renderModeRef.current;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;

      // Energy drives the reactive sphere (bass swell, mid ripples, treble
      // detail, Fresnel by master). Sound off → zeros → the sphere holds its
      // wireframe ghost. Reduced motion freezes the deformation via a near-
      // zero time drift (the time uniform is the frame clock, not ambient).
      const e = getEnergyRef.current();
      sphereUniforms.uTime.value = ambient;
      sphereUniforms.uBass.value = e.bass;
      sphereUniforms.uMid.value = e.mid;
      sphereUniforms.uTreble.value = e.treble;
      sphereUniforms.uMaster.value = e.master;
      sphere.visible = mode === 'terrain';
      guide.visible = true;
      trail.visible = mode === 'constellation' || mode === 'terrain';
      bursts.visible = mode === 'bursts';

      // Listener trail — every frame pushes the current position, so the wake
      // of the performance is always visible. The listener moves on drag; the
      // trail also "rests" (same point) when idle, keeping the ring warm.
      const [lx, ly, lz] = listenerRef.current;
      pushTrail([lx, ly, lz]);

      // Zone bursts — a triggered zone spawns an explosion; bursts grow and
      // fade over ~900ms. Reduced motion shortens the window.
      const burstWindow = reducedMotion ? 300 : 900;
      // Spawn bursts for zones whose trigger list just grew (compare against
      // the count we last saw per zone).
      for (const zone of zs) {
        const hits = tr[zone.id] ?? [];
        const lastSeen = lastBurstCount.get(zone.id) ?? 0;
        if (hits.length > lastSeen) {
          // New trigger(s) — spawn one burst per new hit at the zone's pos.
          const n = hits.length - lastSeen;
          for (let b = 0; b < Math.min(n, 4); b++) {
            spawnBurst([zone.position[0], zone.position[1], zone.position[2]]);
          }
        }
        lastBurstCount.set(zone.id, hits.length);
      }
      // Advance + write bursts into the geometry.
      for (let i = 0; i < BURST_MAX; i++) {
        const s = burstState[i];
        const age = s ? now - s.at : 9999;
        const life = 1 - Math.min(1, age / burstWindow); // 1 → 0
        burstAlphas[i] = s && s.active && life > 0 ? life : 0;
        const base = i * BURST_RAYS * 6;
        for (let r = 0; r < BURST_RAYS; r++) {
          const seg = base + r * 6;
          if (s && burstAlphas[i] > 0) {
            const grow = 1 - life; // 0 → 1
            const len = 0.12 + grow * 0.3;
            burstSegments[seg] = s.x;
            burstSegments[seg + 1] = s.y;
            burstSegments[seg + 2] = s.z;
            burstSegments[seg + 3] = s.x + s.dirs[r * 3] * len;
            burstSegments[seg + 4] = s.y + s.dirs[r * 3 + 1] * len;
            burstSegments[seg + 5] = s.z + s.dirs[r * 3 + 2] * len;
          } else {
            burstSegments[seg] = 0;
            burstSegments[seg + 1] = 0;
            burstSegments[seg + 2] = 0;
            burstSegments[seg + 3] = 0;
            burstSegments[seg + 4] = 0;
            burstSegments[seg + 5] = 0;
          }
          burstVertexAlpha[i * BURST_RAYS * 2 + r * 2] = burstAlphas[i];
          burstVertexAlpha[i * BURST_RAYS * 2 + r * 2 + 1] = burstAlphas[i];
        }
      }
      (burstGeom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (burstGeom.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true;

      for (const zone of zs) {
        const pts = zoneMap.current.get(zone.id);
        if (!pts) continue;
        const mat = pts.material as THREE.ShaderMaterial;
        const hits = tr[zone.id] ?? [];
        let glow = 0;
        for (const ts of hits) glow += zoneGlow({ zone: zone.id, ts, actor: 'human' }, now);
        mat.uniforms.uTime.value = ambient;
        mat.uniforms.uGlow.value = Math.min(1, glow);
        pts.scale.setScalar(zone.id === sel ? 1.15 : 1);

        // C1: position the agent button at the zone's projected screen point.
        const btn = zoneButtons.current.get(zone.id);
        if (btn) {
          const v = new THREE.Vector3(zone.position[0], zone.position[1], zone.position[2]);
          v.project(camera);
          if (v.z < 1) {
            btn.style.left = `${(v.x * 0.5 + 0.5) * w}px`;
            btn.style.top = `${(-v.y * 0.5 + 0.5) * h}px`;
            btn.style.display = 'block';
          } else {
            btn.style.display = 'none';
          }
        }
      }
      applyCamera();
      renderer.render(scene, camera);
    };

    const loop = (now: number) => {
      drawFrame(now / 1000);
      if (!reducedMotion) raf = requestAnimationFrame(loop);
    };

    if (reducedMotion) drawFrame(0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      markerGeom.dispose();
      markerMat.dispose();
      markerRing.geometry.dispose();
      (markerRing.material as THREE.Material).dispose();
      sphereGeom.dispose();
      sphereMat.dispose();
      guide.geometry.dispose();
      (guide.material as THREE.Material).dispose();
      trailGeom.dispose();
      trailMat.dispose();
      burstGeom.dispose();
      burstMat.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register each zone's THREE.Points with the shared map so the loop can
  // update its uniforms. Zones that arrive late (committed via SSE) land here.
  const handleReady = (points: THREE.Points, id: string) => {
    points.userData.zoneId = id; // the raycast tap uses this to resolve the zone
    zoneMap.current.set(id, points);
  };
  const handleDispose = (id: string) => {
    zoneMap.current.delete(id);
    zoneButtons.current.delete(id);
  };

  return (
    <div className="spatial-scene" role="img" aria-label="The spatial instrument — zones of sound around you. Drag to look around.">
      <canvas ref={canvasRef} className="spatial-canvas" />

      {/* C1: the AAF surface per zone. Invisible to sighted users (clipped),
          discoverable to agents and tests — the honest DOM surface for
          instrument.zone.trigger, since the visual zone is a canvas point with
          no DOM element. NON-interactive spans: they must never intercept
          pointer events (a clipped <button> can swallow canvas drags on some
          browsers); the trigger itself is the canvas tap, and agent/test
          invocation goes through the AAF attribute, not a click. */}
      {zones.map((z) => (
        <span
          key={z.id}
          ref={(el) => {
            if (el) zoneButtons.current.set(z.id, el);
            else zoneButtons.current.delete(z.id);
          }}
          className="mm-zone-agent"
          aria-hidden="true"
          data-zone-id={z.id}
          data-agent-kind="action"
          data-agent-action="instrument.zone.trigger"
          data-agent-danger="none"
          data-agent-confirm="never"
        >
          {z.name || z.id}
        </span>
      ))}

      {zones.map((z) => (
        <MusicZone
          key={`three-${z.id}`}
          id={z.id}
          position={z.position}
          accentRgb={resolveTokenRgb('--p31-accent')}
          goldRgb={resolveTokenRgb('--p31-accent-gold')}
          onReady={handleReady}
          onDispose={handleDispose}
        />
      ))}
    </div>
  );
}

/**
 * Memoized scene. The scene is mostly imperative (refs + a RAF loop); its React
 * render only maps zone spans and MusicZone children. Memoizing keeps an App
 * state change that isn't scene input (e.g. a live-region announcement) from
 * re-running that map. The refs are synced every render, so the RAF loop reads
 * the latest zones/triggers regardless. Props are shallow-compared; the scene
 * inputs (zones/triggers/listener/selectedId) are new references exactly when
 * they change, and the callbacks are stable, so default comparison is right.
 */
export const SpatialScene = memo(SpatialSceneImpl);

export type { MusicZoneProps };