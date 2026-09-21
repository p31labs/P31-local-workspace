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
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { resolveTokenRgb } from '../lib/tokens';
import { MusicZone, type MusicZoneProps } from './MusicZone';
import { phyllotaxisPosition, zoneGlow, type MusicZone as ZoneModel } from './musicZone';

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
}

const RADIUS = 2.2;
const LISTENER_DRAG_SPEED = 0.012;

export function SpatialScene({
  zones,
  triggers,
  listener,
  onListenerChange,
  onZoneTrigger,
  selectedId,
  reducedMotion,
}: SpatialSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onZoneTriggerRef = useRef(onZoneTrigger);
  onZoneTriggerRef.current = onZoneTrigger;
  const onListenerChangeRef = useRef(onListenerChange);
  onListenerChangeRef.current = onListenerChange;

  // Zone points + their uniforms, keyed by zone id. Built imperatively once;
  // positions update when a placed zone lands.
  const zoneMap = useRef(new Map<string, THREE.Points>());
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

    // Shared mutable listener position (written by drag handlers, read by the
    // frame). The parent's listener prop stays the source of truth for audio;
    // this ref tracks the in-scene position between commits.
    const setMarker = (p: [number, number, number]) => {
      listenerRef.current = p;
      markerGroup.position.set(p[0], p[1], p[2]);
    };
    setMarker(listener);

    // ── Sphere guide — a faint wireframe so the space reads as a space. ──
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

    // ── Camera orbit (drag) + the listener is NOT the camera. The one-finger
    //    interaction from the prototype: a single touch drag moves YOU across
    //    the sphere surface; two touches (or a mouse drag) orbit the camera.
    //    The listener move is a gesture-driven action (§8 of the build prompt)
    //    — it carries the instrument.listener.move data-agent-action semantics
    //    documented at the call site, since there is no single DOM element to
    //    hang the attribute on. It is EPHEMERAL: moving yourself is a live
    //    presence act, never a committed log entry.
    let yaw = 0;
    let pitch = 0.35;
    let dragging = false;
    let touchCount = 0;
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

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      touchCount += 1;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      if (touchCount >= 2) {
        yaw -= dx * 0.005;
        pitch = Math.max(-1.5, Math.min(1.5, pitch - dy * 0.005));
      } else if (e.pointerType === 'touch') {
        // Move the listener on the sphere surface (one finger is you).
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
    const onPointerUp = () => {
      dragging = false;
      touchCount = Math.max(0, touchCount - 1);
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
      for (const zone of zones) {
        const pts = zoneMap.current.get(zone.id);
        if (!pts) continue;
        const mat = pts.material as THREE.ShaderMaterial;
        const hits = triggers[zone.id] ?? [];
        let glow = 0;
        for (const ts of hits) glow += zoneGlow({ zone: zone.id, ts, actor: 'human' }, now);
        mat.uniforms.uTime.value = ambient;
        mat.uniforms.uGlow.value = Math.min(1, glow);
        pts.scale.setScalar(zone.id === selectedId ? 1.15 : 1);
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
      guide.geometry.dispose();
      (guide.material as THREE.Material).dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register each zone's THREE.Points with the shared map so the loop can
  // update its uniforms. Zones that arrive late (committed via SSE) land here.
  const handleReady = (points: THREE.Points, id: string) => {
    zoneMap.current.set(id, points);
  };
  const handleDispose = (id: string) => {
    zoneMap.current.delete(id);
  };

  return (
    <div className="spatial-scene" role="img" aria-label="The spatial instrument — zones of sound around you. Drag to look around.">
      <canvas ref={canvasRef} className="spatial-canvas" />
      <div className="spatial-listener" aria-hidden="true" style={{ display: 'none' }} />
      {zones.map((z) => (
        <MusicZone
          key={z.id}
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

export type { MusicZoneProps };