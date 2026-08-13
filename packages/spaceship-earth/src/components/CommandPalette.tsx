import { useState, useEffect, useRef, useMemo } from 'react';
import { useShipStore } from '../store/shipStore';

let openMcpExplorer: (() => void) | null = null;
export const setOpenMcpExplorer = (fn: () => void) => { openMcpExplorer = fn; };

let openMetricsDashboard: (() => void) | null = null;
export const setOpenMetricsDashboard = (fn: () => void) => { openMetricsDashboard = fn; };

interface Command {
  id: string;
  label: string;
  category: string;
  action: () => void;
  shortcut?: string;
}

const COMMANDS: Command[] = [
  { id: 'spoons-0', label: 'Sensory rest (spoons: 0)', category: 'Spoons', action: () => useShipStore.getState().setSpoons(0) },
  { id: 'spoons-1', label: 'Spoons: 1', category: 'Spoons', action: () => useShipStore.getState().setSpoons(1) },
  { id: 'spoons-2', label: 'Spoons: 2', category: 'Spoons', action: () => useShipStore.getState().setSpoons(2) },
  { id: 'spoons-3', label: 'Spoons: 3', category: 'Spoons', action: () => useShipStore.getState().setSpoons(3) },
  { id: 'spoons-4', label: 'Spoons: 4', category: 'Spoons', action: () => useShipStore.getState().setSpoons(4) },
  { id: 'spoons-5', label: 'Spoons: 5', category: 'Spoons', action: () => useShipStore.getState().setSpoons(5) },
  { id: 'toggle-k4', label: 'Toggle K₄ wireframe', category: 'View', action: () => useShipStore.getState().setShowK4Wireframe(!useShipStore.getState().showK4Wireframe), shortcut: 'K' },
  { id: 'toggle-led', label: 'Toggle LED panel', category: 'View', action: () => useShipStore.getState().setLedCollapsed(!useShipStore.getState().ledCollapsed) },
  { id: 'view-ambient', label: 'Ambient view', category: 'View', action: () => useShipStore.getState().setSelectedNode(null) },
  { id: 'view-detail', label: 'Detail view', category: 'View', action: () => useShipStore.getState().setSelectedNode(0) },
  { id: 'reset-camera', label: 'Reset camera', category: 'Camera', action: () => useShipStore.getState().setSelectedNode(null) },
  { id: 'mcp:explorer', label: 'MCP Explorer', category: 'Tool', action: () => openMcpExplorer?.(), shortcut: 'M' },
  { id: 'toggle-paper', label: 'Toggle Paper Mode', category: 'View', action: () => {
    const on = document.documentElement.getAttribute('data-paper') === 'true';
    document.documentElement.setAttribute('data-paper', String(!on));
  }, shortcut: 'P' },
  { id: 'toggle-gaze', label: 'Toggle Gaze Tracking', category: 'Accessibility', action: () => {
    useShipStore.getState().setGazeActive(!useShipStore.getState().gazeActive);
  }, shortcut: 'G' },
  { id: 'metrics-dashboard', label: 'Metrics Dashboard', category: 'Tool', action: () => openMetricsDashboard?.(), shortcut: 'D' },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onAction?: (id: string) => void;
}

export default function CommandPalette({ open, onClose, onAction }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter((c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); return; }
      if (e.key === 'Enter') { e.preventDefault(); filtered[selected]?.action(); onClose(); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, selected, onClose]);

  if (!open) return null;

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette-panel" onClick={(e) => e.stopPropagation()}>
        <div className="palette-header">
          <span className="palette-icon" aria-hidden="true">⌘</span>
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Type a command…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            autoFocus
          />
          <kbd className="palette-esc" onClick={onClose}>ESC</kbd>
        </div>
        <ul className="palette-list" role="listbox">
          {filtered.length === 0 && <li className="palette-empty">No commands found.</li>}
          {filtered.map((cmd, i) => (
            <li
              key={cmd.id}
              role="option"
              aria-selected={i === selected}
              className={`palette-item${i === selected ? ' selected' : ''}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => { cmd.action(); onClose(); }}
            >
              <span className="palette-item-label">{cmd.label}</span>
              <span className="palette-item-meta">
                <span className="palette-category">{cmd.category}</span>
                {cmd.shortcut && <kbd className="palette-shortcut">{cmd.shortcut}</kbd>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
