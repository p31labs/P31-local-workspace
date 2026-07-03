import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Command {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  surfaces: Array<{ id: string; label: string; icon: string; group?: string }>;
  onSurfaceSelect: (id: string) => void;
  onSetSpoons?: (n: number) => void;
  onClearChat?: () => void;
}

type Fuse = InstanceType<any>;

export default function CommandPalette({ surfaces, onSurfaceSelect, onSetSpoons, onClearChat }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Command[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fuseModule, setFuseModule] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allCommands: Command[] = [
    ...surfaces.filter(s => s.group === 'primary').map(s => ({
      id: s.id,
      label: `Go to ${s.label}`,
      icon: s.icon,
      action: () => onSurfaceSelect(s.id),
      keywords: [s.id, s.label.toLowerCase()],
    })),
    ...surfaces.filter(s => s.group === 'secondary').map(s => ({
      id: s.id,
      label: `Go to ${s.label}`,
      icon: s.icon,
      action: () => onSurfaceSelect(s.id),
      keywords: [s.id, s.label.toLowerCase()],
    })),
    {
      id: 'spoon-0',
      label: 'Set energy to 0 (Crisis)',
      icon: '⊙',
      action: () => onSetSpoons?.(0),
      keywords: ['spoons', 'crisis', 'stop', 'pause', 'emergency'],
    },
    {
      id: 'spoon-1',
      label: 'Set energy to 1 (Sanctuary)',
      icon: '◐',
      action: () => onSetSpoons?.(1),
      keywords: ['spoons', 'sanctuary', 'low'],
    },
    {
      id: 'spoon-3',
      label: 'Set energy to 3 (Bridge)',
      icon: '◑',
      action: () => onSetSpoons?.(3),
      keywords: ['spoons', 'bridge', 'balanced'],
    },
    {
      id: 'spoon-5',
      label: 'Set energy to 5 (Quantum)',
      icon: '●',
      action: () => onSetSpoons?.(5),
      keywords: ['spoons', 'quantum', 'full', 'max'],
    },
    ...(onClearChat ? [{
      id: 'clear-history',
      label: 'Clear chat history',
      icon: '🗑',
      action: () => { if (window.confirm('Delete all chat messages?')) onClearChat(); },
      keywords: ['clear', 'delete', 'history', 'reset', 'wipe', 'erase'],
    } as Command] : []),
  ];

  useEffect(() => {
    if (!open) return;
    import('fuse.js').then(mod => {
      const Fuse = mod.default;
      const instance = new Fuse(allCommands, {
        keys: ['label', 'keywords'],
        threshold: 0.35,
        includeScore: true,
        shouldSort: true,
      });
      setFuseModule(instance);
      setResults(allCommands);
    });
  }, [open]);

  useEffect(() => {
    if (!allCommands.length) return;
    if (!query.trim()) {
      setResults(allCommands);
      setSelectedIndex(0);
      return;
    }
    if (fuseModule) {
      const raw = (fuseModule as any).search(query) as Array<{ item: Command }>;
      setResults(raw.map((r: any) => r.item));
      setSelectedIndex(0);
    }
  }, [query, fuseModule]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => {
          if (!prev) setTimeout(() => inputRef.current?.focus(), 100);
          return !prev;
        });
      }
      if (e.key === 'Escape') close();
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        results[selectedIndex].action();
        close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, results, selectedIndex, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-xl rounded-xl overflow-hidden shadow-2xl border"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--phos-bg) 88%, transparent)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderColor: 'var(--phos-border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search surfaces or commands..."
            className="w-full bg-transparent border-none outline-none text-sm font-light"
            style={{ color: 'var(--phos-text)' }}
            aria-label="Search surfaces and commands"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
          {results.length === 0 ? (
            <div className="text-center text-xs py-8" style={{ opacity: 0.4 }}>No matches found</div>
          ) : (
            results.map((cmd, idx) => (
              <button
                key={cmd.id}
                onClick={() => { cmd.action(); close(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left text-sm"
                style={{
                  backgroundColor: idx === selectedIndex ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: 'var(--phos-text)',
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <span className="text-base w-5 text-center flex-shrink-0" aria-hidden="true">{cmd.icon}</span>
                <span className="opacity-80">{cmd.label}</span>
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t flex justify-between text-[10px] font-mono" style={{ borderColor: 'rgba(255,255,255,0.05)', opacity: 0.3 }}>
          <span>↑↓ navigate &middot; ↵ select &middot; ⌘K / Esc close</span>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
