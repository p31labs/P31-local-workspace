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
import { useEffect, useRef } from 'react';
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
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;

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
      guide.geometry.dispose();
      (guide.material as THREE.Material).dispose();
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

export type { MusicZoneProps };