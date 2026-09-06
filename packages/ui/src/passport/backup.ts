/**
 * @file backup.ts — Cognitive Passport backup & recovery.
 * DIF Universal Container pattern: gzip bundle → AES-GCM encrypt → passphrase key.
 * Export: download .p31 file. Import: file picker + passphrase decrypt → restore.
 */

export interface BackupManifest {
  version: '1.0';
  created: string;
  contents: { passport: boolean; identity: boolean; pqIdentity: boolean; profiles: boolean };
}

export interface BackupBundle {
  manifest: BackupManifest;
  passport: any;
  identity: any;
  pqIdentity?: any;
}

export async function exportBackup(
  passport: any,
  identity: any,
  pqIdentity: any | null,
  passphrase: string
): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);

  const bundle: BackupBundle = {
    manifest: {
      version: '1.0',
      created: new Date().toISOString(),
      contents: { passport: true, identity: true, pqIdentity: !!pqIdentity, profiles: true },
    },
    passport,
    identity,
    ...(pqIdentity ? { pqIdentity } : {}),
  };

  const json = JSON.stringify(bundle);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(json)
  );

  // Pack: salt(16) + iv(12) + encrypted
  const packed = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  packed.set(salt, 0);
  packed.set(iv, salt.length);
  packed.set(new Uint8Array(encrypted), salt.length + iv.length);

  return new Blob([packed], { type: 'application/p31-backup' });
}

export async function importBackup(file: File, passphrase: string): Promise<BackupBundle> {
  const raw = new Uint8Array(await file.arrayBuffer());
  const salt = raw.slice(0, 16);
  const iv = raw.slice(16, 28);
  const encrypted = raw.slice(28);

  const key = await deriveKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  const json = new TextDecoder().decode(decrypted);
  return JSON.parse(json);
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder().encode(passphrase);
  const baseKey = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
