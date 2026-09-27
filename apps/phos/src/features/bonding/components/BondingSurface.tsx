import { useState } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';

interface Contact {
  id: string;
  name: string;
  relationship: string;
  did: string;
  trustLevel: number;
  lastContact: number;
}

const sampleContacts: Contact[] = [
  { id: '1', name: 'Sarah', relationship: 'Care partner', did: 'did:key:z6Mk...a1b2', trustLevel: 5, lastContact: Date.now() - 3600000 },
  { id: '2', name: 'Dr. Chen', relationship: 'Therapist', did: 'did:key:z6Mk...c3d4', trustLevel: 4, lastContact: Date.now() - 86400000 },
  { id: '3', name: 'Mom', relationship: 'Family', did: 'did:key:z6Mk...e5f6', trustLevel: 5, lastContact: Date.now() - 172800000 },
];

export function BondingSurface() {
  const [contacts] = useState<Contact[]>(() => {
    try { return JSON.parse(localStorage.getItem('phos:contacts') || 'null') || sampleContacts; }
    catch { return sampleContacts; }
  });
  const [selected, setSelected] = useState<Contact | null>(null);

  const trustColor = (level: number) => {
    if (level >= 4) return 'text-quantum-green';
    if (level >= 2) return 'text-quantum-gold';
    return 'text-red-400';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="bondingSurface" data-mcp-state={selected ? selected.id : 'none'}>
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Bonding</h1>
        <p className="text-cloud/50 text-sm">Your trust network and care relationships.</p>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Trust Network ({contacts.length})</h2>
        <div className="space-y-2">
          {contacts.map(c => (
            <button
              key={c.id}
              onClick={() => setSelected(selected?.id === c.id ? null : c)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected?.id === c.id
                  ? 'bg-quantum-cyan/5 border-quantum-cyan/20'
                  : 'bg-void-surface/50 border-white/[0.04] hover:border-white/[0.08]'
              }`}
              data-mcp-tool="selectBond"
              data-mcp-target={`contact-${c.id}`}
              data-mcp-state={selected?.id === c.id ? 'selected' : 'unselected'}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-quantum-cyan/10 border border-quantum-cyan/20 flex items-center justify-center text-quantum-cyan font-bold text-sm">
                  {c.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-ink font-semibold">{c.name}</p>
                  <p className="text-xs text-cloud/40">{c.relationship}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-mono-tech ${trustColor(c.trustLevel)}`}>
                    Trust: {c.trustLevel}/5
                  </p>
                  <p className="text-xs text-cloud/30 font-mono-tech">
                    {new Date(c.lastContact).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      {selected && (
        <GlassCard className="p-6" strong>
          <h2 className="text-lg font-semibold text-ink mb-3">{selected.name}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-cloud/40">Relationship</span>
              <span className="text-ink">{selected.relationship}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cloud/40">DID</span>
              <span className="text-quantum-cyan font-mono-tech text-xs">{selected.did}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cloud/40">Trust Level</span>
              <span className={trustColor(selected.trustLevel)}>{selected.trustLevel}/5</span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
             <GlowButton color="cyan" size="sm" className="flex-1" data-mcp-tool="requestAttestation" data-mcp-type="action">Request Attestation</GlowButton>
             <GlowButton color="violet" size="sm" className="flex-1" data-mcp-tool="messageContact" data-mcp-type="action">Message</GlowButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
