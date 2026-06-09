/**
 * WCD-08 Phase A: CockpitLayout — The Spatial Doctrine Enforcer.
 * 
 * Z-INDEX CONTRACT:
 *   Layer 1 (z-1):  R3F Canvas — fills entire viewport
 *   Layer 2 (z-10): HUD Container — pointer-events: none passthrough
 *   Layer 3 (z-11): HUD Panels — pointer-events: auto per-panel
 *   Layer 4 (z-50): Toast layer — pointer-events: none
 * 
 * RULE: Layer 1 and Layer 3 never geometrically overlap.
 * The R3F canvas renders behind the glass HUD panels.
 * The visual gap between TopBar and ElementDock is where
 * the molecule lives. Camera framing handles this, not CSS.
 * 
 * PORTRAIT LAYOUT (default, mobile/tablet):
 *   TopBar (56px) → Viewport (flex-1) → ElementDock (72px) → CommandBar (56px)
 * 
 * LANDSCAPE LAYOUT (≥840px):
 *   Left Nav (72px) | TopBar + Viewport + Dock + Ping | Right Info (72px)
 *   (Landscape enhancement is Phase A stretch — portrait ships first)
 */

import { type ReactNode } from 'react';

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
}

export function CockpitLayout({
  viewport,
  topBar,
  elementDock,
  commandBar,
  toastLayer,
}: CockpitLayoutProps) {
  return (
    <div
      className="relative w-screen h-[100dvh] bg-[#050505] overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* ═══ Layer 1: R3F Canvas ═══
          Fills entire viewport. Renders behind everything.
          The glassmorphism panels create the cockpit window effect. */}
      <div className="absolute inset-0 z-[1]">
        {viewport}
      </div>

      {/* ═══ Layer 2: HUD Container ═══
          Covers full viewport. pointer-events: none so clicks pass
          through to the canvas. Individual panels enable their own
          pointer events. Flex column stacks the HUD zones. */}
      <div className="absolute inset-0 z-[10] pointer-events-none flex flex-col">

        {/* TOP BAR — 56px (h-14) */}
        <div className="shrink-0 h-14 px-2 pt-[env(safe-area-inset-top)]">
          {topBar}
        </div>

        {/* VIEWPORT GAP — the window where the universe lives.
            This div takes all remaining space. It's invisible.
            The canvas shows through because this div has no background
            and the HUD container is pointer-events: none. */}
        <div className="flex-1" />

        {/* ELEMENT DOCK — 72px */}
        <div className="shrink-0 h-[72px] px-2">
          {elementDock}
        </div>

        {/* COMMAND BAR — 56px (h-14) */}
        <div className="shrink-0 h-14 px-2 pb-[env(safe-area-inset-bottom)]">
          {commandBar}
        </div>
      </div>

      {/* ═══ Layer 4: Toast ═══
          Centered horizontally, positioned above the dock.
          pointer-events: none — toasts are display-only. */}
      {toastLayer && (
        <div className="absolute inset-x-0 bottom-[200px] z-[50] pointer-events-none flex justify-center px-4">
          {toastLayer}
        </div>
      )}
    </div>
  );
}
