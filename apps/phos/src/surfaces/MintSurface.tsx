import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { identityStore } from '../store/identity';
import { loadPrivateKey } from '../store/identity';
import { signMessage, signMlDsa65 } from '../lib/crypto';
import { loadPqcKeys } from './PQCKeygenSurface';

// CWP-2026-025 sovereign mint surface. Signs care telemetry with the user's
// Ed25519 DID key and relays it to ledger-bridge, which verifies the DID↔ETH
// binding and mints a ProofOfCare SBT. Telemetry fields are 1e18-scaled and
// sent as STRINGS (they exceed Number.MAX_SAFE_INTEGER).
const LEDGER = 'https://love-ledger.p31ca.org';
const BRIDGE = 'https://ledger-bridge.trimtab-signal.workers.dev';
const EXPLORER = 'https://sepolia.basescan.org/tx/';

function scale1e18(v: number): string {
  return Math.round(v * 1e18).toString();
}

function randomEntropyRoot(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return '0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const MintSurface: React.FC<{ spoons?: number }> = ({ spoons = 3 }) => {
  const identity = useSyncExternalStore(
    (cb) => identityStore.subscribe(cb),
    () => identityStore.get(),
    () => ({ did: '', displayName: '', publicKey: '', isRegistered: 'false', joinedAt: '', keysGenerated: 'false' }),
  );
  const [eth, setEth] = useState('');
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [prox, setProx] = useState(0.6);
  const [qres, setQres] = useState(0.6);
  const [tasks, setTasks] = useState(1);
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [receipt, setReceipt] = useState<{ txHash: string; did: string; ethAddress: string } | null>(null);
  const [pqEnabled, setPqEnabled] = useState(false);
  const [pqPass, setPqPass] = useState('');

  const simple = spoons <= 2;

  useEffect(() => {
    if (!identity.did || !eth) return;
    (async () => {
      try {
        const r = await fetch(`${LEDGER}/identity/lookup?did=${encodeURIComponent(identity.did)}`);
        if (r.ok) {
          const row = await r.json();
          setRegistered(row.eth_address?.toLowerCase() === eth.toLowerCase());
        } else {
          setRegistered(false);
        }
      } catch {
        setRegistered(false);
      }
    })();
  }, [identity.did, eth]);

  const register = async (mldsa65Pub = ''): Promise<boolean> => {
    setStatus('working');
    setMsg('Registering DID…');
    try {
      const key = await loadPrivateKey();
      if (!key) throw new Error('No signing key — create your Passport first.');
      if (!/^0x[0-9a-fA-F]{40}$/.test(eth)) throw new Error('Enter a valid Ethereum address.');
      const message = `${identity.did}|${identity.publicKey}||${eth}`;
      const signature = await signMessage(message, key);
      const r = await fetch(`${LEDGER}/identity/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did: identity.did, ed25519_pub: identity.publicKey, mldsa65_pub: mldsa65Pub, eth_address: eth, signature }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || 'registration failed');
      setRegistered(true);
      setMsg('DID registered. Ready to mint.');
      setStatus('idle');
      return true;
    } catch (e: any) {
      setStatus('error');
      setMsg(e?.message || String(e));
      return false;
    }
  };

  const mint = async () => {
    setStatus('working');
    setMsg('Signing care proof…');
    setReceipt(null);
    try {
      const key = await loadPrivateKey();
      if (!key) throw new Error('No signing key — create your Passport first.');
      if (!/^0x[0-9a-fA-F]{40}$/.test(eth)) throw new Error('Enter a valid Ethereum address.');
      let isReg = registered === true;
      if (!isReg) {
        isReg = await register();
        if (!isReg) throw new Error('Register your DID before minting.');
      }
      const users = [eth];
      const tProx = [scale1e18(prox)];
      const qRes = [scale1e18(qres)];
      const taskArr = [String(tasks)];
      const entropyRoots = [randomEntropyRoot()];
      const message = `proof|${identity.did}|${users.join(',')}|${tProx.join(',')}|${qRes.join(',')}|${taskArr.join(',')}|${entropyRoots.join(',')}`;
      const signature = await signMessage(message, key);

      // CWP-2026-027 A-5 — optional post-quantum (ML-DSA-65) co-signature.
      let mldsa65Sig: string | undefined;
      let mldsa65Pub = '';
      if (pqEnabled) {
        if (!pqPass) throw new Error('Enter your PQC vault passphrase to add the ML-DSA-65 signature.');
        const pq = await loadPqcKeys(pqPass);
        if (!pq?.dsa65SecretKey) {
          throw new Error('ML-DSA-65 key not found — open PQC Keys, generate keys, and unlock with your passphrase.');
        }
        mldsa65Sig = signMlDsa65(message, pq.dsa65SecretKey);
        mldsa65Pub = pq.dsa65PublicKey || '';
      }

      const reqBody: Record<string, unknown> = {
        did: identity.did, signature, users, tProx, qRes, tasks: taskArr, entropyRoots,
      };
      if (mldsa65Sig) reqBody.mldsa65_sig = mldsa65Sig;

      // Ensure the ledger has this DID's ML-DSA-65 public key before the
      // bridge verifies the co-signature (register upserts mldsa65_pub).
      if (pqEnabled && mldsa65Pub) {
        isReg = await register(mldsa65Pub);
        if (!isReg) throw new Error('Register your DID before minting.');
      } else if (!isReg) {
        isReg = await register();
        if (!isReg) throw new Error('Register your DID before minting.');
      }

      setMsg('Relaying to Base Sepolia…');
      const r = await fetch(`${BRIDGE}/care-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      const res = await r.json();
      if (!r.ok || !res.ok) throw new Error(res.error || res.note || 'mint failed');
      setReceipt({ txHash: res.txHash, did: res.did, ethAddress: res.ethAddress });
      setMsg('Care SBT attested on-chain.');
      setStatus('done');
    } catch (e: any) {
      setStatus('error');
      setMsg(e?.message || String(e));
    }
  };

  if (!identity.did) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 space-y-3 text-center">
        <span className="text-3xl">🌱</span>
        <h2 className="text-lg font-light tracking-wide text-[#E8E8EC]">No Identity Yet</h2>
        <p className="text-xs text-white/40 font-light max-w-xs">
          Create your Cognitive Passport first — it holds the Ed25519 key that signs your care proofs.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-light tracking-wide text-[#E8E8EC]">Care SBT Mint</h2>
          <p className="text-[10px] font-mono text-white/30 mt-0.5">{identity.did.slice(0, 46)}…</p>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full ${registered ? 'phos-glass text-white/70' : 'phos-glass text-white/40'}`}>
          {registered ? 'DID bound' : 'unbound'}
        </span>
      </div>

      <div className="rounded-2xl phos-glass border border-white/5 p-5 space-y-3">
        <h3 className="text-xs font-mono text-white/70 uppercase tracking-widest">Sovereign Binding</h3>
        <label className="text-xs text-white/40 font-light block">Ethereum address (receives your Care SBT)</label>
        <input
          value={eth}
          onChange={(e) => setEth(e.target.value.trim())}
          placeholder="0x…"
          aria-label="Ethereum address that receives your Care SBT"
          className={`w-full rounded-xl phos-glass border px-4 py-3 text-sm text-white/80 outline-none font-mono ${status === 'error' && /address/i.test(msg) ? 'border-red-400/40' : 'border-white/10'}`}
        />
        <p className="text-[10px] text-white/30 font-light leading-relaxed">
          This is the wallet that receives your Care SBT. P31 never holds your keys or funds — fully self-custodial. Use any EVM address you control (e.g. a hardware wallet or a watch-only address).
        </p>
        <button
          onClick={() => register()}
          disabled={status === 'working' || registered === true}
          className="min-h-[48px] w-full rounded-xl phos-glass border border-white/10 px-4 py-2.5 text-xs font-light text-white/60 hover:text-white/80 transition-all disabled:opacity-40"
        >
          {registered ? 'DID Registered' : 'Register DID → love-ledger'}
        </button>
      </div>

      {!simple && (
        <div className="rounded-2xl phos-glass border border-white/5 p-5 space-y-4">
          <h3 className="text-xs font-mono text-white/70 uppercase tracking-widest">Care Telemetry</h3>
          <div className="space-y-2">
            <label className="text-xs text-white/40 font-light block">Proximity (tProx): {prox.toFixed(2)}</label>
            <input type="range" min="0" max="1" step="0.01" value={prox} onChange={(e) => setProx(parseFloat(e.target.value))} className="w-full" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/40 font-light block">Resonance (qRes): {qres.toFixed(2)}</label>
            <input type="range" min="0" max="1" step="0.01" value={qres} onChange={(e) => setQres(parseFloat(e.target.value))} className="w-full" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/40 font-light block">Tasks completed</label>
            <input type="number" min="0" value={tasks} onChange={(e) => setTasks(parseInt(e.target.value) || 0)} className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none" />
          </div>
        </div>
      )}

      <div className="rounded-2xl phos-glass border border-white/5 p-5 space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-mono text-white/70 uppercase tracking-widest">Post-Quantum Co-Signature</span>
          <input
            type="checkbox"
            checked={pqEnabled}
            onChange={(e) => setPqEnabled(e.target.checked)}
            aria-label="Enable ML-DSA-65 post-quantum signature on this care proof"
            className="w-5 h-5 accent-[#22d3ee]"
          />
        </label>
        <p className="text-[10px] text-white/30 font-light leading-relaxed">
          Adds an ML-DSA-65 (NIST FIPS 204) signature to your care proof — quantum-resistant. Requires PQC keys from the PQC Keys surface and your vault passphrase.
        </p>
        {pqEnabled && (
          <input
            type="password"
            value={pqPass}
            onChange={(e) => setPqPass(e.target.value)}
            placeholder="PQC vault passphrase"
            aria-label="PQC vault passphrase"
            className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none font-mono"
          />
        )}
      </div>

      <button
        onClick={mint}
        disabled={status === 'working'}
        className="min-h-[52px] w-full rounded-2xl phos-glass border border-quantum-cyan/30 px-4 py-3 text-sm font-light text-white/80 hover:phos-glass transition-all disabled:opacity-40"
      >
        {status === 'working' ? 'Working…' : 'Mint Care SBT'}
      </button>

      {msg && (
        <div className={`rounded-xl phos-glass border border-white/10 px-4 py-2 text-xs font-light text-center ${status === 'error' ? 'text-red-300/80' : 'text-white/60'}`}>
          {msg}
        </div>
      )}

      {receipt && (
        <div className="rounded-2xl phos-glass border border-emerald-500/30 p-5 space-y-3 animate-[fadeIn_0.4s_ease-out]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm">✓</span>
            <h3 className="text-xs font-mono text-emerald-300/80 uppercase tracking-widest">Care SBT Attested</h3>
          </div>
          <a href={EXPLORER + receipt.txHash} target="_blank" rel="noreferrer" className="text-xs text-quantum-cyan font-mono break-all hover:underline">
            {receipt.txHash}
          </a>
          <p className="text-[10px] text-white/40 font-light">View on Base Sepolia explorer ↗</p>
        </div>
      )}
    </div>
  );
};

export default MintSurface;
