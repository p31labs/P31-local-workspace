/**
 * BONDING — Phenix Wallet Connect
 * Shows wallet connection status and provides connect/disconnect actions.
 * Calls phenix-wallet-mcp worker for wallet operations.
 */
import { useState, useEffect, useCallback } from 'react';

const WALLET_MCP = 'https://phenix-wallet-mcp.trimtab-signal.workers.dev';

interface WalletState {
  connected: boolean;
  sessionId?: string;
  did?: string;
  credentialCount?: number;
}

async function callMCP(method: string, params: Record<string, unknown>): Promise<any> {
  const resp = await fetch(WALLET_MCP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name: method, arguments: params } }),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (data.error) return null;
  try {
    const text = data.result?.content?.[0]?.text;
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export function WalletConnect() {
  const [state, setState] = useState<WalletState>({ connected: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('phenix_wallet_session');
    if (saved) {
      const s = JSON.parse(saved);
      setState(s);
      callMCP('wallet_status', { sessionId: s.sessionId }).then(r => {
        if (r && r.status === 'unlocked') {
          setState(prev => ({ ...prev, connected: true }));
        } else {
          localStorage.removeItem('phenix_wallet_session');
          setState({ connected: false });
        }
      });
    }
  }, []);

  const handleConnect = useCallback(async () => {
    setBusy(true);
    const result = await callMCP('wallet_create', { password: 'bonding-session', label: 'BONDING Game' });
    if (result && result.sessionId) {
      const newState = { connected: true, sessionId: result.sessionId, did: result.did };
      setState(newState);
      localStorage.setItem('phenix_wallet_session', JSON.stringify(newState));
    }
    setBusy(false);
  }, []);

  const handleDisconnect = useCallback(async () => {
    if (state.sessionId) {
      await callMCP('wallet_lock', { sessionId: state.sessionId });
    }
    localStorage.removeItem('phenix_wallet_session');
    setState({ connected: false });
  }, [state.sessionId]);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13,
    }}>
      <span style={{ fontSize: 16 }}>🐦</span>
      {state.connected ? (
        <>
          <span style={{ color: '#34D399', fontWeight: 600 }}>Wallet Connected</span>
          <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>
            {state.did?.slice(0, 20)}...
          </span>
          <button onClick={handleDisconnect} style={{
            background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.2)',
            color: '#f87171', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 11,
          }}>Disconnect</button>
        </>
      ) : (
        <button onClick={handleConnect} disabled={busy} style={{
          background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)',
          color: '#00F0FF', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
        }}>{busy ? 'Connecting...' : 'Connect Wallet'}</button>
      )}
    </div>
  );
}
