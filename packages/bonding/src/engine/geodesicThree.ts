/**
 * geodesicThree — imperative Three.js engine for the Geodesic build mode.
 *
 * Mounts a renderer into a container element, returns a GeodesicEngine API.
 * The React component (GeodesicMode.tsx) holds this as a ref and bridges
 * engine events to geodesicStore via the onEvent callback.
 *
 * No React imports. No WS. Campaign-agnostic: fires string events, caller decides.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export type GeodesicShapeType = 'tet' | 'oct' | 'ico' | 'cube';

export interface GeodesicEngine {
  addShape(type: GeodesicShapeType): void;
  resetShapes(): void;
  setWireMode(on: boolean): void;
  setSolidMode(on: boolean): void;
  setAutoSnap(on: boolean): void;
  autoArrange(): void;
  showPlacementRing(): void;
  hidePlacementRing(): void;
  dispose(): void;
}

interface GeodesicEngineOpts {
  onEvent: (type: string) => void;
  onShapeCountChange: (count: number) => void;
}

const COLORS: Record<GeodesicShapeType, number> = {
  tet: 0x3ba372, oct: 0x4db8a8, ico: 0x8b7cc9, cube: 0xcda852,
};

function makeGeom(type: GeodesicShapeType): THREE.BufferGeometry {
  switch (type) {
    case 'tet':  return new THREE.TetrahedronGeometry(1);
    case 'oct':  return new THREE.OctahedronGeometry(1);
    case 'ico':  return new THREE.IcosahedronGeometry(1);
    case 'cube': return new THREE.BoxGeometry(1.5, 1.5, 1.5);
  }
}

function cornersFromBox3(box: THREE.Box3): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const { min, max } = box;
  for (const x of [min.x, max.x])
    for (const y of [min.y, max.y])
      for (const z of [min.z, max.z])
        pts.push(new THREE.Vector3(x, y, z));
  return pts;
}

const RING_POS = new THREE.Vector3(3.5, 0.06, 3.5);

export function mountGeodesicScene(
  container: HTMLElement,
  opts: GeodesicEngineOpts,
): GeodesicEngine {
  const { onEvent, onShapeCountChange } = opts;

  // ── Renderer ────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.25));
  renderer.setClearColor(0x0f1115, 1);
  const canvas = renderer.domElement;
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none';
  container.appendChild(canvas);

  // ── Scene, Camera, Controls ──────────────────────────────────────────────
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  camera.position.set(0, 4, 12);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  scene.add(new THREE.AmbientLight(0x404060, 2));
  const dir = new THREE.DirectionalLight(0x4db8a8, 3); dir.position.set(5, 10, 5); scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0xcda852, 1.5); dir2.position.set(-5, -5, 5); scene.add(dir2);
  scene.add(new THREE.GridHelper(20, 20, 0x1e2630, 0x1a1f26));

  // ── State ────────────────────────────────────────────────────────────────
  const shapes: THREE.Group[] = [];
  let wireMode = true;
  let solidMode = false;
  let autoSnapOn = false;
  let placementRing: THREE.Mesh | null = null;

  // ── Drag ────────────────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  raycaster.params.Line = { threshold: coarse ? 3 : 1 };
  const pointer = new THREE.Vector2();
  const dragIntersect = new THREE.Vector3();
  let buildDrag: { group: THREE.Group; pointerId: number; yLock: number; plane: THREE.Plane } | null = null;

  function hitShapeGroup(obj: THREE.Object3D): THREE.Group | null {
    let o: THREE.Object3D | null = obj;
    for (let i = 0; i < 24 && o; i++) {
      if (shapes.includes(o as THREE.Group)) return o as THREE.Group;
      o = o.parent;
    }
    return null;
  }

  function setNdcFromEvent(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      ((e.clientY - r.top) / r.height) * -2 + 1,
    );
  }

  // ── Snap ────────────────────────────────────────────────────────────────
  function trySnap(dragged: THREE.Group) {
    if (!autoSnapOn || shapes.length < 2) return;
    const boxA = new THREE.Box3().setFromObject(dragged);
    const cA = cornersFromBox3(boxA);
    let bestD = 1e9;
    let best: { ca: THREE.Vector3; cb: THREE.Vector3 } | null = null;
    for (const other of shapes) {
      if (other === dragged) continue;
      const cB = cornersFromBox3(new THREE.Box3().setFromObject(other));
      for (const ca of cA) for (const cb of cB) {
        const d = ca.distanceTo(cb);
        if (d < bestD) { bestD = d; best = { ca, cb }; }
      }
    }
    if (!best || bestD > 5.5) return;
    dragged.position.add(new THREE.Vector3().subVectors(best.cb, best.ca));
    onEvent('snap_used');
  }

  function checkRingReach() {
    if (!placementRing || !shapes.length) return;
    const p = shapes[0].position;
    if (Math.hypot(p.x - RING_POS.x, p.z - RING_POS.z) < 2.2) onEvent('ring_reached');
  }

  // ── Pointer events ───────────────────────────────────────────────────────
  canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.button !== 0) return;
    setNdcFromEvent(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(shapes, true);
    if (!hits.length) return;
    const g = hitShapeGroup(hits[0].object);
    if (!g) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const y0 = g.position.y;
    buildDrag = {
      group: g, pointerId: e.pointerId, yLock: y0,
      plane: new THREE.Plane().setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, y0, 0),
      ),
    };
    canvas.setPointerCapture(e.pointerId);
    controls.enabled = false;
  }, { capture: true });

  canvas.addEventListener('pointermove', (e: PointerEvent) => {
    if (!buildDrag || e.pointerId !== buildDrag.pointerId) return;
    setNdcFromEvent(e);
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(buildDrag.plane, dragIntersect)) {
      buildDrag.group.position.set(dragIntersect.x, buildDrag.yLock, dragIntersect.z);
    }
  });

  function endDrag(e: PointerEvent) {
    if (!buildDrag || e.pointerId !== buildDrag.pointerId) return;
    const g = buildDrag.group;
    try { canvas.releasePointerCapture(e.pointerId); } catch { /* */ }
    buildDrag = null;
    controls.enabled = true;
    trySnap(g);
    checkRingReach();
    onEvent('any_tap');
  }

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // ── Orbit detection ──────────────────────────────────────────────────────
  let orbitFired = false, zoomFired = false, dolly0: number | null = null;
  controls.addEventListener('start', () => {
    if (!orbitFired) { orbitFired = true; onEvent('orbit'); }
    dolly0 = camera.position.distanceTo(controls.target);
  });
  controls.addEventListener('end', () => {
    if (zoomFired || dolly0 == null) return;
    const d1 = camera.position.distanceTo(controls.target);
    if (Math.abs(d1 - dolly0) > 0.08) { zoomFired = true; onEvent('zoom'); }
  });
  canvas.addEventListener('wheel', () => {
    if (!zoomFired) { zoomFired = true; onEvent('zoom'); }
  }, { passive: true });

  // ── Resize ────────────────────────────────────────────────────────────────
  const ro = new ResizeObserver(() => {
    const w = container.offsetWidth, h = container.offsetHeight;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.25));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(container);
  // Initial size
  const w0 = container.offsetWidth || 1, h0 = container.offsetHeight || 1;
  renderer.setSize(w0, h0);
  camera.aspect = w0 / h0;
  camera.updateProjectionMatrix();

  // ── Animate ───────────────────────────────────────────────────────────────
  let animId = 0;
  let t = 0;
  function animate() {
    animId = requestAnimationFrame(animate);
    t += 0.005;
    if (placementRing) { const s = 1 + 0.1 * Math.sin(t * 4); placementRing.scale.set(s, s, 1); }
    if (document.hidden) return;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // ── Engine API ────────────────────────────────────────────────────────────
  function buildGroup(type: GeodesicShapeType): THREE.Group {
    const color = COLORS[type];
    const geom = makeGeom(type);
    const group = new THREE.Group();
    if (solidMode || !wireMode) {
      group.add(new THREE.Mesh(geom, new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.4, side: THREE.DoubleSide })));
    }
    if (wireMode) {
      group.add(new THREE.LineSegments(new THREE.WireframeGeometry(geom), new THREE.LineBasicMaterial({ color })));
    }
    return group;
  }

  function rebuildAll() {
    const data = shapes.map(s => ({ type: s.userData['type'] as GeodesicShapeType, pos: s.position.clone() }));
    shapes.forEach(s => scene.remove(s));
    shapes.length = 0;
    data.forEach(d => {
      const g = buildGroup(d.type);
      g.position.copy(d.pos);
      g.userData['type'] = d.type;
      scene.add(g);
      shapes.push(g);
    });
    onShapeCountChange(shapes.length);
  }

  return {
    addShape(type) {
      const g = buildGroup(type);
      g.position.set((Math.random() - 0.5) * 6, 0.5, (Math.random() - 0.5) * 6);
      g.userData['type'] = type;
      scene.add(g);
      shapes.push(g);
      onShapeCountChange(shapes.length);
      onEvent('shape_added:' + type);
      onEvent('shape_count:' + shapes.length);
    },

    resetShapes() {
      shapes.forEach(s => scene.remove(s));
      shapes.length = 0;
      onShapeCountChange(0);
    },

    setWireMode(on) { wireMode = on; rebuildAll(); },
    setSolidMode(on) { solidMode = on; rebuildAll(); },
    setAutoSnap(on) { autoSnapOn = on; },

    autoArrange() {
      shapes.forEach((s, i) => {
        const angle = i * (Math.PI * 2 / shapes.length);
        const r = Math.max(2, shapes.length * 0.8);
        s.position.set(Math.cos(angle) * r, 0.5, Math.sin(angle) * r);
      });
    },

    showPlacementRing() {
      if (placementRing) return;
      placementRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.4, 0.07, 8, 48),
        new THREE.MeshBasicMaterial({ color: 0x4db8a8, transparent: true, opacity: 0.5 }),
      );
      placementRing.rotation.x = Math.PI / 2;
      placementRing.position.copy(RING_POS);
      scene.add(placementRing);
    },

    hidePlacementRing() {
      if (!placementRing) return;
      scene.remove(placementRing);
      placementRing.geometry.dispose();
      placementRing = null;
    },

    dispose() {
      cancelAnimationFrame(animId);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
