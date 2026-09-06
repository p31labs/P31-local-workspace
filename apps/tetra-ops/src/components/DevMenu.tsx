/**
 * @file DevMenu — Floating developer toolbar for tetra-ops.
 * Toggle: Ctrl+Shift+D. Draggable, persists position in localStorage.
 * Extensible: tools array maps tabs to panels.
 */

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { trackUiEvent } from '@p31/ui';
const PASSPORT_CREATED_KEY = 'passport_created';

export interface DevMenuTool {
  id: string;
  label: string;
  emoji: string;
  Component: React.ComponentType;
}

export interface DevMenuProps {
  tools: DevMenuTool[];
}

const POS_KEY = 'p31:devmenu-pos';
const DEFAULT_POS = { x: 20, y: 100 };

function readPos() {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (raw) { const p = JSON.parse(raw); if (typeof p.x === 'number' && typeof p.y === 'number') return p; }
  } catch {}
  return DEFAULT_POS;
}

export function DevMenu({ tools }: DevMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(tools[0]?.id ?? '');
  const [pos, setPos] = useState(readPos);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ ox: number; oy: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hotkey listener
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      setOpen((o) => { trackUiEvent('devmenu', 'open'); return !o; });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  // Drag handlers
  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !dragging) return;
    setPos({ x: e.clientX - dragRef.current.ox, y: e.clientY - dragRef.current.oy });
  };
  const onPointerUp = () => {
    if (dragging) {
      localStorage.setItem(POS_KEY, JSON.stringify(pos));
      setDragging(false);
      dragRef.current = null;
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
          title="Dev Menu (Ctrl+Shift+D)"
        aria-label="Open developer menu"
        style={{
          position: 'fixed',
          bottom: 36,
          right: 14,
          zIndex: 100,
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(10,10,20,0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,240,255,0.15)',
          color: 'rgba(0,240,255,0.5)',
          fontSize: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ⚙
      </button>
    );
  }

  const ActivePanel = tools.find(t => t.id === activeTab)?.Component;

  return (
    <div
      ref={containerRef}
      className="devmenu"
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 100,
        fontFamily: 'var(--p31-font-mono, monospace)',
        userSelect: 'none',
      }}
    >
      {/* Tab bar */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          background: 'rgba(10,10,20,0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,240,255,0.15)',
          borderRadius: 10,
          overflow: 'hidden',
          cursor: dragging ? 'grabbing' : 'grab',
          paddingRight: 4,
        }}
      >
        {tools.map((t) => {
          const active = t.id === activeTab;
          return (
            <button
              key={t.id}
              onClick={(e) => { e.stopPropagation(); setActiveTab(t.id); trackUiEvent('devmenu_tool', t.id); }}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                border: 'none',
                background: active ? 'rgba(0,240,255,0.12)' : 'transparent',
                color: active ? '#00f0ff' : 'rgba(240,242,245,0.5)',
                fontSize: 10,
                cursor: 'pointer',
                fontWeight: active ? 600 : 400,
                borderRight: '1px solid rgba(255,255,255,0.06)',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => { setOpen(false); trackUiEvent('devmenu', 'close'); }}
          style={{
            padding: '4px 8px',
            border: 'none',
            background: 'transparent',
            color: 'rgba(240,242,245,0.3)',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* Panel */}
      {ActivePanel && (
        <div
          style={{
            marginTop: 4,
            maxWidth: 420,
            maxHeight: '60vh',
            overflow: 'auto',
            background: 'rgba(10,10,20,0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,240,255,0.12)',
            borderRadius: 10,
            padding: 12,
          }}
        >
          <ActivePanel />
          {/* Time-to-first-deploy */}
          {(() => {
            const pc = localStorage.getItem(PASSPORT_CREATED_KEY);
            const fd = localStorage.getItem('first_deploy');
            let label: string;
            if (pc && fd) {
              const delta = Math.round((Number(fd) - Number(pc)) / 1000);
              const m = Math.floor(delta / 60);
              const s = delta % 60;
              label = `${m}m ${s}s`;
            } else if (pc) {
              label = 'awaiting first deploy';
            } else {
              label = 'no passport created';
            }
            return (
              <div style={{ marginTop: 8, padding: '4px 8px', borderRadius: 4, background: 'rgba(0,240,255,0.03)', border: '1px solid rgba(0,240,255,0.06)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 9 }}>
                <span style={{ color: 'rgba(0,240,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>TTFDP</span>
                <span style={{ fontFamily: 'var(--p31-font-mono, monospace)', color: label.includes('await') || label.includes('no') ? 'rgba(240,242,245,0.2)' : '#00f0ff' }}>{label}</span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default DevMenu;
