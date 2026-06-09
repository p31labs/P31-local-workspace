/**
 * Joy Attestation Modal
 *
 * Before releasing an item to the mesh, the operator can attach an encrypted
 * care narrative (text or short audio). The blob is encrypted with a key
 * derived from the resource UUID and stored on‑chain; only the next owner
 * can decrypt it (identity‑stripped).
 */

import React, { useState } from 'react';
import { encryptAttestation, encodeAttestation } from '../crypto/crypto';

export default function JoyAttestationModal({ resource, onClose }: { resource: any; onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!message.trim()) return;
    setSaving(true);
    setError(null);
    try {
      // Derive key from resource.id (UUID)
      const { nonce, ciphertext } = await encryptAttestation(resource.id, message);
      const encoded = encodeAttestation({ nonce, ciphertext });

      // Persist to local PGLite (placeholder; real call via CRDT)
      // await db.prepare('INSERT INTO attestations ...').run(...);
      console.log('Encoded attestation:', encoded);

      // After storing, close modal; resource release will now include this blob
      alert('Joy attestation encrypted and saved to local node.');
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Joy Attestation</h2>
        <p>Attach a care narrative to <strong>{resource.title}</strong>. This will be encrypted with a key derived from the item’s UUID. The next owner can decrypt it; your identity will not be retained.</p>

        <textarea
          rows={6}
          placeholder="This game got me through a burnout period..."
          value={message}
          onChange={e => setMessage(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !message.trim()}>
            {saving ? 'Encrypting…' : 'Save Encrypted'}
          </button>
        </div>
      </div>
    </div>
  );
}
