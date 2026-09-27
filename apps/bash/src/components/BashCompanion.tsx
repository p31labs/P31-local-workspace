import { useState, useRef, useEffect } from 'react';
import { GlassCard, GlowButton } from '@p31ca/ui/chrome';

interface Entry {
  type: 'input' | 'output';
  text: string;
}

const RESPONSES: Record<string, string> = {
  help: 'Available commands: help, status, spoons, uptime, clear, whoami, mesh, love, vibe',
  status: 'All systems nominal. 4 peers connected. Mesh is stable. Starfield operational.',
  spoons: 'Spoon level: 3/5 — moderate energy. Conserving animations and reducing cognitive load where possible.',
  uptime: 'System uptime: 14d 7h 32m. Last restart: 2026-07-06 16:28 UTC.',
  whoami: 'Guest — BASH shell companion. Sovereign. Private. Spoon-aware.',
  mesh: 'Tetrahedral mesh: 4 vertices connected. K₄ topology stable. Federation bridge live.',
  love: 'LOVE balance: 473 credits. Care score: 88. Recent activity: 3 transactions.',
  vibe: 'Current vibe: focused. Ambient mode: soft. Starfield: active. Companion: ready.',
  clear: '',
};

export function BashCompanion() {
  const [entries, setEntries] = useState<Entry[]>([
    { type: 'output', text: 'BASH v0.1.0 — Brain-Aware SHell. Type "help" for available commands.' },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const handleCommand = () => {
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;
    setEntries((prev) => [...prev, { type: 'input', text: `$ ${input}` }]);
    setInput('');

    if (cmd === 'clear') {
      setEntries([]);
      return;
    }

    const response = RESPONSES[cmd] || `Unknown command: "${input}". Type "help" for available commands.`;
    setTimeout(() => {
      setEntries((prev) => [...prev, { type: 'output', text: response }]);
    }, 150);
  };

  return (
    <GlassCard>
      <div style={{ padding: 16 }}>
        <div
          className="bash-prompt"
          style={{
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 10,
            padding: 12,
            maxHeight: 280,
            overflowY: 'auto',
            marginBottom: 12,
            minHeight: 120,
          }}
        >
          {entries.map((e, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              {e.type === 'input' ? (
                <span>
                  <span className="prompt-symbol" style={{ color: 'var(--p31-accent)' }}>$ </span>
                  <span style={{ color: 'white' }}>{e.text.slice(2)}</span>
                </span>
              ) : e.text ? (
                <span className="prompt-output">{e.text}</span>
              ) : null}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
            placeholder="$ type a command…"
            className="bash-input"
            style={{ flex: 1 }}
          />
          <GlowButton onClick={handleCommand} style={{ fontSize: 12, padding: '8px 14px' }}>
            Run
          </GlowButton>
        </div>
      </div>
    </GlassCard>
  );
}
