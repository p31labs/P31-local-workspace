/**
 * @file PassportSurface — Real sovereign Cognitive Passport viewer.
 *
 * Replaces the old fake surface (which minted random hex → fake did:key). Now
 * reads the real Ed25519 identity + passport from IndexedDB via @p31ca/ui/passport,
 * shows the deterministic face, DID, public key, and offers export/import/reset.
 * If no passport exists, it shows the onboarding generator.
 */

import { useState, useEffect } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';
import { usePassport, passportFace } from '@p31ca/ui/passport';
import { emitAlert } from '@p31ca/ui/alerts';
import { exportBackup, importBackup } from '@p31ca/ui/passport/backup';
import { generateMLDSA65Identity, loadMLDSA65Identity } from '@p31ca/ui/passport/pqc';
import { generateDIDDocument, exportDIDDocumentJSON } from '@p31ca/ui/passport/did-document';
import { saveCredential, listCredentials, type StoredCredential } from '@p31ca/ui/passport/store';
import { exportEUDIWallet, serializeEUDIWallet } from '@p31ca/ui/passport/eudi';
import { PassportGenerator } from './PassportGenerator';

export function PassportSurface() {
  const { status, passport, identity, exportJson, importJson, reset } = usePassport();
  const [importText, setImportText] = useState('');
  const [pqcCreds, setPqcCreds] = useState<StoredCredential[]>([]);
  const [txHistory, setTxHistory] = useState<Array<{ amount: string; type: string; timestamp: string }>>([]);

  useEffect(() => {
    localStorage.setItem('passport_created', Date.now().toString());
    listCredentials().then(setPqcCreds);
    fetch('https://gateway.p31ca.org/api/love/transactions/' + (passport?.did || ''))
      .then(r => r.ok ? r.json() : [])
      .then(setTxHistory)
      .catch(() => {});
  }, [passport?.did]);

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <GlassCard className="p-6 text-center text-cloud/50">Loading your passport…</GlassCard>
      </div>
    );
  }

  if (status === 'empty' || !passport) {
    return <PassportGenerator />;
  }

  const face = passport.face || passportFace(passport.did);
  const name = passport.identity.displayName || 'Operator';

  const handleExport = async () => {
    const json = await exportJson();
    if (!json) return;
    navigator.clipboard?.writeText(json).catch(() => {});
    emitAlert('Passport copied to clipboard (JSON).', 'success');
  };

  const handleImport = async () => {
    try {
      await importJson(importText);
      emitAlert('Passport imported.', 'success');
      setImportText('');
    } catch {
      emitAlert('Invalid passport bundle.', 'error');
    }
  };

  const handleReset = async () => {
    if (!confirm('Wipe your local passport and keys? This cannot be undone.')) return;
    await reset();
    emitAlert('Passport wiped from this device.', 'warning');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="passportSurface" data-mcp-state={status}>
      <GlassCard className="p-6 flex items-center gap-5">
        <div
          className="w-20 h-20 rounded-full overflow-hidden border border-quantum-cyan/30 shrink-0"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: face }}
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech truncate">{name}</h1>
          {passport.identity.pronouns && <p className="text-cloud/60 text-sm">{passport.identity.pronouns}</p>}
          {passport.identity.oneLiner && <p className="text-ink text-sm mt-1">{passport.identity.oneLiner}</p>}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-ink mb-3">Decentralized Identity</h2>
        <div className="p-3 rounded-xl bg-void-surface border border-white/[0.06]">
          <p className="text-xs text-cloud/40 mb-1">DID</p>
          <p className="text-sm text-quantum-cyan font-mono-tech break-all">{passport.did}</p>
        </div>
        {passport.publicKey && (
          <div className="p-3 mt-3 rounded-xl bg-void-surface border border-white/[0.06]">
            <p className="text-xs text-cloud/40 mb-1">Public key (Ed25519, base64url)</p>
            <p className="text-xs text-cloud/60 font-mono-tech break-all">{passport.publicKey}</p>
          </div>
        )}
        {identity && (
          <p className="text-xs text-quantum-green font-mono-tech mt-3">🔒 Private key stored locally (IndexedDB).</p>
        )}
      </GlassCard>

      {passport.cognition && (passport.cognition.strengths?.length || passport.cognition.challenges?.length) && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-ink mb-3">Cognition</h2>
          {passport.cognition.strengths?.length ? (
            <Section title="Strengths" items={passport.cognition.strengths} />
          ) : null}
          {passport.cognition.challenges?.length ? (
            <Section title="Challenges" items={passport.cognition.challenges} />
          ) : null}
        </GlassCard>
      )}

      {/* LOVE Transaction History */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-ink mb-3">LOVE Economy</h2>
        {txHistory.length === 0 ? (
          <p className="text-cloud/50 text-sm">No LOVE transactions yet.</p>
        ) : (
          <div className="max-h-40 overflow-y-auto space-y-2">
            {txHistory.map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-white/[0.04] text-sm">
                <span className="text-cloud/70">{tx.type}</span>
                <span className={tx.amount.startsWith('-') ? 'text-quantum-rose' : 'text-quantum-green'}>{tx.amount}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6 space-y-3">
        <h2 className="text-lg font-semibold text-ink mb-1">Manage</h2>

        {/* Backup + Recovery */}
        <GlowButton color="green" onClick={async () => {
          if (!passport || !identity) return;
          const passphrase = prompt('Enter a passphrase to encrypt your backup:');
          if (!passphrase) return;
          try {
            const pqId = await loadMLDSA65Identity();
            const blob = await exportBackup(passport, identity, pqId, passphrase);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `p31-passport-${Date.now()}.p31`;
            a.click(); URL.revokeObjectURL(url);
            emitAlert('Backup saved — keep your .p31 file and passphrase safe.', 'success');
          } catch { emitAlert('Backup failed. Try again.', 'error'); }
        }} className="w-full">
          💾 Download Backup (.p31)
        </GlowButton>

        <div>
          <input type="file" accept=".p31" id="p31-restore" style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              const passphrase = prompt('Enter your backup passphrase:');
              if (!passphrase) return;
              try {
                const bundle = await importBackup(file, passphrase);
                await importJson(JSON.stringify(bundle.passport));
                emitAlert('Passport restored — identity recovered.', 'success');
              } catch { emitAlert('Restore failed — wrong passphrase or corrupt file.', 'error'); }
            }}
          />
          <GlowButton variant="ghost" onClick={() => document.getElementById('p31-restore')?.click()} className="w-full" data-mcp-tool="restorePassport" data-mcp-type="action" data-mcp-target="restore-passport">
            📂 Restore from Backup
          </GlowButton>
        </div>

        {/* PQC Identity */}
        <GlowButton color="violet" onClick={async () => {
          try {
            const pqId = await generateMLDSA65Identity();
            emitAlert(`PQC Identity generated — did:key:z${pqId.did.slice(0, 20)}...`, 'success');
          } catch { emitAlert('PQC generation failed. Try again or check console.', 'error'); }
        }} className="w-full">
          🔐 Generate PQC Identity (ML-DSA-65)
        </GlowButton>

        {/* Issue PQC Credential */}
        <GlowButton color="violet" onClick={async () => {
          if (!passport || !identity) return;
          const pqId = await loadMLDSA65Identity();
          if (!pqId) { emitAlert('Generate a PQC identity first.', 'warning'); return; }
          try {
            const res = await fetch('https://ledger-bridge.trimtab-signal.workers.dev/credential/issue-pqc', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                did: passport.did,
                publicKey: Array.from(pqId.publicKey),
                secretKey: Array.from(pqId.secretKey),
                claims: { displayName: passport.identity.displayName || 'Anonymous' },
              }),
            });
            if (!res.ok) throw new Error('issuance-failed');
            const data = await res.json();
            await saveCredential({
              did: passport.did,
              credential: data.credential,
              issuedAt: new Date().toISOString(),
              algorithm: 'ML-DSA-65',
            });
            setPqcCreds(await listCredentials());
            emitAlert('PQC Credential issued and stored locally.', 'success');
          } catch { emitAlert('PQ credential issuance failed.', 'error'); }
        }} className="w-full">
          📜 Issue PQC Credential
        </GlowButton>

        {/* DID Document */}
        <GlowButton color="gold" onClick={async () => {
          if (!identity) return;
          const pqId = await loadMLDSA65Identity();
          const doc = generateDIDDocument(identity.did, identity.publicKey, pqId?.did, pqId?.publicKey as any);
          const json = exportDIDDocumentJSON(doc);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'did-document.json'; a.click(); URL.revokeObjectURL(url);
          emitAlert('DID Document exported — W3C DID Core v1.0 compliant.', 'info');
        }} className="w-full">
          📄 Export DID Document
        </GlowButton>

        {/* EUDI Wallet Export */}
        <GlowButton color="gold" onClick={async () => {
          if (!passport || !identity) return;
          try {
            const wallet = await exportEUDIWallet(passport, identity);
            const json = serializeEUDIWallet(wallet);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `eudi-wallet-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
            emitAlert('EUDI Wallet export downloaded — compatible with EUDI Wallet Reference Implementation.', 'success');
          } catch { emitAlert('EUDI export failed.', 'error'); }
        }} className="w-full">
          🌍 Export EUDI Wallet
        </GlowButton>

        <GlowButton color="gold" onClick={async () => {
          if (!passport) return;
          try {
            const body = {
              did: passport.did,
              profile: {
                identity: passport.identity,
                cognition: passport.cognition,
                baselineSpoons: (passport as any).baselineSpoons ?? 3,
              },
            };
            const res = await fetch('https://intent-resolver.trimtab-signal.workers.dev/profile', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('sync-failed');
            emitAlert('Profile synced — cognitive profile uploaded to PASSPORT_KV.', 'success');
          } catch { emitAlert('Sync failed — intent-resolver unreachable.', 'error'); }
        }} className="w-full">
          ☁️ Sync Profile to Edge
        </GlowButton>

        {/* Mint SBT */}
        <GlowButton color="gold" onClick={async () => {
          if (!passport) return;
          const eth = prompt('Enter your ETH address (Base Sepolia) to mint your soulbound token:');
          if (!eth || !eth.match(/^0x[a-fA-F0-9]{40}$/)) { emitAlert('Invalid ETH address.', 'error'); return; }
          try {
            const res = await fetch('https://ledger-bridge.trimtab-signal.workers.dev/sbt/mint', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ did: passport.did, ethAddress: eth }),
            });
            if (!res.ok) throw new Error('mint-failed');
            const data = await res.json();
            emitAlert(data.dryRun ? `SBT mint calldata ready (dry-run) — ${data.data?.slice(0, 20)}…` : `SBT minted! Tx: ${data.txHash?.slice(0, 20)}…`, data.dryRun ? 'info' : 'success');
          } catch { emitAlert('SBT mint failed. Check your ETH address and try again.', 'error'); }
        }} className="w-full">
          🏅 Mint Soulbound SBT (ERC-5192)
        </GlowButton>

        <GlowButton color="cyan" onClick={handleExport} className="w-full" data-mcp-tool="exportPassport" data-mcp-type="action" data-mcp-target="export-passport">Export passport (copy JSON)</GlowButton>
        <details className="text-sm">
          <summary className="cursor-pointer text-cloud/70 hover:text-ink">Import from another device</summary>
          <textarea
            className="w-full mt-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-ink outline-none focus:border-quantum-cyan/40"
            data-mcp-tool="importPassport" data-mcp-type="input" data-mcp-target="import-textarea"
            rows={4}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste passport JSON bundle…"
          />
          <GlowButton variant="ghost" onClick={handleImport} className="w-full mt-2" disabled={!importText.trim()}>
            Import
          </GlowButton>
        </details>
        <GlowButton variant="ghost" onClick={handleReset} className="w-full text-quantum-rose border-quantum-rose/30" data-mcp-tool="resetPassport" data-mcp-type="action" data-mcp-target="reset-passport">
          Reset passport
        </GlowButton>
      </GlassCard>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mb-3">
      <p className="text-xs text-cloud/50 font-mono-tech mb-1">{title}</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((it) => (
          <li key={it} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-ink">{it}</li>
        ))}
      </ul>
    </div>
  );
}
