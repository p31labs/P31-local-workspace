/**
 * @file ParentalConsent.tsx — WILLOW P0 mitigation #2 (COPPA VPC UI).
 * Shown after age selection, before the child's garden unlocks.
 */

import { useState } from 'react';
import { GlassCard, GlowButton } from '@p31ca/ui/chrome';
import { createConsent, verifyConsent, ConsentRecord } from '../lib/consent';

interface ParentalConsentProps {
  age: number;
  onGranted: (record: ConsentRecord) => void;
}

export function ParentalConsent({ age, onGranted }: ParentalConsentProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<ConsentRecord | null>(null);

  const sign = async () => {
    setBusy(true);
    setError(null);
    try {
      const record = await createConsent(age);
      const valid = await verifyConsent(record);
      if (!valid) throw new Error('Signature verification failed.');
      setDone(record);
      onGranted(record);
    } catch (e: any) {
      setError(e?.message || 'Could not create consent. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-void-deep/90 backdrop-blur-md">
      <GlassCard className="p-6 max-w-sm w-full" strong>
        <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>🔐</div>
        <h2 className="text-lg font-bold text-quantum-green mb-2 text-center">Parental Consent</h2>
        <p className="text-cloud/70 text-sm mb-4">
          To open Willow for a {age}-year-old, a parent or guardian must sign a one-tap consent.
          This creates a private, verifiable signature — no account, no email, nothing leaves this device.
        </p>

        {!done ? (
          <>
            <GlowButton color="green" size="md" className="w-full justify-center" disabled={busy} onClick={sign}>
              {busy ? 'Signing…' : 'Sign consent (parent)'}
            </GlowButton>
            {error && <p className="text-quantum-rose text-[12px] mt-3 text-center">{error}</p>}
            <p className="text-mist/50 text-[11px] mt-3 text-center leading-relaxed">
              Consent is recorded as a signed consent statement bound to your child’s local identity (did:key).
            </p>
          </>
        ) : (
          <div className="text-center">
            <div className="text-quantum-green text-2xl mb-2">✅</div>
            <p className="text-cloud/70 text-sm">Consent verified.</p>
            <p className="text-mist/60 text-[10px] mt-2 break-all font-mono-tech">child: {done.childDid.slice(0, 32)}…</p>
            <p className="text-mist/60 text-[10px] break-all font-mono-tech">parent: {done.parentDid.slice(0, 32)}…</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
