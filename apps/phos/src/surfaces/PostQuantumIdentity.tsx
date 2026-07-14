import React, { useState, useCallback } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { KeyString } from '../components/ui/KeyString';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Disclosure } from '../components/Disclosure';
import { useAtmosphere } from '../components/AtmosphereProvider';

/**
 * PostQuantumIdentity — DID management, composite signature visualisation,
 * and SD-JWT credential wallet surface.
 *
 * Phase 5 of CWP-2026-031: The Design Frontier.
 */

interface DIDEntry {
  id: string;
  method: 'key' | 'jwk' | 'web';
  publicKey: string;
  algorithm: string;
  created: string;
  status: 'active' | 'rotated' | 'revoked';
}

interface CredentialEntry {
  id: string;
  type: string;
  issuer: string;
  issued: string;
  claims: string[];
}

const MOCK_DIDS: DIDEntry[] = [
  {
    id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    method: 'key',
    publicKey: 'Ed25519',
    algorithm: 'Ed25519',
    created: '2026-07-01',
    status: 'active',
  },
  {
    id: 'did:jwk:eyJrdHkiOiJBSyIsImFsZyI6Ik1MLURTQS02NSIsInB1YiI6Ii4uLiJ9',
    method: 'jwk',
    publicKey: 'ML-DSA-65',
    algorithm: 'ML-DSA-65 (PQ)',
    created: '2026-07-10',
    status: 'active',
  },
];

const MOCK_CREDENTIALS: CredentialEntry[] = [
  {
    id: 'sd-jwt-001',
    type: 'CareAttestation',
    issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    issued: '2026-07-12',
    claims: ['familyId', 'careScore', 'timestamp'],
  },
];

export function PostQuantumIdentitySurface() {
  const { spoons } = useAtmosphere();
  const [activeTab, setActiveTab] = useState<'dids' | 'composite' | 'wallet'>('dids');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white/90">Post-Quantum Identity</h1>
          <p className="text-sm text-white/40 mt-1">
            DID management, composite signatures, and SD-JWT wallet
          </p>
        </div>
        <StatusBadge status="ok" label="PQ Active" />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-[12px] w-fit" role="tablist">
        {([
          ['dids', 'DID Management'],
          ['composite', 'Composite Signatures'],
          ['wallet', 'SD-JWT Wallet'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`
              px-4 py-2 text-sm font-sans rounded-[8px] transition-all duration-200 min-h-[44px]
              ${activeTab === key
                ? 'bg-quantum-cyan/15 text-quantum-cyan border border-quantum-cyan/20'
                : 'text-white/40 hover:text-white/60 border border-transparent'}
            `}
            role="tab"
            aria-selected={activeTab === key}
            aria-controls={`panel-${key}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── DID Management ─────────────────────────────────────────────── */}
      {activeTab === 'dids' && (
        <div id="panel-dids" role="tabpanel" className="space-y-4">
          {MOCK_DIDS.map((did) => (
            <GlassCard key={did.id} hover={false}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-[0.05em] text-white/30 font-mono">
                      {did.method}
                    </span>
                    <StatusBadge
                      status={did.status === 'active' ? 'ok' : did.status === 'rotated' ? 'warning' : 'error'}
                      label={did.status}
                    />
                  </div>
                  <KeyString code={did.id} label="DID" truncate maxLength={48} />
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-white/30">
                    <span>{did.algorithm}</span>
                    <span>·</span>
                    <span>{did.created}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="px-3 py-1.5 text-[11px] text-white/40 hover:text-white/60 border border-white/10 rounded-[8px] transition-colors min-h-[44px]">
                    Rotate
                  </button>
                  <button className="px-3 py-1.5 text-[11px] text-quantum-red/60 hover:text-quantum-red border border-quantum-red/10 rounded-[8px] transition-colors min-h-[44px]">
                    Revoke
                  </button>
                </div>
              </div>

              <Disclosure title="DID Document" spoons={spoons} autoCollapseBelow={2}>
                <CodeBlock
                  language="JSON"
                  code={JSON.stringify({
                    '@context': ['https://www.w3.org/ns/did/v1'],
                    id: did.id,
                    verificationMethod: [{ id: `${did.id}#key-1`, type: did.algorithm, controller: did.id }],
                    assertionMethod: [`${did.id}#key-1`],
                  }, null, 2)}
                />
              </Disclosure>
            </GlassCard>
          ))}

          <button className="w-full py-3 border border-dashed border-white/10 rounded-[24px] text-sm text-white/30 hover:text-white/50 hover:border-white/20 transition-all min-h-[48px]">
            + Generate New ML-DSA-65 Keypair
          </button>
        </div>
      )}

      {/* ── Composite Signatures ───────────────────────────────────────── */}
      {activeTab === 'composite' && (
        <div id="panel-composite" role="tabpanel" className="space-y-4">
          <GlassCard hover={false}>
            <h3 className="text-sm font-semibold text-white/80 mb-3">Defence-in-Depth Verification</h3>
            <p className="text-sm text-white/40 mb-4">
              Composite signatures combine Ed25519 (classical) with ML-DSA-65 (post-quantum)
              for layered security.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ed25519 */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-[16px] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.05em] text-white/30">Ed25519</span>
                  <StatusBadge status="ok" label="Verified" />
                </div>
                <p className="text-xs text-white/50">Classical signature — fast, battle-tested</p>
                <KeyString
                  code="302a300506032b6570032100..."
                  label="Signature"
                  truncate
                  maxLength={20}
                  className="mt-3"
                />
              </div>

              {/* ML-DSA-65 */}
              <div className="bg-white/[0.03] border border-quantum-cyan/10 rounded-[16px] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.05em] text-white/30">ML-DSA-65</span>
                  <StatusBadge status="ok" label="Verified" />
                </div>
                <p className="text-xs text-white/50">Post-quantum — FIPS 204, quantum-resistant</p>
                <KeyString
                  code="mldsa65sig0011223344556677..."
                  label="Signature"
                  truncate
                  maxLength={20}
                  className="mt-3"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-quantum-green">
              <span aria-hidden="true">✓</span>
              <span>Both signatures verified — composite signature valid</span>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ── SD-JWT Wallet ──────────────────────────────────────────────── */}
      {activeTab === 'wallet' && (
        <div id="panel-wallet" role="tabpanel" className="space-y-4">
          {MOCK_CREDENTIALS.map((cred) => (
            <GlassCard key={cred.id} hover={false}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-[0.05em] text-white/30 font-mono">
                      {cred.type}
                    </span>
                    <StatusBadge status="ok" label="Valid" />
                  </div>
                  <div className="text-xs text-white/40 mb-2">
                    Issued: {cred.issued}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cred.claims.map((claim) => (
                      <span
                        key={claim}
                        className="px-2 py-0.5 text-[10px] font-mono bg-white/[0.05] border border-white/[0.08] rounded-full text-white/50"
                      >
                        {claim}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="px-3 py-1.5 text-[11px] text-quantum-cyan/60 hover:text-quantum-cyan border border-quantum-cyan/10 rounded-[8px] transition-colors min-h-[44px]">
                    Present
                  </button>
                  <button className="px-3 py-1.5 text-[11px] text-white/40 hover:text-white/60 border border-white/10 rounded-[8px] transition-colors min-h-[44px]">
                    Verify
                  </button>
                </div>
              </div>

              <Disclosure title="SD-JWT Details" spoons={spoons} autoCollapseBelow={2}>
                <KeyString code={cred.id} label="Credential ID" truncate maxLength={32} />
                <KeyString code={cred.issuer} label="Issuer" truncate maxLength={32} className="mt-2" />
              </Disclosure>
            </GlassCard>
          ))}

          <button className="w-full py-3 border border-dashed border-white/10 rounded-[24px] text-sm text-white/30 hover:text-white/50 hover:border-white/20 transition-all min-h-[48px]">
            + Issue New Credential
          </button>
        </div>
      )}
    </div>
  );
}
