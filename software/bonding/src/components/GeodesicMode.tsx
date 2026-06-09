/**
 * GeodesicMode — Full-screen 3D builder + campaign coach, wired to Bonding via #geodesic.
 *
 * Layout: absolute-positioned container holds:
 *   - Three.js canvas (imperative, via geodesicThree engine)
 *   - React HUD overlay (toolbar, coach, info panel)
 *
 * The engine and the HUD are siblings so React never re-renders the canvas.
 * Campaign events flow: engine.onEvent → store.fireEvent → HUD re-renders.
 * External events (WS, other callers): window.__geodesicEvent(type).
 */

import { useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { GEODESIC_CAMPAIGN } from '@p31/shared/geodesic-campaign';
import { useGeodesicStore, unlockedThroughTrack } from '../store/geodesicStore';
import { mountGeodesicScene } from '../engine/geodesicThree';
import type { GeodesicEngine, GeodesicShapeType } from '../engine/geodesicThree';

declare global {
  interface Window {
    __geodesicEvent?: (type: string) => void;
  }
}

const SHAPE_TYPES: GeodesicShapeType[] = ['tet', 'oct', 'ico', 'cube'];
const SHAPE_LABELS: Record<GeodesicShapeType, string> = { tet: 'Tet', oct: 'Oct', ico: 'Ico', cube: 'Cube' };

export function GeodesicMode() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GeodesicEngine | null>(null);

  // ── Store ──────────────────────────────────────────────────────────────────
  const trackIdx      = useGeodesicStore(s => s.trackIdx);
  const stepIdx       = useGeodesicStore(s => s.stepIdx);
  const coachDone     = useGeodesicStore(s => s.coachDone);
  const coachMinimized = useGeodesicStore(s => s.coachMinimized);
  const toastMsg      = useGeodesicStore(s => s.toastMsg);
  const shapeCount    = useGeodesicStore(s => s.shapeCount);
  const wireMode      = useGeodesicStore(s => s.wireMode);
  const solidMode     = useGeodesicStore(s => s.solidMode);
  const autoSnap      = useGeodesicStore(s => s.autoSnap);

  const fireEvent        = useGeodesicStore(s => s.fireEvent);
  const skipCoach        = useGeodesicStore(s => s.skipCoach);
  const setCoachMinimized = useGeodesicStore(s => s.setCoachMinimized);
  const setShapeCount    = useGeodesicStore(s => s.setShapeCount);
  const setWireMode      = useGeodesicStore(s => s.setWireMode);
  const setSolidMode     = useGeodesicStore(s => s.setSolidMode);
  const setAutoSnap      = useGeodesicStore(s => s.setAutoSnap);

  const track   = GEODESIC_CAMPAIGN.tracks[trackIdx];
  const step    = track?.steps[stepIdx] ?? null;
  const unlocked = useMemo(() => new Set(coachDone
    ? SHAPE_TYPES.map(t => 'btn-' + t)
    : unlockedThroughTrack(trackIdx)
  ), [trackIdx, coachDone]);

  // ── Mount engine ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const engine = mountGeodesicScene(el, {
      onEvent: fireEvent,
      onShapeCountChange: setShapeCount,
    });
    engineRef.current = engine;

    // Seed first shape
    engine.addShape('tet');

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync wire/solid/snap to engine ─────────────────────────────────────────
  useEffect(() => { engineRef.current?.setWireMode(wireMode); }, [wireMode]);
  useEffect(() => { engineRef.current?.setSolidMode(solidMode); }, [solidMode]);
  useEffect(() => { engineRef.current?.setAutoSnap(autoSnap); }, [autoSnap]);

  // ── Placement ring: show during scootch track, hide after ───────────────────
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const trackId = GEODESIC_CAMPAIGN.tracks[trackIdx]?.id;
    if (trackId === 'scootch') {
      engine.showPlacementRing();
    } else {
      engine.hidePlacementRing();
    }
  }, [trackIdx, coachDone]);

  // ── window.__geodesicEvent bridge ──────────────────────────────────────────
  useEffect(() => {
    window.__geodesicEvent = fireEvent;
    return () => { delete window.__geodesicEvent; };
  }, [fireEvent]);

  // ── Button handlers ────────────────────────────────────────────────────────
  function handleAddShape(type: GeodesicShapeType) {
    engineRef.current?.addShape(type);
  }

  function handleToggleWire() {
    const next = !wireMode;
    setWireMode(next);
  }

  function handleToggleSolid() {
    const next = !solidMode;
    setSolidMode(next);
  }

  function handleReset() {
    engineRef.current?.resetShapes();
  }

  function handleArrange() {
    engineRef.current?.autoArrange();
  }

  function handleToggleSnap() {
    const next = !autoSnap;
    setAutoSnap(next);
    if (next) fireEvent('snap_enabled');
  }

  function handleBack() {
    window.location.hash = 'bonding';
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const showCoach   = !coachDone && step && !coachMinimized;
  const showPill    = !coachDone && step && coachMinimized;

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#0f1115', color: '#d8d6d0', fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', minHeight: 48, background: 'rgba(15,17,21,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, zIndex: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>GEODESIC</span>
        <button
          type="button"
          onClick={handleBack}
          style={{ color: 'rgba(216,214,208,0.4)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ← Bonding
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ background: 'rgba(22,25,32,0.8)', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
        <nav style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
          <span style={{ fontSize: 9, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(216,214,208,0.4)', padding: '0 4px' }}>Add</span>
          {SHAPE_TYPES.map(type => {
            const btnId = 'btn-' + type;
            const locked = !unlocked.has(btnId);
            return (
              <button
                key={type}
                type="button"
                disabled={locked}
                onClick={() => !locked && handleAddShape(type)}
                style={{
                  fontFamily: 'inherit', fontSize: 11, padding: '6px 10px', borderRadius: 6, cursor: locked ? 'not-allowed' : 'pointer',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(22,25,32,0.8)',
                  color: locked ? 'rgba(216,214,208,0.2)' : 'rgba(216,214,208,0.6)',
                  minHeight: 40, minWidth: 40, opacity: locked ? 0.22 : 1,
                  touchAction: 'manipulation',
                }}
              >{SHAPE_LABELS[type]}</button>
            );
          })}
          <span style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.1)', margin: '0 2px', flexShrink: 0 }} />
          <span style={{ fontSize: 9, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(216,214,208,0.4)', padding: '0 4px' }}>View</span>
          <button type="button" onClick={handleToggleWire} style={btnStyle(wireMode)}>Wire</button>
          <button type="button" onClick={handleToggleSolid} style={btnStyle(solidMode)}>Solid</button>
          <span style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.1)', margin: '0 2px', flexShrink: 0 }} />
          <span style={{ fontSize: 9, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(216,214,208,0.4)', padding: '0 4px' }}>Scene</span>
          <button type="button" onClick={handleReset} style={btnStyle(false)}>Reset</button>
          <button type="button" onClick={handleArrange} style={btnStyle(false)}>Arrange</button>
          <span style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.1)', margin: '0 2px', flexShrink: 0 }} />
          <button
            type="button"
            onClick={handleToggleSnap}
            style={btnStyle(autoSnap)}
          >Snap</button>
          {shapeCount > 0 && (
            <span style={{ fontSize: 9, color: '#cda852', padding: '0 4px', whiteSpace: 'nowrap' }}>
              {shapeCount} shape{shapeCount !== 1 ? 's' : ''}
            </span>
          )}
        </nav>
      </div>

      {/* ── Three.js mount ── */}
      <div ref={mountRef} style={{ flex: 1, position: 'relative', minHeight: 0 }}>

        {/* ── HUD ── */}
        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'rgba(216,214,208,0.3)', pointerEvents: 'none', textAlign: 'center', lineHeight: 1.4 }}>
          {autoSnap
            ? 'Drag shapes · release near another to join corners (snap on)'
            : 'Drag a shape to move · drag empty area to orbit · pinch to zoom'}
        </div>

        {/* ── Coach card ── */}
        {showCoach && (
          <div style={{ position: 'absolute', bottom: 'calc(42px + env(safe-area-inset-bottom, 0px))', left: 10, zIndex: 50, maxWidth: 'min(90vw, 320px)', pointerEvents: 'auto' }}>
            <div style={{ background: 'rgba(22,25,32,0.95)', border: '1px solid rgba(205,168,82,0.2)', borderRadius: 10, padding: '12px 32px 10px 12px', backdropFilter: 'blur(8px)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', position: 'relative' }}>
              <button
                type="button"
                onClick={() => setCoachMinimized(true)}
                style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: 'rgba(216,214,208,0.25)', cursor: 'pointer', fontSize: 13, padding: '2px 6px', lineHeight: 1, fontFamily: 'inherit' }}
                aria-label="Minimize coach"
              >×</button>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.3rem', flexShrink: 0, opacity: 0.75, lineHeight: 1.3 }}>{step!.emoji}</span>
                <div>
                  <div style={{ fontFamily: "'Atkinson Hyperlegible', sans-serif", fontSize: 13, color: '#d8d6d0', lineHeight: 1.45 }}>{step!.msg}</div>
                  <div style={{ fontSize: 9, color: 'rgba(216,214,208,0.25)', marginTop: 5, display: 'flex', gap: 10 }}>
                    <span>{track.label} · {stepIdx + 1}/{track.steps.length}</span>
                    <button type="button" onClick={skipCoach} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontFamily: 'inherit', font: 'inherit' }}>skip</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Coach pill (minimized) ── */}
        {showPill && (
          <button
            type="button"
            onClick={() => setCoachMinimized(false)}
            style={{ position: 'absolute', bottom: 'calc(42px + env(safe-area-inset-bottom, 0px))', left: 10, zIndex: 50, fontFamily: 'inherit', fontSize: 11, color: 'rgba(205,168,82,0.6)', background: 'rgba(22,25,32,0.9)', border: '1px solid rgba(205,168,82,0.2)', borderRadius: 22, minHeight: 44, minWidth: 44, padding: '8px 16px', cursor: 'pointer', pointerEvents: 'auto', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
          >{step!.emoji} {stepIdx + 1}/{track.steps.length} — tap to show</button>
        )}
      </div>

      {/* ── Toast ── */}
      {toastMsg && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))', background: 'rgba(37,137,125,0.95)', borderRadius: 10, padding: '10px 16px', fontFamily: "'Atkinson Hyperlegible', sans-serif", fontSize: 14, fontWeight: 500, color: '#d8d6d0', zIndex: 60, pointerEvents: 'none', maxWidth: 'min(94vw, 400px)', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.35)' }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}

function btnStyle(active: boolean): React.CSSProperties {
  return {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    padding: '6px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    border: active ? '1px solid #25897d' : '1px solid rgba(255,255,255,0.1)',
    background: active ? 'rgba(37,137,125,0.15)' : 'rgba(22,25,32,0.8)',
    color: active ? '#4db8a8' : 'rgba(216,214,208,0.6)',
    minHeight: 40,
    minWidth: 40,
    touchAction: 'manipulation',
    transition: 'all 0.15s',
    flexShrink: 0,
  };
}

export default GeodesicMode;
