import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { identityStore, type IdentityState } from '../store/identity';
import { generateKeypair, signMessage } from '../lib/crypto';
import { saveKey } from '../lib/keyVault';

type Section = 'view' | 'identity' | 'cognition' | 'communication' | 'accessibility' | 'export';

export const PassportSurface: React.FC = () => {
  const identity: IdentityState = useSyncExternalStore(
    (cb) => identityStore.subscribe(cb),
    () => identityStore.get(),
    () => ({ did: '', displayName: '', publicKey: '', isRegistered: 'false', joinedAt: '', keysGenerated: 'false' }),
  );
  const [section, setSection] = useState<Section>('view');
  const [passport, setPassport] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [form, setForm] = useState({
    displayName: '',
    oneLiner: '',
    role: 'SYSTEM_CORE',
    processingStyle: '',
    learningPreference: 'multimodal' as const,
    executiveFunctionNotes: '',
    strengths: '',
    challenges: '',
    preferredTone: 'gentle' as const,
    avoidList: '',
    responseLength: 'bullet-points' as const,
    languagePrimary: 'en',
    baselineSpoons: 3,
    screenComfort: 70,
    motionPreference: 'reduced' as const,
    contrastPreference: 'high' as const,
    fontSize: 16,
    density: 50,
    colorSensitivity: '',
    audioPreference: 'reduced' as const,
    temperaturePreference: 50,
  });

  useEffect(() => {
    const raw = localStorage.getItem('phos:passport');
    if (raw) {
      try {
        setPassport(JSON.parse(raw));
      } catch {
        // no-op
      }
    }
  }, []);

  const handleGeneratePassport = useCallback(async () => {
    const keypair = await generateKeypair();
    const { saveKey: sv } = await import('../lib/keyVault');
    await sv(keypair.privateKey);
    
    const doc = {
      ...form,
      identity: {
        displayName: form.displayName || 'Passport Holder',
        role: form.role,
        oneLiner: form.oneLiner,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      did: keypair.did,
      publicKey: keypair.publicKey,
      exportProfiles: {
        clinical: true, family: true, public: true, workplace: true,
        grantReviewer: true, legal: true, financial: true, emergency: true,
        educator: true, device: true, app: true, guest: true,
      },
    };
    
    localStorage.setItem('phos:passport', JSON.stringify(doc));
    setPassport(doc);
    setIsEditing(false);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [form]);

  const handleUpdatePassport = useCallback(async () => {
    const raw = localStorage.getItem('phos:passport');
    if (!raw) return;
    
    try {
      const doc = JSON.parse(raw);
      doc.updatedAt = new Date().toISOString();
      doc.identity = { displayName: form.displayName, role: form.role, oneLiner: form.oneLiner };
      doc.cognition = {
        processingStyle: form.processingStyle,
        learningPreference: form.learningPreference,
        executiveFunctionNotes: form.executiveFunctionNotes,
        strengths: form.strengths.split(',').filter(Boolean),
        challenges: form.challenges.split(',').filter(Boolean),
      };
      doc.communication = {
        preferredTone: form.preferredTone,
        avoidList: form.avoidList.split(',').filter(Boolean),
        responseLength: form.responseLength,
        languagePrimary: form.languagePrimary,
      };
      doc.accessibility = {
        screenComfort: form.screenComfort,
        motionPreference: form.motionPreference,
        contrastPreference: form.contrastPreference,
        fontSize: form.fontSize,
        density: form.density,
        colorSensitivity: form.colorSensitivity.split(',').filter(Boolean),
        audioPreference: form.audioPreference,
        temperaturePreference: form.temperaturePreference,
      };
      doc.baselineSpoons = form.baselineSpoons;
      
      localStorage.setItem('phos:passport', JSON.stringify(doc));
      setPassport(doc);
      setIsEditing(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('idle');
    }
  }, [form]);

  const handleExport = useCallback((profile?: string) => {
    if (!passport) return;
    const export_ = structuredClone(passport);
    if (profile === 'guest') {
      delete export_.cognition;
      delete export_.communication;
      export_.identity = { displayName: export_.identity.displayName, role: 'Guest' };
    }
    const blob = new Blob([JSON.stringify(export_, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cognitive-passport-${profile || 'full'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [passport]);

  const loadFormFromPassport = useCallback(() => {
    if (!passport) return;
    setForm({
      displayName: passport.identity?.displayName || '',
      oneLiner: passport.identity?.oneLiner || '',
      role: passport.identity?.role || 'SYSTEM_CORE',
      processingStyle: passport.cognition?.processingStyle || '',
      learningPreference: passport.cognition?.learningPreference || 'multimodal',
      executiveFunctionNotes: passport.cognition?.executiveFunctionNotes || '',
      strengths: (passport.cognition?.strengths || []).join(', '),
      challenges: (passport.cognition?.challenges || []).join(', '),
      preferredTone: passport.communication?.preferredTone || 'gentle',
      avoidList: (passport.communication?.avoidList || []).join(', '),
      responseLength: passport.communication?.responseLength || 'bullet-points',
      languagePrimary: passport.communication?.languagePrimary || 'en',
      baselineSpoons: passport.baselineSpoons ?? 3,
      screenComfort: passport.accessibility?.screenComfort ?? 70,
      motionPreference: passport.accessibility?.motionPreference || 'reduced',
      contrastPreference: passport.accessibility?.contrastPreference || 'high',
      fontSize: passport.accessibility?.fontSize ?? 16,
      density: passport.accessibility?.density ?? 50,
      colorSensitivity: (passport.accessibility?.colorSensitivity || []).join(', '),
      audioPreference: passport.accessibility?.audioPreference || 'reduced',
      temperaturePreference: passport.accessibility?.temperaturePreference ?? 50,
    });
  }, [passport]);

  if (!passport) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
        <span className="text-3xl">🪪</span>
        <h2 className="text-lg font-light tracking-wide text-[#E8E8EC]">No Passport Yet</h2>
        <p className="text-xs text-white/40 font-light text-center max-w-xs">
          Create your Cognitive Passport — your sovereign document for accessibility, cognition, and identity.
        </p>
        <button
          onClick={async () => {
            await generateKeypair();
            const keypair = await generateKeypair();
            const { saveKey: sv } = await import('../lib/keyVault');
            await sv(keypair.privateKey);
            identityStore.set({
              did: keypair.did,
              displayName: '',
              publicKey: keypair.publicKey,
              isRegistered: 'false',
              joinedAt: '',
              keysGenerated: 'true',
            });
            setSection('cognition');
            loadFormFromPassport();
          }}
          className="rounded-2xl phos-glass border border-white/10 px-6 py-4 text-sm font-light text-white/80 hover:phos-glass transition-all"
        >
          Begin Passport
        </button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-light tracking-wide text-[#E8E8EC]">Edit Passport</h2>
          <div className="flex gap-2">
            <button
              onClick={() => { setIsEditing(false); loadFormFromPassport(); }}
              className="text-xs text-white/40 hover:text-white/90 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdatePassport}
              disabled={saveStatus === 'saving'}
              className="rounded-xl phos-glass border border-white/10 px-4 py-2 text-xs font-light text-white/80 hover:phos-glass transition-all disabled:opacity-40"
            >
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
        {section === 'identity' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Display Name</label>
              <input value={form.displayName} onChange={(e) => setForm({...form, displayName: e.target.value})} className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">One-Liner</label>
              <input value={form.oneLiner} onChange={(e) => setForm({...form, oneLiner: e.target.value})} className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none">
                <option value="SYSTEM_CORE">System Core</option>
                <option value="PARENT_A">Parent A</option>
                <option value="PARENT_B">Parent B</option>
                <option value="CHILD">Child</option>
                <option value="OPERATOR">Operator</option>
                <option value="GUEST">Guest</option>
              </select>
            </div>
          </div>
        )}
        {section === 'cognition' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Processing Style</label>
              <input value={form.processingStyle} onChange={(e) => setForm({...form, processingStyle: e.target.value})} placeholder="e.g., parallel, sequential, interrupt-driven" className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Learning Preference</label>
              <select value={form.learningPreference} onChange={(e) => setForm({...form, learningPreference: e.target.value as any})} className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none">
                <option value="visual">Visual</option>
                <option value="kinetic">Kinetic</option>
                <option value="text">Text</option>
                <option value="audio">Audio</option>
                <option value="multimodal">Multimodal</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Executive Function Notes</label>
              <textarea value={form.executiveFunctionNotes} onChange={(e) => setForm({...form, executiveFunctionNotes: e.target.value})} rows={3} className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none resize-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Strengths (comma-separated)</label>
              <input value={form.strengths} onChange={(e) => setForm({...form, strengths: e.target.value})} className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Challenges (comma-separated)</label>
              <input value={form.challenges} onChange={(e) => setForm({...form, challenges: e.target.value})} className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none" />
            </div>
          </div>
        )}
        {section === 'communication' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Preferred Tone</label>
              <select value={form.preferredTone} onChange={(e) => setForm({...form, preferredTone: e.target.value as any})} className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none">
                <option value="direct">Direct</option>
                <option value="gentle">Gentle</option>
                <option value="analytical">Analytical</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Avoid List (comma-separated)</label>
              <input value={form.avoidList} onChange={(e) => setForm({...form, avoidList: e.target.value})} placeholder="words or phrases that cause cognitive spikes" className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Response Length</label>
              <select value={form.responseLength} onChange={(e) => setForm({...form, responseLength: e.target.value as any})} className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none">
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
                <option value="bullet-points">Bullet Points</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Primary Language</label>
              <input value={form.languagePrimary} onChange={(e) => setForm({...form, languagePrimary: e.target.value})} className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none" />
            </div>
          </div>
        )}
        {section === 'accessibility' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-white/40 font-light block">Screen Comfort: {form.screenComfort}</label>
              <input type="range" min="0" max="100" value={form.screenComfort} onChange={(e) => setForm({...form, screenComfort: parseInt(e.target.value)})} className="w-full" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40 font-light block">Font Size: {form.fontSize}px</label>
              <input type="range" min="8" max="32" value={form.fontSize} onChange={(e) => setForm({...form, fontSize: parseInt(e.target.value)})} className="w-full" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40 font-light block">Information Density: {form.density}</label>
              <input type="range" min="0" max="100" value={form.density} onChange={(e) => setForm({...form, density: parseInt(e.target.value)})} className="w-full" />
            </div>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Motion Preference</label>
              <select value={form.motionPreference} onChange={(e) => setForm({...form, motionPreference: e.target.value as any})} className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none">
                <option value="off">Off</option>
                <option value="reduced">Reduced</option>
                <option value="full">Full</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Contrast Preference</label>
              <select value={form.contrastPreference} onChange={(e) => setForm({...form, contrastPreference: e.target.value as any})} className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none">
                <option value="high">High</option>
                <option value="standard">Standard</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Color Sensitivity (comma-separated)</label>
              <input value={form.colorSensitivity} onChange={(e) => setForm({...form, colorSensitivity: e.target.value})} placeholder="e.g., red, flashing" className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Audio Preference</label>
              <select value={form.audioPreference} onChange={(e) => setForm({...form, audioPreference: e.target.value as any})} className="w-full rounded-xl phos-glass border border-white/10 px-4 py-3 text-sm text-white/80 outline-none">
                <option value="off">Off</option>
                <option value="reduced">Reduced</option>
                <option value="full">Full</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 font-light block mb-1">Baseline Spoons ({form.baselineSpoons} / 5)</label>
              <input type="range" min="0" max="5" value={form.baselineSpoons} onChange={(e) => setForm({...form, baselineSpoons: parseInt(e.target.value)})} className="w-full" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-light tracking-wide text-[#E8E8EC]">Cognitive Passport</h2>
          <p className="text-xs text-white/70 font-light mt-0.5">
            {passport.did ? `DID: ${passport.did.slice(0, 40)}...` : 'Local document'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { loadFormFromPassport(); setIsEditing(true); }}
            className="rounded-xl phos-glass border border-white/10 px-4 py-2 text-xs font-light text-white/60 hover:text-white/80 hover:phos-glass transition-all"
          >
            Edit
          </button>
          <button
            onClick={() => handleExport()}
            className="rounded-xl phos-glass border border-white/10 px-4 py-2 text-xs font-light text-white/60 hover:text-white/80 hover:phos-glass transition-all"
          >
            Export
          </button>
        </div>
      </div>

      {saveStatus === 'saved' && (
        <div className="rounded-xl phos-glass border border-white/10 px-4 py-2 text-xs text-white/60 font-light text-center">
          Saved to local storage.
        </div>
      )}

      {!isEditing && (
        <div className="space-y-4">
          {passport.identity && (
            <div className="rounded-2xl phos-glass border border-white/5 p-5 space-y-3">
              <h3 className="text-xs font-mono text-white/70 uppercase tracking-widest">Identity</h3>
              <div className="grid grid-cols-2 gap-3 text-sm font-light">
                <div>
                  <div className="text-[10px] text-white/70 uppercase tracking-widest mb-0.5">Name</div>
                  <div className="text-white/70">{passport.identity.displayName || '—'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/70 uppercase tracking-widest mb-0.5">Role</div>
                  <div className="text-white/70">{passport.identity.role || '—'}</div>
                </div>
                {passport.identity.oneLiner && (
                  <div className="col-span-2">
                    <div className="text-[10px] text-white/70 uppercase tracking-widest mb-0.5">One-Liner</div>
                    <div className="text-white/70 text-xs italic">{passport.identity.oneLiner}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {passport.cognition && (
            <div className="rounded-2xl phos-glass border border-white/5 p-5 space-y-3">
              <h3 className="text-xs font-mono text-white/70 uppercase tracking-widest">Cognition</h3>
              <div className="grid grid-cols-2 gap-3 text-sm font-light">
                <div>
                  <div className="text-[10px] text-white/70 uppercase tracking-widest mb-0.5">Processing Style</div>
                  <div className="text-white/70">{passport.cognition.processingStyle || '—'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/70 uppercase tracking-widest mb-0.5">Learning</div>
                  <div className="text-white/70">{passport.cognition.learningPreference || '—'}</div>
                </div>
              </div>
              {passport.cognition.strengths?.length > 0 && (
                <div>
                  <div className="text-[10px] text-white/70 uppercase tracking-widest mb-1">Strengths</div>
                  <div className="flex flex-wrap gap-1">
                    {passport.cognition.strengths.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded-full phos-glass text-[10px] text-white/50 font-light">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {passport.accessibility && (
            <div className="rounded-2xl phos-glass border border-white/5 p-5 space-y-3">
              <h3 className="text-xs font-mono text-white/70 uppercase tracking-widest">Accessibility</h3>
              <div className="grid grid-cols-2 gap-3 text-sm font-light">
                <div>
                  <div className="text-[10px] text-white/70 uppercase tracking-widest mb-0.5">Spoons Baseline</div>
                  <div className="text-white/70">{passport.baselineSpoons ?? 3} / 5</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/70 uppercase tracking-widest mb-0.5">Font Size</div>
                  <div className="text-white/70">{passport.accessibility.fontSize || 16}px</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/70 uppercase tracking-widest mb-0.5">Motion</div>
                  <div className="text-white/70">{passport.accessibility.motionPreference || '—'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/70 uppercase tracking-widest mb-0.5">Contrast</div>
                  <div className="text-white/70">{passport.accessibility.contrastPreference || '—'}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={() => handleExport('full')} className="min-h-[48px] min-w-[48px] flex-1 rounded-xl phos-glass border border-white/10 px-4 py-2.5 text-xs font-light text-white/60 hover:text-white/80 hover:phos-glass transition-all">
              Export Full
            </button>
            <button onClick={() => handleExport('clinical')} className="min-h-[48px] min-w-[48px] flex-1 rounded-xl phos-glass border border-white/10 px-4 py-2.5 text-xs font-light text-white/60 hover:text-white/80 hover:phos-glass transition-all">
              Clinical View
            </button>
            <button onClick={() => handleExport('guest')} className="min-h-[48px] min-w-[48px] flex-1 rounded-xl phos-glass border border-white/10 px-4 py-2.5 text-xs font-light text-white/60 hover:text-white/80 hover:phos-glass transition-all">
              Guest View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

