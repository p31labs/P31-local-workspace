import { useState, useEffect, useRef } from 'react';

const COMMANDS: Record<string, string> = {
  help: `Available commands:
  andromeda status    — Health check (gateway, phos, p31ca)
  andromeda surfaces  — List PHOS surfaces (23 available)
  andromeda love status — LOVE ledger status
  andromeda deploy --app phos — Deploy to Cloudflare Pages
  andromeda deploy --app p31ca — Deploy p31ca
  andromeda love balance <userId> — LOVE balance for a user`,
  status: `✓ gateway.p31ca.org — operational
✓ phos.p31ca.org — operational
✓ p31ca.org — operational
✓ willow.p31ca.org — operational
✓ bonding.p31ca.org — operational`,
  'love status': `LOVE Ledger Status:
  Total LOVE: 1,247,392
  Care Score: 87/100
  Active Pilots: 18
  Pool Vesting: 2.4 years remaining`,
  deploy: `Deploying phos to Cloudflare Pages...
  ✓ Build complete (12.4s)
  ✓ Upload complete (2.1 MB)
  ✓ Deployment live: https://phos.p31ca.org`,
};

export default function TerminalDemo() {
  const [history, setHistory] = useState<Array<{ cmd: string; out: string }>>([]);
  const [input, setInput] = useState('');
  const [isReady, setIsReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      setHistory([{ cmd: 'andromeda help', out: COMMANDS['help'] }]);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;
    const out = COMMANDS[cmd] || `Command not found: ${cmd}\nType 'help' for available commands.`;
    setHistory((h) => [...h, { cmd: input.trim(), out }]);
    setInput('');
  };

  return (
    <div class="w-full max-w-3xl mx-auto">
      <div class="rounded-xl overflow-hidden" style="background: var(--p31-surface); border: 1px solid var(--p31-glass-border); box-shadow: var(--p31-glass-shadow);">
        <div class="flex items-center gap-2 px-4 py-3" style="background: var(--p31-surface2); border-bottom: 1px solid var(--p31-glass-border);">
          <div class="w-3 h-3 rounded-full" style="background: #ff5f57;"></div>
          <div class="w-3 h-3 rounded-full" style="background: #febc2e;"></div>
          <div class="w-3 h-3 rounded-full" style="background: #28c840;"></div>
          <span class="ml-2 text-xs font-mono" style="color: var(--p31-text-tertiary);">andromeda</span>
        </div>
        <div class="p-4 font-mono text-sm space-y-3" style="min-height: 320px; max-height: 400px; overflow-y: auto;">
          {history.map((entry, i) => (
            <div key={i}>
              <div class="flex items-center gap-2" style="color: var(--p31-accent);">
                <span>$</span>
                <span>{entry.cmd}</span>
              </div>
              <pre class="whitespace-pre-wrap mt-1" style="color: var(--p31-text-secondary); font-size: 12px; line-height: 1.6;">{entry.out}</pre>
            </div>
          ))}
          {isReady && (
            <form onSubmit={handleSubmit} class="flex items-center gap-2" style="color: var(--p31-accent);">
              <span>$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => inputRef.current?.scrollIntoView({ behavior: 'smooth' })}
                placeholder="Type 'help' to see commands..."
                class="flex-1 bg-transparent outline-none"
                style="color: var(--p31-text); caret-color: var(--p31-accent);"
                autocomplete="off"
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
