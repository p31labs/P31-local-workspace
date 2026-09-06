import { useState, useEffect, useRef } from 'react';

const ROBLOX_BRIDGE = 'https://roblox-bridge.trimtab-signal.workers.dev';

export function GeneratePanel() {
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [deployUrl, setDeployUrl] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempDeploy, setTempDeploy] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');
  const [claimed, setClaimed] = useState(false);
  const [robloxUrl, setRobloxUrl] = useState('');
  const [deployingRoblox, setDeployingRoblox] = useState(false);
  const [robloxError, setRobloxError] = useState('');
  const [worlds, setWorlds] = useState<Array<{id: string; name: string}>>([]);
  const [selectedWorldId, setSelectedWorldId] = useState('');
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${ROBLOX_BRIDGE}/worlds`).then(r => r.json()).then(setWorlds).catch(() => {});
  }, []);

  useEffect(() => {
    if (!expiresAt) { setCountdown(''); return; }
    countdownRef.current = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      const m = Math.floor(left / 60);
      const s = left % 60;
      setCountdown(`${m}:${s.toString().padStart(2, '0')}`);
      if (left <= 0) { clearInterval(countdownRef.current ?? undefined); setCountdown('Expired'); setTempDeploy(false); }
    }, 1000);
    return () => clearInterval(countdownRef.current ?? undefined);
  }, [expiresAt]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setOutput('');
    setDeployUrl('');
    setTempDeploy(false);
    setExpiresAt(null);
    setClaimed(false);
    try {
      const res = await fetch('https://phos.p31ca.org/api/vibe/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const html = data.html || data.output || JSON.stringify(data, null, 2);
      setOutput(html);
    } catch (e: any) {
      setError(e.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const deploy = async (temporary: boolean) => {
    if (!output) return;
    setDeploying(true);
    setError('');
    try {
      const name = prompt.trim().slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-') || 'generated-app';
      const endpoint = temporary
        ? 'https://api.cloudflare.com/client/v4/accounts/p31-workers/workers/dynamic'
        : 'https://app-supervisor.trimtab-signal.workers.dev/apps/create';
      const body = temporary
        ? JSON.stringify({ name, code: output, compatibility_date: '2026-07-18', ttl: 3600 })
        : JSON.stringify({ name, html: output, css: '', js: '', creator: 'vibe-generate' });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const url = temporary
        ? (data.result?.url || `https://${name}.tmp.workers.dev`)
        : `https://app-supervisor.trimtab-signal.workers.dev/apps/${data.id}`;
      setDeployUrl(url);
      setTempDeploy(temporary);
      if (temporary) setExpiresAt(Date.now() + 3600_000);
      if (!localStorage.getItem('first_deploy')) {
        localStorage.setItem('first_deploy', Date.now().toString());
      }
    } catch (e: any) {
      setError(`Deploy failed: ${e.message}`);
    } finally {
      setDeploying(false);
    }
  };

  const deployToRoblox = async () => {
    if (!output) return;
    setDeployingRoblox(true);
    setRobloxError('');
    setRobloxUrl('');
    try {
      const worldName = prompt.trim().slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-') || 'generated-world';
      const res = await fetch(`${ROBLOX_BRIDGE}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: output, worldName, worldId: selectedWorldId || undefined }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRobloxUrl(data.roblox_url || `https://www.roblox.com/games/?worldName=${encodeURIComponent(worldName)}`);
    } catch (e: any) {
      setRobloxError(`Roblox deploy failed: ${e.message}`);
    } finally {
      setDeployingRoblox(false);
    }
  };

  const claim = async () => {
    if (!deployUrl) return;
    try {
      const name = prompt.trim().slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-') || 'generated-app';
      const res = await fetch('https://app-supervisor.trimtab-signal.workers.dev/apps/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, html: output, css: '', js: '', creator: 'vibe-claim' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDeployUrl(`https://app-supervisor.trimtab-signal.workers.dev/apps/${data.id}`);
      setTempDeploy(false);
      setExpiresAt(null);
      setClaimed(true);
    } catch (e: any) {
      setError(`Claim failed: ${e.message}`);
    }
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div data-mcp-tool="generatePanel" data-mcp-state={loading ? 'loading' : output ? 'ready' : 'idle'} style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
      <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Vibe Generate</div>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        data-mcp-tool="generatePrompt"
        data-mcp-type="input"
        data-mcp-target="generate-prompt"
        placeholder="Describe the app or page you want to build..."
        rows={3}
        style={{
          padding: '8px 10px', borderRadius: 6,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#f0f2f5', fontSize: 11, outline: 'none', resize: 'vertical',
          fontFamily: 'inherit',
        }}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); } }}
      />
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={generate}
          disabled={loading || !prompt.trim()}
          data-mcp-tool="generateWorld"
          data-mcp-type="action"
          data-mcp-target="generate-button"
          style={{
            flex: 1, padding: '8px 0', borderRadius: 6,
            border: '1px solid rgba(0,240,255,0.3)', background: loading ? 'rgba(0,240,255,0.05)' : 'rgba(0,240,255,0.1)',
            color: loading ? 'rgba(0,240,255,0.4)' : '#00f0ff', fontSize: 11, cursor: loading ? 'default' : 'pointer',
            fontWeight: 600, opacity: prompt.trim() ? 1 : 0.4,
          }}
        >
          {loading ? 'Generating...' : '✨ Generate'}
        </button>
      </div>
      {error && (
        <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)', color: '#fb7185', fontSize: 10 }}>{error}</div>
      )}
      {output && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Output</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {worlds.length > 0 && (
                <select value={selectedWorldId} onChange={e => setSelectedWorldId(e.target.value)} data-mcp-tool="selectWorld" data-mcp-type="input" data-mcp-target="world-select" style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: 'rgba(240,242,245,0.6)', fontSize: 9, fontFamily: 'inherit', maxWidth: 100 }}>
                  <option value="">New World</option>
                  {worlds.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              )}
              <button onClick={() => copy(output)} data-mcp-tool="copyOutput" data-mcp-type="action" data-mcp-target="copy-button" style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(52,211,153,0.2)', background: 'transparent', color: 'rgba(52,211,153,0.6)', fontSize: 9, cursor: 'pointer' }}>
                Copy
              </button>
              <button onClick={() => deploy(true)} disabled={deploying} data-mcp-tool="deployOutput" data-mcp-type="action" data-mcp-target="deploy-button" style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(251,191,36,0.3)', background: deploying ? 'rgba(251,191,36,0.05)' : 'transparent', color: deploying ? 'rgba(251,191,36,0.4)' : '#fbbf24', fontSize: 9, cursor: deploying ? 'default' : 'pointer', fontWeight: 600 }}>
                {deploying ? 'Deploying...' : '⚡ Temp Deploy (60m)'}
              </button>
              <button onClick={() => deploy(false)} disabled={deploying} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(52,211,153,0.3)', background: deploying ? 'rgba(52,211,153,0.05)' : 'transparent', color: deploying ? 'rgba(52,211,153,0.4)' : '#34d399', fontSize: 9, cursor: deploying ? 'default' : 'pointer', fontWeight: 600 }}>
                {deploying ? 'Deploying...' : '🚀 Permanent'}
              </button>
              <button onClick={deployToRoblox} disabled={deployingRoblox} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(139,92,246,0.3)', background: deployingRoblox ? 'rgba(139,92,246,0.05)' : 'transparent', color: deployingRoblox ? 'rgba(139,92,246,0.4)' : '#8b5cf6', fontSize: 9, cursor: deployingRoblox ? 'default' : 'pointer', fontWeight: 600 }}>
                {deployingRoblox ? 'Deploying...' : '🎮 Roblox'}
              </button>
            </div>
          </div>
          <pre style={{
            padding: '8px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
            color: '#34d399', fontSize: 10, fontFamily: 'var(--p31-font-mono, monospace)',
            maxHeight: 150, overflow: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {output}
          </pre>
          {robloxError && (
            <div style={{ padding: '6px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#c4b5fd', fontSize: 9 }}>{robloxError}</div>
          )}
          {robloxUrl && (
            <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', textTransform: 'uppercase' }}>ROBLOX DEPLOY</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <a href={robloxUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 10, color: '#8b5cf6', fontFamily: 'var(--p31-font-mono, monospace)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {robloxUrl}
                </a>
                <button onClick={() => navigator.clipboard.writeText(robloxUrl)} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(139,92,246,0.2)', background: 'transparent', color: 'rgba(139,92,246,0.5)', fontSize: 9, cursor: 'pointer', flexShrink: 0 }}>
                  Copy
                </button>
              </div>
            </div>
          )}
          {deployUrl && (
            <div style={{ padding: '8px 10px', borderRadius: 6, background: tempDeploy ? 'rgba(251,191,36,0.06)' : 'rgba(0,240,255,0.06)', border: `1px solid ${tempDeploy ? 'rgba(251,191,36,0.15)' : 'rgba(0,240,255,0.15)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', textTransform: 'uppercase' }}>
                  {tempDeploy ? 'TEMP PREVIEW' : 'LIVE PREVIEW'}
                </span>
                {tempDeploy && countdown && (
                  <span style={{ fontSize: 9, color: '#fbbf24', fontFamily: 'var(--p31-font-mono, monospace)' }}>
                    expires {countdown}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <a href={deployUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 10, color: '#00f0ff', fontFamily: 'var(--p31-font-mono, monospace)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {deployUrl}
                </a>
                <button onClick={() => copy(deployUrl)} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(0,240,255,0.2)', background: 'transparent', color: 'rgba(0,240,255,0.5)', fontSize: 9, cursor: 'pointer', flexShrink: 0 }}>
                  Copy
                </button>
                {tempDeploy && !claimed && (
                  <button onClick={claim} style={{ padding: '2px 8px', borderRadius: 3, border: '1px solid rgba(52,211,153,0.3)', background: 'transparent', color: '#34d399', fontSize: 9, cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
                    📌 Claim
                  </button>
                )}
                {claimed && (
                  <span style={{ fontSize: 9, color: '#34d399', fontWeight: 600, flexShrink: 0 }}>✓ Claimed</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GeneratePanel;
