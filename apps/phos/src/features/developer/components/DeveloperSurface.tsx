import { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
  timestamp: number;
}

const welcomeLines: TerminalLine[] = [
  { type: 'system', text: 'PHOS Developer Console v2.0', timestamp: Date.now() },
  { type: 'system', text: 'Type "help" for available commands.', timestamp: Date.now() },
];

const commands: Record<string, (args: string[]) => string> = {
  help: () => [
    'Available commands:',
    '  help       — Show this help',
    '  status     — System status',
    '  surfaces   — List available surfaces',
    '  tools      — List MCP tools',
    '  clear      — Clear terminal',
    '  spoons     — Show current spoon level',
    '  version    — Show PHOS version',
    '  date       — Show current date/time',
  ].join('\n'),
  status: () => 'PHOS v2.0.0 — All systems operational.\nGateway: healthy\nLOVE Ledger: healthy\nFederation: healthy',
  surfaces: () => 'Available surfaces:\n  hearth, passport, vault, bonding,\n  dashboard, ledger, developer,\n  settings',
  tools: () => 'MCP Tools: 137 available across 8 servers\n  Oasis (11), Registry (5), LOVE (4),\n  Forge (29), Cognitive (47),\n  Comms (20), MARGE (10), BOB (10)',
  clear: () => '__CLEAR__',
  spoons: () => `Current spoons: ${document.documentElement.getAttribute('data-spoons') || '3'}`,
  version: () => 'PHOS v2.0.0 (React 19 + Vite 6.4 + Tailwind v4)',
  date: () => new Date().toISOString(),
};

export function DeveloperSurface() {
  const [lines, setLines] = useState<TerminalLine[]>(welcomeLines);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const exec = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const newLines: TerminalLine[] = [
      { type: 'input', text: `$ ${trimmed}`, timestamp: Date.now() },
    ];

    const [command, ...args] = trimmed.split(/\s+/);
    const handler = commands[command.toLowerCase()];

    if (handler) {
      const result = handler(args);
      if (result === '__CLEAR__') {
        setLines([]);
        setInput('');
        return;
      }
      newLines.push({ type: 'output', text: result, timestamp: Date.now() });
    } else {
      newLines.push({ type: 'error', text: `Command not found: ${command}. Type "help" for available commands.`, timestamp: Date.now() });
    }

    setLines(prev => [...prev, ...newLines]);
    setHistory(prev => [...prev, trimmed]);
    setHistoryIdx(-1);
    setInput('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      exec(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(idx);
      setInput(history[history.length - 1 - idx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setInput(idx >= 0 ? history[history.length - 1 - idx] : '');
    }
  };

  const lineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-quantum-cyan';
      case 'output': return 'text-ink';
      case 'error': return 'text-red-400';
      case 'system': return 'text-quantum-violet';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="developerSurface" data-mcp-state={input ? 'hasInput' : 'idle'}>
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Developer</h1>
        <p className="text-cloud/50 text-sm">Terminal and system tools.</p>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden" strong>
        <div className="p-4 h-96 overflow-y-auto bg-void font-mono-tech text-sm">
          {lines.map((line, i) => (
            <div key={i} className={`whitespace-pre-wrap ${lineColor(line.type)}`}>
              {line.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex items-center border-t border-white/[0.06] px-4 py-2 bg-void-raised/50">
          <span className="text-quantum-cyan font-mono-tech mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent text-ink font-mono-tech text-sm outline-none placeholder:text-cloud/20"
            placeholder="Type a command..."
            autoFocus
            aria-label="Terminal input"
            data-mcp-tool="developerInput"
            data-mcp-type="input"
            data-mcp-target="developer-input"
          />
        </div>
      </GlassCard>
    </div>
  );
}
