// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// ElementPalette: bottom tray of draggable elements
//
// Drag activation requires 20px threshold (prevents
// accidental drags on tap). Pointer events are captured
// at the window level to support drag-outside-element.
// ═══════════════════════════════════════════════════════

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ELEMENTS_ARRAY, ELEMENTS } from '../data/elements';
import { useGameStore } from '../store/gameStore';
import { getModeById } from '../data/modes';
import { playSelectBlip } from '../engine/sound';
import { BASHIUM } from '../config/bashium';
import type { ElementSymbol } from '../types';

const DRAG_THRESHOLD = 20;
const DEAD_ZONE = 40;

function isInDeadZone(x: number, y: number): boolean {
  return (
    x < DEAD_ZONE ||
    y < DEAD_ZONE ||
    x > window.innerWidth - DEAD_ZONE ||
    y > window.innerHeight - DEAD_ZONE
  );
}

export function ElementPalette() {
  const dragging = useGameStore((s) => s.dragging);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const gameMode = useGameStore((s) => s.gameMode);
  const pushToast = useGameStore((s) => s.pushToast);
  const genesisComplete = useGameStore((s) => s.questProgress['genesis']?.completed ?? false);
  const kitchenComplete = useGameStore((s) => s.questProgress['kitchen']?.completed ?? false);

  // WCD-CC01: 3-tap hidden zone unlocks secret elements in Sapling mode
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const secretTapsRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSecretTap = useCallback(() => {
    secretTapsRef.current += 1;
    if (secretTapsRef.current >= 3) {
      setSecretUnlocked(true);
      secretTapsRef.current = 0;
      pushToast({
        icon: '\u{1F53A}',
        text: BASHIUM.unlockToast.line1,
        subtext: BASHIUM.unlockToast.line2,
        duration: 3000,
      });
      return;
    }
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { secretTapsRef.current = 0; }, 2000);
  }, [pushToast]);

  const visibleElements = useMemo(() => {
    if (!gameMode) return ELEMENTS_ARRAY;
    const mode = getModeById(gameMode);
    const modeElements = ELEMENTS_ARRAY.filter((el) => mode.palette.includes(el.symbol));
    // Bashium: appears in Seed palette after Genesis quest chain complete
    if (genesisComplete && gameMode === 'seed' && ELEMENTS['Ba']) {
      modeElements.push(ELEMENTS['Ba']);
    }
    // Willium: appears in Sprout palette after Kitchen quest chain complete
    if (kitchenComplete && gameMode === 'sprout' && ELEMENTS['Wi']) {
      modeElements.push(ELEMENTS['Wi']);
    }
    // WCD-CC01: Secret elements unlocked via 3-tap hidden zone in Sapling mode
    if (secretUnlocked && gameMode === 'sapling') {
      if (ELEMENTS['Ba'] && !modeElements.some(el => el.symbol === 'Ba')) {
        modeElements.push(ELEMENTS['Ba']);
      }
      if (ELEMENTS['Wi'] && !modeElements.some(el => el.symbol === 'Wi')) {
        modeElements.push(ELEMENTS['Wi']);
      }
    }
    return modeElements;
  }, [gameMode, genesisComplete, kitchenComplete, secretUnlocked]);
  const pendingRef = useRef<{
    element: ElementSymbol;
    x: number;
    y: number;
    pointerType: string;
  } | null>(null);
  const activatedRef = useRef(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handlePointerDown = useCallback(
    (element: ElementSymbol, e: React.PointerEvent) => {
      // Only preventDefault for mouse — touch needs native scroll
      if (e.pointerType === 'mouse') e.preventDefault();
      // Dead zone: ignore drags starting near screen edges
      if (isInDeadZone(e.clientX, e.clientY)) return;
      pendingRef.current = { element, x: e.clientX, y: e.clientY, pointerType: e.pointerType };
      activatedRef.current = false;
      playSelectBlip(ELEMENTS[element].frequency);
    },
    [],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const pending = pendingRef.current;
      if (!pending) return;

      if (!activatedRef.current) {
        const dx = e.clientX - pending.x;
        const dy = e.clientY - pending.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= DRAG_THRESHOLD) {
          // WCD-24: Only activate drag if movement is primarily vertical.
          // Horizontal movement → palette scroll (handled natively).
          // Mouse: skip directional check — no scroll conflict with mouse.
          const isMouse = pending.pointerType === 'mouse';
          if (isMouse || Math.abs(dy) > Math.abs(dx)) {
            activatedRef.current = true;
            useGameStore.getState().startDrag(pending.element);
          } else {
            // Horizontal swipe — cancel pending drag, let scroll happen
            pendingRef.current = null;
          }
        }
      }

      if (activatedRef.current) {
        useGameStore.getState().updateDragPointer(e.clientX, e.clientY);
      }
    };

    const onUp = () => {
      if (activatedRef.current) {
        useGameStore.getState().endDrag();
      } else if (pendingRef.current) {
        // Tap (no drag) → show ghost site preview for 3 seconds
        const el = pendingRef.current.element;
        if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        useGameStore.getState().setPreviewElement(el);
        previewTimerRef.current = setTimeout(() => {
          useGameStore.getState().setPreviewElement(null);
        }, 3000);
      }
      pendingRef.current = null;
      activatedRef.current = false;
    };

    // WCD-14: blur cancels drag if window loses focus (tab switch, alt-tab)
    const onBlur = () => onUp();
    const onVisChange = () => { if (document.hidden) onUp(); };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisChange);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  if (gamePhase === 'complete') return null;

  return (
    <div className="h-full relative select-none pointer-events-auto">
      <div
        ref={scrollRef}
        className="h-full flex items-center justify-center gap-3 px-4 overflow-x-auto scrollbar-none"
        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
      >
        {/* WCD-CC01: Hidden 3-tap zone — bottom-right, Sapling only */}
        {gameMode === 'sapling' && !secretUnlocked && (
          <div
            onClick={handleSecretTap}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 48,
              height: 48,
              zIndex: 2,
              cursor: 'default',
            }}
          />
        )}
        {visibleElements.map((el) => {
          const isDragging = dragging === el.symbol;
          return (
            <button
              key={el.symbol}
              type="button"
              onPointerDown={(e) => handlePointerDown(el.symbol, e)}
              className={`flex items-center justify-center rounded-full shrink-0 transition-all duration-150 active:scale-90 ${
                isDragging ? 'opacity-20 scale-75' : 'hover:scale-105'
              }`}
              style={{
                cursor: 'grab',
                touchAction: 'pan-x',
                width: 40,
                height: 40,
                minWidth: 40,
                minHeight: 40,
                background: 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${el.emissive}88`,
                boxShadow: `0 0 8px ${el.emissive}30`,
              }}
            >
              <span className="text-sm font-bold text-white/90"
                style={{ textShadow: `0 0 8px ${el.emissive}88` }}
              >
                {el.symbol}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
