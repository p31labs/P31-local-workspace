import React, { useState, useCallback } from 'react';
import { identityStore, clearIdentity, generateAndStoreIdentity, loadPrivateKey } from '../store/identity';
import { useAtmosphere } from '../components/AtmosphereProvider';
import { spoonsStore } from '../store/spoons';
import { generateKeypair } from '../lib/crypto';

const K4_BASE = 'https://gateway.p31ca.org/api/mesh';

type Stage = 'welcome' | 'generating' | 'naming';

export const AbdicationRitual: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [stage, setStage] = useState<Stage>('welcome');
  const [name, setName] = useState('');
  const [nodeType, setNodeType] = useState('SYSTEM_CORE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const { spoons } = useAtmosphere();

  const handleKeygen = useCallback(async () => {
    setLoading(true);
    setError('');
    setProgress(0);
    try {
      setProgress(20);
      await new Promise(r => setTimeout(r, 200));

      const keypair = await generateKeypair();
      setProgress(60);
      await new Promise(r => setTimeout(r, 200));

      // Save private key to IndexedDB (non-extractable)
      const { saveKey } = await import('../lib/keyVault');
      await saveKey(keypair.privateKey);
      setProgress(80);
      await new Promise(r => setTimeout(r, 200));

      // Store public identity
      identityStore.set({
        did: keypair.did,
        displayName: '',
        publicKey: keypair.publicKey,
        isRegistered: 'false',
        joinedAt: '',
        keysGenerated: 'true',
      });
      setProgress(100);
      await new Promise(r => setTimeout(r, 300));
      setStage('naming');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Key generation failed');
      setStage('welcome');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRegister = useCallback(async () => {
    if (!name.trim()) {
      setError('Choose a name to continue');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const id = identityStore.get();
      // Register with K4 Cage for mesh participation
      const resp = await fetch(`${K4_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          did: id.did,
          nodeType,
          displayName: name.trim(),
          ed25519PublicKey: id.publicKey,
          mldsa65PublicKey: '',
        }),
      });
      if (!resp.ok) throw new Error(`Registration failed: ${resp.status}`);
      const data = await resp.json();

      identityStore.set({
        ...id,
        displayName: name.trim(),
        joinedAt: new Date().toISOString(),
        isRegistered: 'true',
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }, [name, nodeType, onComplete]);

  const handleSkip = useCallback(() => {
    clearIdentity().then(() => {
      spoonsStore.set(4);
      onComplete();
    });
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0A0A0C] p-8 shadow-2xl">
        <div className="space-y-6">
          {stage === 'welcome' && (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-light tracking-wide text-[#E8E8EC]">Sovereign Entry</h2>
                <p className="text-sm text-white/50 font-light leading-relaxed">
                  This space is yours. Generate your cryptographic identity locally — nothing leaves this device.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setStage('generating')}
                  disabled={loading}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-sm font-light text-white/80 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-40"
                >
                  Begin Ritual
                </button>
                <button
                  onClick={handleSkip}
                  className="w-full rounded-2xl px-6 py-3.5 text-xs font-light text-white/70 hover:text-white/90 transition-colors min-h-[48px]"
                >
                  Enter as Guest
                </button>
              </div>
            </>
          )}

          {stage === 'generating' && (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-light tracking-wide text-[#E8E8EC]">Generate Keys</h2>
                <p className="text-sm text-white/50 font-light leading-relaxed">
                  Ed25519 keypair generated locally via Web Crypto.
                </p>
              </div>
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400/80 font-light">
                  {error}
                </div>
              )}
              <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--phos-primary)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <button
                onClick={handleKeygen}
                disabled={loading || progress > 0}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-sm font-light text-white/80 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-40"
              >
                {loading ? 'Generating...' : progress > 0 ? 'Keypair Generated' : 'Generate Identity'}
              </button>
            </>
          )}

          {stage === 'naming' && (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-light tracking-wide text-[#E8E8EC]">Choose Your Name</h2>
                <p className="text-sm text-white/50 font-light leading-relaxed">
                  This name identifies you within the mesh. It can be changed later.
                </p>
              </div>
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400/80 font-light">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Display name"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-3.5 text-sm text-white/80 placeholder-white/20 font-light outline-none focus:border-white/20 transition-colors"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                />
                <select
                  value={nodeType}
                  onChange={(e) => setNodeType(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-3.5 text-sm text-white/60 font-light outline-none focus:border-white/20 transition-colors appearance-none"
                >
                  <option value="SYSTEM_CORE">System Core</option>
                  <option value="PARENT_A">Parent A</option>
                  <option value="PARENT_B">Parent B</option>
                  <option value="CHILD">Child</option>
                </select>
              </div>
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-sm font-light text-white/80 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-40"
              >
                {loading ? 'Registering...' : 'Enter PHOS'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
