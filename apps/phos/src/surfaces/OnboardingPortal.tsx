import React, { useCallback, useEffect, useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { LangSwitcher } from '../components/LangSwitcher';
import { useI18n } from '../lib/i18n';

const FEDERATION = 'https://federation.p31ca.org';

interface PilotStatus {
  did: string;
  found: boolean;
  status?: string;
  family_name?: string;
  registered_at?: number;
  onboarded_at?: number;
  error?: string;
}

const STEPS = ['invited', 'registered', 'onboarded'] as const;

export function OnboardingPortal() {
  const { lang, setLang, t } = useI18n();
  const [did, setDid] = useState('');
  const [status, setStatus] = useState<PilotStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill DID from ?did= query param (community invite link).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search).get('did');
    if (q) setDid(q);
  }, []);

  const check = useCallback(async () => {
    if (!/^did:[a-z0-9]+:.+/.test(did.trim())) {
      setError(t('portal.invalidDid'));
      return;
    }
    setError('');
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(
        `${FEDERATION}/pilot/${encodeURIComponent(did.trim())}/status`,
        { headers: { Accept: 'application/json' } },
      );
      const data = (await res.json()) as PilotStatus;
      setStatus(data);
    } catch {
      setError(t('portal.notFound'));
    } finally {
      setLoading(false);
    }
  }, [did, t]);

  const currentStep = status?.found
    ? Math.max(0, STEPS.indexOf((status.status as any) || 'invited'))
    : -1;

  return (
    <div className="min-h-screen p-6" data-spoons="3">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-quantum-cyan">{t('portal.title')}</h1>
          <LangSwitcher lang={lang} onChange={setLang} />
        </div>
        <p className="text-white/70 mb-6">{t('portal.subtitle')}</p>

        <GlassCard>
          <label className="block text-sm text-white/70 mb-2" htmlFor="did-input">
            {t('portal.enterDid')}
          </label>
          <div className="flex gap-2">
            <input
              id="did-input"
              className="flex-1 bg-black/30 rounded px-3 py-2 text-white outline-none focus-visible:ring-2 focus-visible:ring-quantum-cyan"
              value={did}
              onChange={(e) => setDid(e.target.value)}
              placeholder="did:web:family.example"
              onKeyDown={(e) => e.key === 'Enter' && check()}
              aria-label={t('portal.enterDid')}
            />
            <button
              type="button"
              onClick={check}
              disabled={loading}
              className="px-4 py-2 rounded bg-quantum-cyan/20 text-quantum-cyan disabled:opacity-50"
            >
              {loading ? t('portal.loading') : t('portal.check')}
            </button>
          </div>
          {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
        </GlassCard>

        {status && status.found && (
          <GlassCard className="mt-6">
            <h2 className="text-lg font-medium text-white mb-4">
              {status.family_name || status.did}
            </h2>
            <ol className="space-y-3">
              {STEPS.map((step, i) => {
                const done = i <= currentStep;
                const label = step === 'invited' ? t('portal.invited') : step === 'onboarded' ? t('portal.onboarded') : t('portal.registered');
                return (
                  <li key={step} className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${done ? 'bg-quantum-cyan text-black' : 'bg-white/10 text-white/50'}`}
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <span className={done ? 'text-white' : 'text-white/50'}>
                      {t('portal.step')} {i + 1}: {label}
                    </span>
                  </li>
                );
              })}
            </ol>
            {currentStep >= STEPS.length - 1 ? (
              <p className="mt-4 text-quantum-cyan">{t('portal.done')}</p>
            ) : (
              <a
                href={`/onboarding?did=${encodeURIComponent(status.did)}`}
                className="inline-block mt-4 px-4 py-2 rounded bg-quantum-cyan/20 text-quantum-cyan"
              >
                {t('portal.start')}
              </a>
            )}
          </GlassCard>
        )}

        {status && !status.found && (
          <GlassCard className="mt-6 text-white/70">{t('portal.notFound')}</GlassCard>
        )}
      </div>
    </div>
  );
}

export default OnboardingPortal;
