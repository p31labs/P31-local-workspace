import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';
import { useSpoon } from '../../../shared/hooks/useSpoon';

export function FocusSurface() {
  const { spoons } = useSpoon();
  const key = 'phos:focus';

  const [sec, setSec] = useState(25*60);
  const [run, setRun] = useState(false);
  useEffect(() => { if (!run) return; const t = setInterval(() => setSec(s => Math.max(0, s-1)), 1000); return () => clearInterval(t); }, [run]);
  const mm = String(Math.floor(sec/60)).padStart(2,'0'); const ss = String(sec%60).padStart(2,'0');
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="focusSurface" data-mcp-state={run ? 'running' : 'paused'}>
      <GlassCard className="p-6 text-center">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Focus</h1>
        <div className="text-6xl font-mono-tech text-ink my-6">{mm}:{ss}</div>
        <div className="flex gap-3 justify-center">
          <GlowButton color="cyan" onClick={() => setRun(r=>!r)} data-mcp-tool="toggleFocusTimer" data-mcp-type="action" data-mcp-state={run ? 'running' : 'paused'}>{run ? 'Pause' : 'Start'}</GlowButton>
          <GlowButton color="violet" variant="secondary" onClick={() => { setSec(25*60); setRun(false); }} data-mcp-tool="resetFocusTimer" data-mcp-type="action">Reset</GlowButton>
        </div>
      </GlassCard>
    </div>
  );
}
