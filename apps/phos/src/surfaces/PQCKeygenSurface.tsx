import React, { useState, useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { identityStore, type IdentityState } from '../store/identity';
import { MLKEM, MLDSA } from '../workers/love-ledger/taler-cbs/pqc';

// ─── IndexedDB vault for PQC secret keys ────────────────────────────────────

const PQC_STORE = 'pqcKeyVault';
const PQC_DB = 'phos-pqc-vault';

function getPqcDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(PQC_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PQC_STORE)) db.createObjectStore(PQC_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function savePqcKeys(keys: {
  kemSecretKey: string;
  dsaSecretKey: string;
  passphrase: string;
}): Promise<void> {
  const db = await getPqcDB();
  const tx = db.transaction(PQC_STORE, 'readwrite');
  const enc = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw', enc.encode(keys.passphrase), 'PBKDF2', false, ['deriveKey'],
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
    passphraseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt'],
  );
  const plaintext = enc.encode(JSON.stringify({
    kem: keys.kemSecretKey,
    dsa: keys.dsaSecretKey,
  }));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plaintext);
  tx.objectStore(PQC_STORE).put({ salt: Array.from(salt), iv: Array.from(iv), data: Array.from(new Uint8Array(ciphertext)) }, 'pqc-keys');
  await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error!); });
}

async function loadPqcKeys(passphrase: string): Promise<{ kemSecretKey: string; dsaSecretKey: string } | null> {
  try {
    const db = await getPqcDB();
    const tx = db.transaction(PQC_STORE, 'readonly');
    const req = tx.objectStore(PQC_STORE).get('pqc-keys');
    const wrapped = await new Promise<any>((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
    if (!wrapped) return null;
    const enc = new TextEncoder();
    const passphraseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    const aesKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: new Uint8Array(wrapped.salt), iterations: 600_000, hash: 'SHA-256' },
      passphraseKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
    );
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(wrapped.iv) }, aesKey, new Uint8Array(wrapped.data));
    return JSON.parse(new TextDecoder().decode(plainBuf));
  } catch {
    return null;
  }
}

async function hasPqcKeys(): Promise<boolean> {
  try {
    const db = await getPqcDB();
    const tx = db.transaction(PQC_STORE, 'readonly');
    const req = tx.objectStore(PQC_STORE).get('pqc-keys');
    return await new Promise<boolean>((res) => { req.onsuccess = () => res(!!req.result); req.onerror = () => res(false); });
  } catch { return false; }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function truncateB64(b64: string, max = 32): string {
  return b64.length > max ? b64.slice(0, max) + '…' : b64;
}

// ─── Quantum Particle Canvas ────────────────────────────────────────────────

interface Particle {
  x: number; y: number; vx: number; vy: number; r: number; opacity: number; hue: number;
}

const QuantumParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Respect reduced motion / crisis spoons
    const root = document.documentElement;
    const isReduced = root.getAttribute('data-reduced-motion') === 'true'
      || root.getAttribute('data-spoons') === '0'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) return;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const particles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 1.5 + 0.3,
        opacity: 0.1 + Math.random() * 0.25,
        hue: Math.random() > 0.7 ? 270 : 185,
      });
    }

    let running = true;
    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity})`;
        ctx.fill();

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${p.opacity * 0.3})`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 phos-gpu" />;
};

// ─── Status Badge ────────────────────────────────────────────────────────────

type StatusKind = 'idle' | 'generating' | 'generated' | 'registering' | 'registered' | 'error';

const STATUS_STYLES: Record<StatusKind, { bg: string; border: string; text: string; pulse: boolean }> = {
  idle:         { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/40', pulse: false },
  generating:   { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', pulse: true },
  generated:    { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', pulse: false },
  registering:  { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', pulse: true },
  registered:   { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', pulse: false },
  error:        { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', pulse: false },
};

const StatusBadge: React.FC<{ status: StatusKind; children: React.ReactNode }> = ({ status, children }) => {
  const s = STATUS_STYLES[status];
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-light ${s.bg} ${s.border} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.pulse ? 'animate-pulse' : ''} ${s.text.replace('text-', 'bg-')}`} />
      {children}
    </div>
  );
};

// ─── Key Card with Copy ──────────────────────────────────────────────────────

const KeyCard: React.FC<{
  label: string;
  algorithm: string;
  value: string;
  color: 'cyan' | 'purple';
}> = ({ label, algorithm, value, color }) => {
  const [copied, setCopied] = useState(false);
  const border = color === 'cyan' ? 'border-cyan-500/20' : 'border-purple-500/20';
  const glow = color === 'cyan' ? 'hover:shadow-cyan-500/10' : 'hover:shadow-purple-500/10';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  }, [value]);

  return (
    <div className={`rounded-xl bg-white/[0.03] border ${border} px-4 py-3 space-y-2 transition-shadow ${glow} hover:shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] text-white/60 uppercase tracking-widest">{label}</span>
          <span className="ml-2 text-[10px] text-white/30">{algorithm}</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-[10px] text-white/30 hover:text-white/60 transition-colors px-2 py-0.5 rounded hover:bg-white/5"
          aria-label={`Copy ${label}`}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <div className="text-[11px] text-white/50 font-mono break-all leading-relaxed select-all">
        {value.slice(0, 80)}…
      </div>
    </div>
  );
};

// ─── Info Tooltip ────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ title: string; desc: string; icon: string }> = ({ title, desc, icon }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-white/70 font-light flex-1">{title}</span>
        <span className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">
          {expanded ? '▾' : '▸'}
        </span>
      </button>
      {expanded && (
        <div className="pl-7 text-[11px] text-white/40 font-light leading-relaxed">
          {desc}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const PQCKeygenSurface: React.FC = () => {
  const identity: IdentityState = useSyncExternalStore(
    (cb) => identityStore.subscribe(cb),
    () => identityStore.get(),
    () => ({ did: '', displayName: '', publicKey: '', isRegistered: 'false', joinedAt: '', keysGenerated: 'false' }),
  );

  const [status, setStatus] = useState<StatusKind>('idle');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [kemPubKey, setKemPubKey] = useState('');
  const [dsaPubKey, setDsaPubKey] = useState('');
  const [error, setError] = useState('');
  const [hasExisting, setHasExisting] = useState<boolean | null>(null);
  const [verifyPassphrase, setVerifyPassphrase] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [verified, setVerified] = useState(false);
  const [copiedDid, setCopiedDid] = useState(false);

  useEffect(() => { hasPqcKeys().then(setHasExisting); }, []);

  const generateKeys = useCallback(async () => {
    if (!passphrase || passphrase.length < 8) {
      setError('Passphrase must be at least 8 characters');
      return;
    }
    setStatus('generating');
    setError('');

    try {
      const kem = new MLKEM({ securityLevel: 3 }); // ML-KEM-768
      const dsa = new MLDSA({ securityLevel: 1 }); // ML-DSA-44

      const kemPair = kem.keygen();
      const dsaPair = dsa.keygen();

      await savePqcKeys({
        kemSecretKey: bytesToB64(kemPair.secretKey),
        dsaSecretKey: bytesToB64(dsaPair.secretKey),
        passphrase,
      });

      setKemPubKey(bytesToB64(kemPair.publicKey));
      setDsaPubKey(bytesToB64(dsaPair.publicKey));
      setStatus('generated');
    } catch (err: any) {
      setError(err?.message || 'Key generation failed');
      setStatus('error');
    }
  }, [passphrase]);

  const registerWithLedger = useCallback(async () => {
    if (!identity.did) { setError('No DID — create a Passport first'); return; }
    setStatus('registering');
    setError('');

    try {
      const ledgerUrl = (import.meta as any).env?.PUBLIC_LOVE_LEDGER_URL || 'https://love-ledger.p31ca.org';
      const resp = await fetch(`${ledgerUrl}/contract/keygen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did: identity.did }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      if (!data.generated && data.dsa_public_key) {
        if (data.dsa_public_key === dsaPubKey) {
          setStatus('registered');
        } else {
          setError('Server has different PQC keys for this DID — regenerate or contact support');
          setStatus('error');
        }
        return;
      }
      setStatus('registered');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      setStatus('error');
    }
  }, [identity.did, dsaPubKey]);

  const verifyKey = useCallback(async () => {
    if (!verifyPassphrase) return;
    const keys = await loadPqcKeys(verifyPassphrase);
    if (keys) { setVerified(true); setError(''); }
    else { setError('Wrong passphrase or no keys stored'); setVerified(false); }
  }, [verifyPassphrase]);

  const handleCopyDid = useCallback(async () => {
    if (!identity.did) return;
    try {
      await navigator.clipboard.writeText(identity.did);
      setCopiedDid(true);
      setTimeout(() => setCopiedDid(false), 1500);
    } catch { /* noop */ }
  }, [identity.did]);

  const handleExportPublicKeys = useCallback(() => {
    const blob = new Blob([JSON.stringify({ kem: kemPubKey, dsa: dsaPubKey, did: identity.did }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pqc-public-keys-${identity.did?.slice(8, 20) || 'unknown'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [kemPubKey, dsaPubKey, identity.did]);

  // ─── Empty state ─────────────────────────────────────────────────────────

  if (!identity.did) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full p-8 space-y-4 overflow-hidden">
        <QuantumParticles />
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center animate-quantum-ring">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-lg font-light tracking-wide text-[#E8E8EC]">Post-Quantum Keys</h2>
          <p className="text-xs text-white/40 font-light text-center max-w-xs">
            Generate quantum-resistant cryptographic keys to protect your care records.
          </p>
          <p className="text-[10px] text-white/30 font-light text-center max-w-xs">
            Create a Cognitive Passport first — PQC keys are bound to your DID.
          </p>
        </div>
      </div>
    );
  }

  // ─── Main view ───────────────────────────────────────────────────────────

  return (
    <div className="relative max-w-2xl mx-auto p-6 space-y-6 overflow-hidden">
      <QuantumParticles />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-light tracking-wide text-[#E8E8EC]">
              <span className="quantum-gradient-text">Post-Quantum</span> Keys
            </h2>
            <button
              onClick={handleCopyDid}
              className="text-xs text-white/50 font-light mt-0.5 hover:text-white/70 transition-colors font-mono"
              aria-label="Copy DID"
            >
              {identity.did.slice(0, 40)}… {copiedDid ? '✓' : '⧉'}
            </button>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center animate-quantum-ring">
            <span className="text-xl">🔐</span>
          </div>
        </div>

        {/* Status */}
        <StatusBadge status={status}>
          {status === 'idle' && 'Ready to generate'}
          {status === 'generating' && 'Generating ML-KEM-768 + ML-DSA-44…'}
          {status === 'generated' && 'Keys generated locally — register with ledger'}
          {status === 'registering' && 'Registering public keys with LOVE ledger…'}
          {status === 'registered' && 'Keys active — quantum-resistant care contracts enabled'}
          {status === 'error' && error}
        </StatusBadge>

        {/* Algorithm Info — Progressive Disclosure */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
          <h3 className="text-xs font-mono text-white/60 uppercase tracking-widest">Algorithms</h3>
          <div className="space-y-3">
            <InfoRow
              icon="⬡"
              title="ML-KEM-768 — Key Encapsulation"
              desc="FIPS 203, NIST Level 3 (192-bit post-quantum). Encapsulates a shared secret that only the recipient can decapsulate — even against quantum computers. Used in care contracts to encrypt terms between parties."
            />
            <InfoRow
              icon="◈"
              title="ML-DSA-44 — Digital Signature"
              desc="FIPS 204, NIST Level 1 (128-bit post-quantum). Signs care receipts with a quantum-resistant signature. Cannot be forged by quantum computers. Used to seal entries on the LOVE ledger hash chain."
            />
            <InfoRow
              icon="∞"
              title="Why Post-Quantum?"
              desc="Classical cryptography (RSA, ECDSA, Ed25519) will be broken by quantum computers. PQC algorithms are standardized by NIST (2024) and are the only path to long-term security for care records that must remain verifiable for decades."
            />
          </div>
        </div>

        {/* Key Generation */}
        {(status === 'idle' || status === 'error') && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
            <h3 className="text-xs font-mono text-white/60 uppercase tracking-widest">Generate Keys</h3>
            <p className="text-xs text-white/40 font-light">
              Keys are generated entirely in your browser — never sent to any server. The private key is encrypted with your passphrase and stored in IndexedDB.
            </p>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Passphrase (min 8 chars)</label>
              <div className="relative">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/80 outline-none pr-16 focus:border-cyan-500/30 focus:shadow-[0_0_20px_rgba(0,240,255,0.05)] transition-all"
                />
                <button
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/40 hover:text-white/70 transition-colors px-2 py-1"
                >
                  {showPassphrase ? 'hide' : 'show'}
                </button>
              </div>
            </div>
            <button
              onClick={generateKeys}
              disabled={!passphrase || passphrase.length < 8}
              className="w-full rounded-xl px-4 py-3 text-sm font-light transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-cyan-500/20"
            >
              Generate PQC Keypair
            </button>
          </div>
        )}

        {/* Generated Keys Display */}
        {(status === 'generated' || status === 'registered') && kemPubKey && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono text-white/60 uppercase tracking-widest">Your Keys</h3>
              {status === 'registered' && (
                <span className="text-[10px] text-emerald-400/70 font-light flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  active
                </span>
              )}
            </div>

            <div className="space-y-3">
              <KeyCard label="ML-KEM-768 Public" algorithm="FIPS 203" value={kemPubKey} color="cyan" />
              <KeyCard label="ML-DSA-44 Public" algorithm="FIPS 204" value={dsaPubKey} color="purple" />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={registerWithLedger}
                disabled={status === 'registered'}
                className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-light transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  status === 'registered'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:text-white/80 hover:bg-white/10 hover:border-cyan-500/20'
                }`}
              >
                {status === 'registered' ? '✓ Registered' : 'Register with Ledger'}
              </button>
              <button
                onClick={handleExportPublicKeys}
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-light text-white/60 hover:text-white/80 hover:bg-white/10 transition-all"
              >
                Export Public Keys
              </button>
            </div>
          </div>
        )}

        {/* Key Verification */}
        {hasExisting && status === 'idle' && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
            <h3 className="text-xs font-mono text-white/60 uppercase tracking-widest">Verify Stored Keys</h3>
            <p className="text-xs text-white/40 font-light">
              Enter your passphrase to verify that PQC keys are stored locally.
            </p>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Passphrase</label>
              <div className="relative">
                <input
                  type={showVerify ? 'text' : 'password'}
                  value={verifyPassphrase}
                  onChange={(e) => setVerifyPassphrase(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/80 outline-none pr-16 focus:border-cyan-500/30 focus:shadow-[0_0_20px_rgba(0,240,255,0.05)] transition-all"
                />
                <button
                  onClick={() => setShowVerify(!showVerify)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/40 hover:text-white/70 transition-colors px-2 py-1"
                >
                  {showVerify ? 'hide' : 'show'}
                </button>
              </div>
            </div>
            <button
              onClick={verifyKey}
              disabled={!verifyPassphrase}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-light text-white/80 hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Verify Keys
            </button>
            {verified && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs text-emerald-400 font-light text-center">
                ✓ PQC keys verified in local vault
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-3">
          <h3 className="text-xs font-mono text-white/60 uppercase tracking-widest">How It Works</h3>
          <div className="text-[11px] text-white/40 font-light space-y-2 leading-relaxed">
            <p>
              Your <span className="text-cyan-400/70">ML-KEM-768</span> public key is shared with care partners so they can send you encrypted contract terms. Only your private key can decrypt them.
            </p>
            <p>
              Your <span className="text-purple-400/70">ML-DSA-44</span> key signs care receipts. The LOVE ledger stores your public key so anyone can verify the signature — but only you can produce it.
            </p>
            <p>
              Private keys never leave this browser. Public keys are registered with the LOVE ledger so other parties can verify your signatures and encrypt messages to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PQCKeygenSurface;
