/**
 * WCD-08 → WCD-16: CockpitLayout — The Spatial Doctrine Enforcer.
 *
 * Z-INDEX CONTRACT:
 *   Layer 1 (z-1):  R3F Canvas — fills entire viewport
 *   Layer 2 (z-10): HUD Container — pointer-events: none passthrough
 *   Layer 3 (z-11): HUD Panels — pointer-events: auto per-panel
 *   Layer 4 (z-20): Floating overlays — existing panels not yet migrated
 *   Layer 5 (z-50): Toast layer — pointer-events: none
 *
 * WCD-16: Replaced flex-col spacer with ABSOLUTE ANCHORING.
 * Top UI anchored to top-0, bottom UI anchored to bottom-0.
 * Mathematically impossible for them to push each other off-screen.
 */

import { type ReactNode } from 'react';
import { useGameStore } from '../../store/gameStore';
import { WONKY_FOOTER } from '../../config/easterEggs';

interface CockpitLayoutProps {
  /** The R3F <Canvas> component — rendered at z-1, fills entire viewport */
  viewport: ReactNode;
  /** TopBar content: nav trigger, title, LoveCounter */
  topBar: ReactNode;
  /** Element palette: horizontal scrolling element buttons */
  elementDock: ReactNode;
  /** Bottom bar: ping reactions, stability gauge, difficulty selector */
  commandBar: ReactNode;
  /** Achievement toasts — rendered at z-50, pointer-events: none */
  toastLayer?: ReactNode;
  /** Floating overlays: existing panels retained at z-20 during Phase A migration */
  children?: ReactNode;
}

export function CockpitLayout({
  viewport,
  topBar,
  elementDock,
  commandBar,
  toastLayer,
  children,
}: CockpitLayoutProps) {
  const bloodMoonActive = useGameStore((s) => s.bloodMoonActive);

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* ═══ Layer 1: R3F Canvas ═══
          Fills entire viewport. Renders behind everything. */}
      <div className="absolute inset-0 z-[1]">
        {viewport}
      </div>

      {/* ═══ Layer 1.5: Blood Moon Haze ═══
          Two layers toggled by BloodMoonNode ember.
          1. Vignette — dark crimson edges, clear center. Cinematic.
          2. Warm wash — off-center glow, slow CSS breathe cycle.
          Both pointer-events:none, 1.5s fade transition. */}
      <div
        className={`absolute inset-0 z-[5] pointer-events-none transition-opacity duration-[1500ms] ${
          bloodMoonActive ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 75%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 75%)',
        }}
      >
        {/* Vignette: darkens top + side edges with warm crimson */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, transparent 25%, rgba(60,0,0,0.15) 55%, rgba(30,0,0,0.35) 100%)',
          }}
        />
        {/* Warm wash: upper glow that breathes */}
        <div
          className="absolute inset-0 haze-breathe"
          style={{
            background: 'radial-gradient(circle at 35% 30%, rgba(120,20,0,0.12) 0%, transparent 45%)',
            mixBlendMode: 'screen',
          }}
        />
      </div>

      {/* ═══ Layer 2: HUD Container ═══
          Covers full viewport. pointer-events: none so clicks pass
          through to the canvas. Individual panels enable their own
          pointer events via GlassPanel or explicit pointer-events-auto.

          WCD-16: Absolute anchoring — top and bottom are independent.
          No flex-col, no spacer, no overflow possible. */}
      <div className="absolute inset-0 z-[10] pointer-events-none">

        {/* TOP ANCHOR — TopBar pinned to top edge.
            WCD-18: safe-area padding is OUTSIDE the h-14 content box so
            the bar always gets its full 56px regardless of notch/status bar. */}
        <div
          className="absolute top-0 inset-x-0 px-2"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="h-14">{topBar}</div>
        </div>

        {/* BOTTOM ANCHOR — ElementDock + CommandBar pinned to bottom edge.
            WCD-18: inline style ensures env() works reliably in Safari.
            WCD-29: flex-col-reverse so palette is ALWAYS at the bottom.
            Command bar sits above it. No layout shift when it appears. */}
        <div
          className="absolute bottom-0 inset-x-0 px-2 mb-1 flex flex-col-reverse gap-1"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="h-[72px]">{elementDock}</div>
          {commandBar && <div className="h-14">{commandBar}</div>}
        </div>
      </div>

      {/* ═══ Layer 4: Floating overlays ═══
          Phase A: existing absolute-positioned panels live here during migration.
          pointer-events: none on wrapper; individual elements manage their own. */}
      {children && (
        <div className="absolute inset-0 z-[20] pointer-events-none">
          {children}
        </div>
      )}

      {/* ═══ Layer 5: Toast layer ═══
          Centered horizontally, positioned above the dock.
          pointer-events: none — toasts are display-only. */}
      {toastLayer && (
        <div className="absolute inset-x-0 bottom-[160px] z-[50] pointer-events-none flex justify-center px-4">
          {toastLayer}
        </div>
      )}

      {/* WCD-CC01: Wonky footer — above element dock */}
      <div
        style={{
          position: 'fixed',
          bottom: 82,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 10,
          opacity: 0.15,
          color: 'white',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 5,
          fontStyle: 'italic',
        }}
      >
        {WONKY_FOOTER}
      </div>
    </div>
  );
}
