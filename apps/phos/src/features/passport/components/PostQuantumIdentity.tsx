import { useState, useEffect } from 'react';
import { GlassCard, GlowButton } from '@p31/ui/chrome';
import { usePassport } from '@p31/ui/passport';
import { listCredentials } from '@p31/ui/passport/store';

export function PostQuantumIdentity() {
  const { passport } = usePassport();
  const [credCount, setCredCount] = useState(0);
  const pqDid = (passport as any)?.metadata?.pqDid as string | undefined;

  useEffect(() => {
    listCredentials().then((c) => setCredCount(c.length));
  }, []);

  return (
    <GlassCard>
      <div style={{ fontFamily: 'var(--p31-mono)', fontSize: 9, color: 'var(--p31-dim)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>
        Post-Quantum Identity
      </div>
      <code style={{ fontSize: 10, color: pqDid ? 'var(--p31-accent-green)' : 'var(--p31-muted)', fontFamily: 'var(--p31-mono)', wordBreak: 'break-all', display: 'block', marginBottom: 8 }}>
        {pqDid || 'No PQC identity generated'}
      </code>
      <div style={{ fontSize: 10, color: 'var(--p31-muted)', marginBottom: 8 }}>
        ML-DSA-65 (FIPS 204) · {pqDid ? 'Active' : 'Not generated'}
      </div>
      {pqDid && (
        <div style={{ fontSize: 10, color: 'var(--p31-accent)', marginBottom: 8 }}>
          {credCount} PQC credential{credCount !== 1 ? 's' : ''} issued
        </div>
      )}
      <GlowButton size="sm" color="green" onClick={() => window.open('https://www.nist.gov/pqc-standardization', '_blank')}>
        Learn about PQC
      </GlowButton>
    </GlassCard>
  );
}

export default PostQuantumIdentity;
