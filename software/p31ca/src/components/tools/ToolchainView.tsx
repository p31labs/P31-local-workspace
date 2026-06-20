import { useEffect, useRef, useState } from 'react';

export function ToolchainView({ maxAuraLines = 6, maxRouterLines = 8, maxSpoonBars = 5 }) {
  const panelRef = useRef<HTMLElement>(null);
  const [aura, setAura] = useState<string[]>([]);
  const [routerTail, setRouterTail] = useState<string[]>([]);
  const [spoonBars, setSpoonBars] = useState<Array<{ time: string; level: number; source: string }>>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAura() {
      try {
        const res = await fetch('/api/toolchain/aura-latest', { signal: AbortSignal.timeout(4000) });
        if (!res.ok) throw new Error(`aura ${res.status}`);
        const data = await res.json();
        if (!cancelled) setAura(Array.isArray(data.lines) ? data.lines.slice(0, maxAuraLines) : []);
      } catch {
        if (!cancelled) setError('aura unavailable');
      }
    }

    async function loadRouter() {
      try {
        const res = await fetch('/api/toolchain/router-tail', { signal: AbortSignal.timeout(4000) });
        if (!res.ok) throw new Error(`router ${res.status}`);
        const data = await res.json();
        if (!cancelled) setRouterTail(Array.isArray(data.events) ? data.events.slice(-maxRouterLines) : []);
      } catch {
        if (!cancelled) setError('router unavailable');
      }
    }

    async function loadSpoons() {
      try {
        const res = await fetch('/api/toolchain/spoon-state', { signal: AbortSignal.timeout(4000) });
        if (!res.ok) throw new Error(`spoons ${res.status}`);
        const data = await res.json();
        if (!cancelled) setSpoonBars(Array.isArray(data.bars) ? data.bars.slice(-maxSpoonBars) : []);
      } catch {
        if (!cancelled) setError('spoons unavailable');
      }
    }

    Promise.all([loadAura(), loadRouter(), loadSpoons()]).then(() => {
      if (!cancelled) setLoaded(true);
    });

    return () => { cancelled = true; };
  }, [maxAuraLines, maxRouterLines, maxSpoonBars]);

  return (
    <aside
      ref={panelRef}
      className="fixed bottom-4 right-4 z-40 w-72 max-h-[70vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/95 p-3 font-mono text-[10px] shadow-lg"
      aria-label="Toolchain telemetry"
    >
      <div className="flex items-center justify-between mb-2 border-b border-zinc-800 pb-1">
        <span className="text-zinc-400 uppercase tracking-widest">Toolchain</span>
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${loaded ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
      </div>

      {error && !loaded && (
        <p className="text-zinc-600 mb-2">Loading…</p>
      )}

      <section className="mb-3" aria-label="Quantum Aura report">
        <h3 className="text-zinc-500 uppercase tracking-wider mb-1">Aura</h3>
        <pre className="whitespace-pre-wrap text-zinc-400 leading-tight">
          {aura.length > 0 ? aura.join('\n') : '—'}
        </pre>
      </section>

      <section className="mb-3" aria-label="Router events">
        <h3 className="text-zinc-500 uppercase tracking-wider mb-1">Router</h3>
        <ul className="space-y-0.5">
          {routerTail.length > 0
            ? routerTail.map((e, i) => <li key={i} className="text-zinc-500 truncate">{e}</li>)
            : <li className="text-zinc-600">—</li>}
        </ul>
      </section>

      <section aria-label="Spoon state">
        <h3 className="text-zinc-500 uppercase tracking-wider mb-1">Spoons</h3>
        <div className="space-y-1">
          {spoonBars.length > 0
            ? spoonBars.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-zinc-600 w-14 shrink-0">{b.time.slice(0, 5)}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(b.level / 12) * 100}%`,
                        background: b.level <= 1 ? '#cc6247' : b.level <= 3 ? '#cda852' : '#4db8a8',
                      }}
                    />
                  </div>
                  <span className="text-zinc-400 w-8 text-right">{b.level}</span>
                </div>
              ))
            : <div className="text-zinc-600">—</div>}
        </div>
      </section>
    </aside>
  );
}

export default ToolchainView;
