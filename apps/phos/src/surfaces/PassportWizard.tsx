import React, { useState, useCallback, useEffect } from 'react';
import { generateAndStoreIdentity, clearIdentity, identityStore, loadPrivateKey } from '../store/identity';
import { spoonsStore } from '../store/spoons';

type Stage = 'welcome' | 'generating' | 'identity' | 'accessibility' | 'complete';

export const PassportWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [stage, setStage] = useState<Stage>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const spoons = spoonsStore.get();

  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('SYSTEM_CORE');
  const [oneLiner, setOneLiner] = useState('');
  const [learningPreference, setLearningPreference] = useState<'visual' | 'kinetic' | 'text' | 'audio' | 'multimodal'>('multimodal');
  const [preferredTone, setPreferredTone] = useState<'direct' | 'gentle' | 'analytical'>('gentle');
  const [responseLength, setResponseLength] = useState<'concise' | 'detailed' | 'bullet-points'>('bullet-points');
  const [screenComfort, setScreenComfort] = useState(70);
  const [motionPreference, setMotionPreference] = useState<'off' | 'reduced' | 'full'>('reduced');
  const [contrastPreference, setContrastPreference] = useState<'high' | 'standard' | 'low'>('high');
  const [fontSize, setFontSize] = useState(16);
  const [density, setDensity] = useState(50);

  useEffect(() => {
    document.documentElement.dataset.spoons = '4';
  }, []);

  const handleGuestBypass = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { generateKeypair } = await import('../lib/crypto');
      const keypair = await generateKeypair();
      const { saveKey } = await import('../lib/keyVault');
      await saveKey(keypair.privateKey);
      identityStore.set({
        did: keypair.did,
        displayName: 'Guest',
        publicKey: keypair.publicKey,
        isRegistered: 'false',
        joinedAt: '',
        keysGenerated: 'true',
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guest setup failed');
      setLoading(false);
    }
  }, [onComplete]);

  const handleCreatePassport = useCallback(() => {
    setStage('generating');
  }, []);

  const handleKeygen = useCallback(async () => {
    setLoading(true);
    setError('');
    setProgress(0);
    try {
      setProgress(20);
      await new Promise(r => setTimeout(r, 150));
      await generateAndStoreIdentity('');
      setProgress(80);
      await new Promise(r => setTimeout(r, 150));
      setProgress(100);
      await new Promise(r => setTimeout(r, 200));
      setStage('identity');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Key generation failed');
      setStage('generating');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleIdentitySubmit = useCallback(() => {
    if (!displayName.trim()) {
      setError('Choose a name to continue');
      return;
    }
    const id = identityStore.get();
    identityStore.setKey('displayName', displayName.trim());
    onComplete();
  }, [displayName, onComplete]);

  const handleSkip = useCallback(async () => {
    await clearIdentity();
    spoonsStore.set(4);
    onComplete();
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0A0A0C] p-8 shadow-2xl">
        <div className="space-y-6">
          {stage === 'welcome' && (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-light tracking-wide text-[#E8E8EC]">Cognitive Passport</h2>
                <p className="text-sm text-white/50 font-light leading-relaxed">
                  Your sovereign document. Generated locally. Nothing leaves this device unless you choose to share.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleCreatePassport}
                  disabled={loading}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-sm font-light text-white/80 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-40"
                >
                  Create Passport
                </button>
                <button
                  onClick={handleGuestBypass}
                  disabled={loading}
                  className="w-full rounded-2xl px-6 py-3.5 text-xs font-light text-white/30 hover:text-white/50 transition-colors min-h-[44px]"
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
                  Ed25519 keypair generated locally.
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

          {stage === 'identity' && (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-light tracking-wide text-[#E8E8EC]">Your Identity</h2>
                <p className="text-sm text-white/50 font-light leading-relaxed">
                  How you are known in this space.
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
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-3.5 text-sm text-white/80 placeholder-white/20 font-light outline-none focus:border-white/20 transition-colors"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleIdentitySubmit()}
                />
                <input
                  type="text"
                  value={oneLiner}
                  onChange={(e) => setOneLiner(e.target.value)}
                  placeholder="One-liner: what you do in the mesh (optional)"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-3.5 text-sm text-white/80 placeholder-white/20 font-light outline-none focus:border-white/20 transition-colors"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-3.5 text-sm text-white/60 font-light outline-none focus:border-white/20 transition-colors appearance-none"
                >
                  <option value="SYSTEM_CORE">System Core</option>
                  <option value="PARENT_A">Parent A</option>
                  <option value="PARENT_B">Parent B</option>
                  <option value="CHILD">Child</option>
                  <option value="OPERATOR">Operator</option>
                </select>
              </div>
              <button
                onClick={handleIdentitySubmit}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-sm font-light text-white/80 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                Continue
              </button>
            </>
          )}

          {stage === 'complete' && (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-light tracking-wide text-[#E8E8EC]">Passport Ready</h2>
                <p className="text-sm text-white/50 font-light leading-relaxed">
                  Your Document is sovereign. You control it.
                </p>
              </div>
              <button
                onClick={onComplete}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-sm font-light text-white/80 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                Enter PHOS
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
