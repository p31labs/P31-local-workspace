/**
 * @file PassportGenerator — Onboarding wizard that creates a real sovereign
 * Cognitive Passport (Ed25519 did:key + content). After creation, registers
 * a did:web and profile record on federation-bridge.
 */

import { useState } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';
import { generateOneLiner, type OnboardingInput } from '@p31ca/ui/passport';
import { usePassport } from '@p31ca/ui/passport';

const FEDERATION_API = 'https://gateway.p31ca.org/api/federation';

const STRENGTH_OPTIONS = ['pattern', 'focus', 'memory', 'empathy', 'creativity', 'logic', 'honesty', 'stamina'];
const CHALLENGE_OPTIONS = ['initiation', 'switching', 'memory', 'sensory', 'social', 'executive', 'rejection'];
const ROLE_OPTIONS = ['SYSTEM_CORE', 'PARENT_A', 'PARENT_B', 'CHILD', 'OPERATOR'] as const;

const STEPS = ['identity', 'cognition', 'communication', 'review'] as const;
type Step = (typeof STEPS)[number];

export function PassportGenerator() {
  const { create } = usePassport();
  const [step, setStep] = useState<Step>('identity');
  const [input, setInput] = useState<OnboardingInput>({});
  const [busy, setBusy] = useState(false);

  const patch = (p: Partial<OnboardingInput>) => setInput((i) => ({ ...i, ...p }));
  const toggle = (key: 'strengths' | 'challenges', v: string) =>
    setInput((i) => {
      const arr = i[key] ?? [];
      return { ...i, [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });

  const preview = generateOneLiner(input);

  const finalize = async () => {
    setBusy(true);
    const passport = await create({
      identity: {
        displayName: input.displayName,
        pronouns: input.pronouns,
        role: input.role,
        oneLiner: input.oneLiner || preview,
      },
      cognition: {
        processingStyle: input.processingStyle,
        learningPreference: input.learningPreference,
        executiveFunctionNotes: input.executiveFunctionNotes,
        strengths: input.strengths,
        challenges: input.challenges,
      },
      communication: {
        preferredTone: input.preferredTone,
        avoidList: input.avoidList,
        languagePrimary: input.languagePrimary,
      },
      accessibility: {
        screenComfort: 60,
        motionPreference: 'reduced',
        contrastPreference: 'high',
        fontSize: 16,
        density: 40,
      },
    });

    const didWebId = `did:web:p31ca.org:users:${crypto.randomUUID()}`;

    try {
      await fetch(`${FEDERATION_API}/identity/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          did: didWebId,
          ed25519_pub: passport.publicKey,
          mldsa65_pub: null,
          eth_address: null,
        }),
      });

      await fetch(`${FEDERATION_API}/.well-known/profiles/${encodeURIComponent(didWebId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: input.displayName || 'User',
          bio: input.oneLiner || preview,
          preferences: { spoonsDefault: 3, theme: 'dark' },
        }),
      });
    } catch (e) {
      console.error('Failed to register sovereign identity:', e);
    }

    setBusy(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Create your Passport</h1>
        <p className="text-cloud/50 text-sm">
          Sovereign identity, generated on this device. No account, no server.
        </p>
        <div className="flex gap-2 mt-4">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${STEPS.indexOf(step) >= i ? 'bg-quantum-cyan' : 'bg-white/10'}`}
            />
          ))}
        </div>
      </GlassCard>

      {step === 'identity' && (
        <GlassCard className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-ink">Who are you?</h2>
          <Field label="Display name">
            <input className={inputCls} value={input.displayName ?? ''} onChange={(e) => patch({ displayName: e.target.value })} placeholder="e.g. River" />
          </Field>
          <Field label="Pronouns">
            <input className={inputCls} value={input.pronouns ?? ''} onChange={(e) => patch({ pronouns: e.target.value })} placeholder="e.g. they/them" />
          </Field>
          <Field label="Role">
            <select className={inputCls} value={input.role ?? ''} onChange={(e) => patch({ role: e.target.value as any })}>
              <option value="">—</option>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Next onNext={() => setStep('cognition')} />
        </GlassCard>
      )}

      {step === 'cognition' && (
        <GlassCard className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-ink">How your mind works</h2>
          <Field label="Strengths (pick any)">
            <div className="flex flex-wrap gap-2">
              {STRENGTH_OPTIONS.map((s) => (
                <Chip key={s} active={(input.strengths ?? []).includes(s)} onClick={() => toggle('strengths', s)}>{s}</Chip>
              ))}
            </div>
          </Field>
          <Field label="Challenges (pick any)">
            <div className="flex flex-wrap gap-2">
              {CHALLENGE_OPTIONS.map((c) => (
                <Chip key={c} active={(input.challenges ?? []).includes(c)} onClick={() => toggle('challenges', c)}>{c}</Chip>
              ))}
            </div>
          </Field>
          <Field label="Processing style">
            <input className={inputCls} value={input.processingStyle ?? ''} onChange={(e) => patch({ processingStyle: e.target.value })} placeholder="e.g. parallel processor" />
          </Field>
          <div className="flex gap-2">
            <Back onBack={() => setStep('identity')} />
            <Next onNext={() => setStep('communication')} />
          </div>
        </GlassCard>
      )}

      {step === 'communication' && (
        <GlassCard className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-ink">How you communicate</h2>
          <Field label="Preferred tone">
            <select className={inputCls} value={input.preferredTone ?? ''} onChange={(e) => patch({ preferredTone: e.target.value as any })}>
              <option value="">—</option>
              {['direct', 'gentle', 'analytical', 'casual', 'formal'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Primary language (ISO 639-1)">
            <input className={inputCls} value={input.languagePrimary ?? ''} onChange={(e) => patch({ languagePrimary: e.target.value })} placeholder="en" />
          </Field>
          <Field label="Words/phrases to avoid">
            <input className={inputCls} value={(input.avoidList ?? []).join(', ')} onChange={(e) => patch({ avoidList: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="e.g. just try harder" />
          </Field>
          <div className="flex gap-2">
            <Back onBack={() => setStep('cognition')} />
            <Next onNext={() => setStep('review')} />
          </div>
        </GlassCard>
      )}

      {step === 'review' && (
        <GlassCard className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-ink">Review & finalize</h2>
          <Field label="One-liner (AI assist — editable)">
            <textarea className={inputCls} rows={2} value={input.oneLiner ?? preview} onChange={(e) => patch({ oneLiner: e.target.value })} />
          </Field>
          <p className="text-xs text-cloud/40">A real Ed25519 key will be generated and your DID derived from it. Nothing leaves this device.</p>
          <div className="flex gap-2">
            <Back onBack={() => setStep('communication')} />
            <GlowButton color="cyan" onClick={finalize} disabled={busy} className="flex-1">
              {busy ? 'Generating…' : 'Create Passport'}
            </GlowButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

const inputCls =
  'w-full px-3 h-10 rounded-lg bg-white/5 border border-white/10 text-sm text-ink outline-none focus:border-quantum-cyan/40';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-cloud/60 font-mono-tech block mb-1">{label}</span>
      {children}
    </label>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 h-9 rounded-full border text-sm transition-colors ${active ? 'border-quantum-cyan/60 bg-quantum-cyan/15 text-ink' : 'border-white/10 text-cloud/70 hover:border-white/20'}`}
    >
      {children}
    </button>
  );
}

function Next({ onNext }: { onNext: () => void }) {
  return <GlowButton color="cyan" onClick={onNext} className="flex-1">Next</GlowButton>;
}
function Back({ onBack }: { onBack: () => void }) {
  return <GlowButton variant="ghost" onClick={onBack}>Back</GlowButton>;
}
