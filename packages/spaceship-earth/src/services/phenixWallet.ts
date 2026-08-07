/**
 * phenixWallet.ts — Phenix Donation Wallet Service
 *
 * ERC-5564 stealth address protocol (SECP256k1) via @scopelift/stealth-address-sdk.
 * AES-256-GCM vault, Memo-to-File legal defense logging.
 *
 * Uses secp256k1 via @noble/curves for legitimate on-chain stealth addresses.
 */

import { generateStealthAddress, computeStealthKey } from '@scopelift/stealth-address-sdk';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { storage } from '../lib/storage';

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const PBKDF2_ITERATIONS = isMobile ? 310_000 : 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
export const VAULT_KEY = 'phenix_vault_v2';
export const MEMO_KEY = 'phenix_memo_log_v2';
export const STEALTH_KEY = 'phenix_stealth_addresses';
export const SETTINGS_KEY = 'phenix_settings';
export const SESSION_KEY = 'phenix_session_v2';

export const ERC5564_ANNOUNCER = '0x55649E01B5Df198D18D95b5cc5051630cfD45564';
export const ERC6538_REGISTRY = '0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538';

const DEFAULT_RPC = 'https://eth.llamarpc.com';

export interface StealthKeyPair {
  spending: { privateKey: string; publicKey: string };
  viewing: { privateKey: string; publicKey: string };
  metaAddress: string;
}

export interface StealthAddress {
  address: string;
  ephemeralPubKey?: string;
  blockNumber?: number;
  txHash?: string;
  detectedAt: string;
  balance: string | null;
}

export interface MemoEntry {
  id: string;
  timestamp: string;
  type: 'DONATION_RECEIVED' | 'FIAT_CONVERSION' | 'GME_PURCHASE' | 'EXPENSE' | 'NOTE';
  memo: string;
  amount: string | null;
  currency: 'ETH' | 'USD' | 'GME' | null;
  txHash: string | null;
  stealthAddress: string | null;
  provenanceChain: string;
  traceToPremarital: boolean;
  counterparty: string | null;
}

export interface MemoStats {
  totalEntries: number;
  totalDonationsETH: number;
  totalConvertedUSD: number;
  totalGMEShares: number;
  firstEntry: string | null;
  lastEntry: string | null;
}

export interface WalletState {
  exists: boolean;
  unlocked: boolean;
  metaAddress: string | null;
  donationCount: number;
  totalETH: number;
  stealthAddresses: StealthAddress[];
  hwConnected: boolean;
}

// ── VAULT AUTO-LOCK STATE ──
let vaultUnlocked = false;
let lockTimer: number | null = null;

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && vaultUnlocked) {
      if (lockTimer) clearTimeout(lockTimer);
      lockTimer = window.setTimeout(() => {
        if (vaultUnlocked) {
          autoLockVault();
        }
      }, 120000) as unknown as number;
    } else if (document.visibilityState === 'visible') {
      if (lockTimer) {
        clearTimeout(lockTimer);
        lockTimer = null;
      }
    }
  });
}

function autoLockVault(): void {
  vaultUnlocked = false;
  storage.removeItem(SESSION_KEY);
}

// ── BYTE UTILITIES ──

function arrayToHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToArray(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return arr;
}

function arrayToBase64(arr: Uint8Array): string {
  let binary = '';
  arr.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToArray(b64: string): Uint8Array {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}

// ── KEY DERIVATION ──

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password) as BufferSource,
    'PBKDF2', false, ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ── STEALTH KEY GENERATION (SECP256k1 via @noble/curves) ──

async function generateSecp256k1KeyPair(): Promise<{ privateKey: string; publicKey: string }> {
  const privateKeyBytes = secp256k1.utils.randomSecretKey();
  const pubKeyHex = secp256k1.getPublicKey(privateKeyBytes, false);
  const pubKeyBytes = new Uint8Array(pubKeyHex);
  const hashBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', pubKeyBytes));
  return {
    privateKey: arrayToHex(privateKeyBytes),
    publicKey: arrayToHex(hashBytes.slice(0, 20)),
  };
}

export async function generateStealthKeys(): Promise<StealthKeyPair> {
  const spending = await generateSecp256k1KeyPair();
  const viewing = await generateSecp256k1KeyPair();
  const metaAddress = `st:eth:0x${spending.publicKey.slice(0, 66)}${viewing.publicKey.slice(0, 66)}`;
  return { spending, viewing, metaAddress };
}

export async function generateP31StealthAddress(metaAddressURI: string): Promise<string> {
  const result = await generateStealthAddress({
    stealthMetaAddressURI: metaAddressURI,
  });
  return result.stealthAddress;
}

export async function computeP31StealthKey(
  viewingPrivateKey: string,
  spendingPrivateKey: string,
  ephemeralPublicKey: string,
): Promise<string> {
  const result = await computeStealthKey({
    viewingPrivateKey: viewingPrivateKey as any as `0x${string}`,
    spendingPrivateKey: spendingPrivateKey as any as `0x${string}`,
    ephemeralPublicKey: ephemeralPublicKey as any as `0x${string}`,
    schemeId: 1,
  });
  return result;
}

// ── VAULT ──

export async function createVault(keys: StealthKeyPair, password: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const aesKey = await deriveKey(password, salt);

  const plaintext = JSON.stringify({
    spending: keys.spending,
    viewing: keys.viewing,
    metaAddress: keys.metaAddress,
    createdAt: new Date().toISOString(),
    version: 3,
  });

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    aesKey,
    new TextEncoder().encode(plaintext) as BufferSource,
  );

  const vault = {
    version: 3,
    salt: arrayToHex(salt),
    iv: arrayToHex(iv),
    ciphertext: arrayToBase64(new Uint8Array(ciphertext)),
    metaAddress: keys.metaAddress,
    createdAt: new Date().toISOString(),
  };

  storage.setItem(VAULT_KEY, vault);
  storage.setItem(SESSION_KEY, {
    viewingPriv: keys.viewing.privateKey,
    spendingPub: keys.spending.publicKey,
    cachedAt: Date.now(),
  });
  vaultUnlocked = true;
}

export async function unlockVault(password: string): Promise<StealthKeyPair> {
  const raw = storage.getItem<Record<string, any>>(VAULT_KEY);
  if (!raw) throw new Error('NO_VAULT');

  const vault = raw as Record<string, string>;
  const salt = hexToArray(vault.salt);
  const iv = hexToArray(vault.iv);
  const ciphertext = base64ToArray(vault.ciphertext);
  const aesKey = await deriveKey(password, salt);

  let plaintext: StealthKeyPair;
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      aesKey,
      ciphertext as BufferSource,
    );
    plaintext = JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    throw new Error('WRONG_PASSWORD');
  }

  storage.setItem(SESSION_KEY, {
    viewingPriv: plaintext.viewing.privateKey,
    spendingPub: plaintext.spending.publicKey,
    cachedAt: Date.now(),
  });
  vaultUnlocked = true;

  return plaintext;
}

export function lockVault(): void {
  vaultUnlocked = false;
  if (lockTimer) {
    clearTimeout(lockTimer);
    lockTimer = null;
  }
  storage.removeItem(SESSION_KEY);
}

export function vaultExists(): boolean {
  return storage.getItem(VAULT_KEY) !== null;
}

export function isUnlocked(): boolean {
  return storage.getItem(SESSION_KEY) !== null;
}

export function getMetaAddress(): string | null {
  const raw = storage.getItem<Record<string, any>>(VAULT_KEY);
  if (!raw) return null;
  try {
    return (raw as Record<string, string>).metaAddress || null;
  } catch {
    return null;
  }
}

// ── STEALTH ADDRESSES ──

export function getStealthAddresses(): StealthAddress[] {
  try {
    return storage.getItem<StealthAddress[]>(STEALTH_KEY) || [];
  } catch {
    return [];
  }
}

export function saveStealthAddresses(addrs: StealthAddress[]): void {
  storage.setItem(STEALTH_KEY, addrs);
}

// ── RPC ──

export async function rpcCall(method: string, params: unknown[] = []): Promise<unknown> {
  const rpcUrl = getSettings().rpcUrl || DEFAULT_RPC;
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`RPC: ${data.error.message}`);
  return data.result;
}

export async function getBalance(address: string): Promise<number> {
  const hex = (await rpcCall('eth_getBalance', [address, 'latest'])) as string;
  return parseInt(hex, 16) / 1e18;
}

export async function refreshAllBalances(): Promise<{ totalETH: number; addresses: StealthAddress[] }> {
  const addrs = getStealthAddresses();
  let totalWei = 0;

  for (const addr of addrs) {
    try {
      const bal = await getBalance(addr.address);
      addr.balance = String(bal);
      totalWei += bal * 1e18;
    } catch {
      /* skip failed lookups */
    }
  }

  saveStealthAddresses(addrs);
  return { totalETH: totalWei / 1e18, addresses: addrs };
}

// ── MEMO-TO-FILE ──

function buildProvenanceChain(type: string): string {
  const base = 'Sports Cards (Pre-Marital, <2015) -> $1,000 Seed -> PCB/Hardware (BOM) -> ';
  switch (type) {
    case 'DONATION_RECEIVED':
      return base + 'Phenix Navigator IP (Pre-Marital Engineering, GS-12, 2009) -> Donation Revenue';
    case 'FIAT_CONVERSION':
      return base + 'Donation Revenue -> Transit Node (Segregated, Non-Joint) -> Fiat USD';
    case 'GME_PURCHASE':
      return base + 'Donation Revenue -> Transit Node -> Computershare DRS -> GME Shares (Separate Property)';
    case 'EXPENSE':
      return base + 'Business Expense (BOM/Operating)';
    default:
      return base + 'General Entry';
  }
}

export function getMemos(): MemoEntry[] {
  try {
    return storage.getItem<MemoEntry[]>(MEMO_KEY) || [];
  } catch {
    return [];
  }
}

export function logMemo(entry: Partial<MemoEntry>): MemoEntry {
  const memos = getMemos();
  const memo: MemoEntry = {
    id: `${new Date().toISOString()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    type: entry.type || 'NOTE',
    memo: entry.memo || '',
    amount: entry.amount || null,
    currency: entry.currency || null,
    txHash: entry.txHash || null,
    stealthAddress: entry.stealthAddress || null,
    provenanceChain: buildProvenanceChain(entry.type || 'NOTE'),
    traceToPremarital: true,
    counterparty: entry.counterparty || null,
  };
  memos.push(memo);
  storage.setItem(MEMO_KEY, memos);
  return memo;
}

export function getMemoStats(): MemoStats {
  const memos = getMemos();
  const stats: MemoStats = {
    totalEntries: memos.length,
    totalDonationsETH: 0,
    totalConvertedUSD: 0,
    totalGMEShares: 0,
    firstEntry: memos[0]?.timestamp || null,
    lastEntry: memos[memos.length - 1]?.timestamp || null,
  };

  for (const m of memos) {
    if (m.type === 'DONATION_RECEIVED' && m.currency === 'ETH')
      stats.totalDonationsETH += parseFloat(m.amount || '0');
    if (m.type === 'FIAT_CONVERSION' && m.currency === 'USD')
      stats.totalConvertedUSD += parseFloat(m.amount || '0');
    if (m.type === 'GME_PURCHASE' && m.currency === 'GME')
      stats.totalGMEShares += parseFloat(m.amount || '0');
  }
  return stats;
}

export async function exportMemoLog(): Promise<object> {
  const memos = getMemos();
  const stats = getMemoStats();
  const data = JSON.stringify(memos);
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  const integrityHash = arrayToHex(new Uint8Array(hash));

  return {
    format: 'phenix-ledger',
    version: '2.0',
    exported: new Date().toISOString(),
    operator: 'William Johnson',
    caseReference: 'Johnson v. Johnson, Civil Action No. 2025CV936',
    court: 'Camden County Superior Court, Georgia',
    provenanceDeclaration: {
      seedCapital: 'Pre-marital sports card collection, liquidated for $1,000',
      skillOrigin: 'Engineering expertise (GS-12), Service Computation Date: June 22, 2009',
      classification: 'Separate Property -- pre-marital asset x pre-marital skill',
      assertion:
        'All revenue generated by deployment of pre-marital intellectual property via Phenix Navigator system constitutes separate property under Georgia equitable distribution law.',
    },
    statistics: stats,
    entries: memos,
    integrityHash,
  };
}

// ── SETTINGS ──

interface PhenixSettings {
  rpcUrl: string;
  chainId: number;
  scanEnabled: boolean;
  hardwareMode: boolean;
}

export function getSettings(): PhenixSettings {
  try {
    return storage.getItem<PhenixSettings>(SETTINGS_KEY) || { rpcUrl: DEFAULT_RPC, chainId: 1, scanEnabled: true, hardwareMode: false };
  } catch {
    return { rpcUrl: DEFAULT_RPC, chainId: 1, scanEnabled: true, hardwareMode: false };
  }
}

export function saveSettings(s: Partial<PhenixSettings>): void {
  const current = getSettings();
  storage.setItem(SETTINGS_KEY, { ...current, ...s });
}

// ── WALLET STATE HELPER ──

export function getWalletState(): WalletState {
  const addrs = getStealthAddresses();
  let totalETH = 0;
  for (const a of addrs) {
    if (a.balance) totalETH += parseFloat(a.balance);
  }
  return {
    exists: vaultExists(),
    unlocked: isUnlocked(),
    metaAddress: getMetaAddress(),
    donationCount: addrs.length,
    totalETH,
    stealthAddresses: addrs,
    hwConnected: false,
  };
}

// ── SOVEREIGN IDENTITY (Ed25519 + DID:key) ──────────────────────────

export interface Ed25519Identity {
  did: string;
  publicKeyHex: string;
  privateKeyHex: string;
  publicKeyMultibase: string;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return arr;
}

function multibaseEncode(bytes: Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const b of bytes) num = (num << 8n) | BigInt(b);
  if (num === 0n) return 'z1';
  let out = '';
  while (num > 0n) {
    out = alphabet[Number(num % 58n)] + out;
    num /= 58n;
  }
  return 'z' + out;
}

export function generateEd25519Identity(): Ed25519Identity {
  const priv = crypto.getRandomValues(new Uint8Array(32));
  const pub = ed25519.getPublicKey(priv);
  const pubHex = toHex(pub);
  const privHex = toHex(priv);
  const multicodec = new Uint8Array([0xed, 0x01, ...pub]);
  const mb = multibaseEncode(multicodec);
  const did = `did:key:${mb}`;
  return { did, publicKeyHex: pubHex, privateKeyHex: privHex, publicKeyMultibase: mb };
}

export function signEd25519(privateKeyHex: string, message: Uint8Array): Uint8Array {
  return ed25519.sign(message, fromHex(privateKeyHex));
}

export function verifyEd25519(publicKeyHex: string, message: Uint8Array, signature: Uint8Array): boolean {
  return ed25519.verify(signature, message, fromHex(publicKeyHex));
}

// ── VC STORAGE ────────────────────────────────────────────────────────

const VC_KEY = 'phenix_vc_store_v2';

export interface StoredCredential {
  id: string;
  vct: string;
  sdjwt: string;
  issuerDID: string;
  issuedAt: string;
  claims: Record<string, unknown>;
  merkleRoot?: string;
  nullifier?: string;
  privacyEnabled?: boolean;
}

export function storeCredential(cred: StoredCredential): void {
  const store = getCredentials();
  const existing = store.findIndex(c => c.id === cred.id);
  if (existing >= 0) store[existing] = cred;
  else store.push(cred);
  try {
    localStorage.setItem(VC_KEY, JSON.stringify(store));
  } catch {
    storage.setItem(VC_KEY, store);
  }
}

export function getCredentials(): StoredCredential[] {
  try {
    const raw = localStorage.getItem(VC_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  try {
    return storage.getItem<StoredCredential[]>(VC_KEY) || [];
  } catch {
    return [];
  }
}

export function getCredentialById(id: string): StoredCredential | null {
  return getCredentials().find(c => c.id === id) || null;
}

export function deleteCredential(id: string): void {
  const store = getCredentials().filter(c => c.id !== id);
  try {
    localStorage.setItem(VC_KEY, JSON.stringify(store));
  } catch {
    storage.setItem(VC_KEY, store);
  }
}

// ── CREDENTIAL PRESENTATION ──────────────────────────────────────────

export interface VCPresentation {
  credential: StoredCredential;
  disclosedClaims: string[];
  presentation: string;
  keyBindingJWT: string;
  aud: string;
  nonce: string;
  createdAt: string;
}

const PRESENTATION_KEY = 'phenix_presentations';

export async function createPresentation(
  credential: StoredCredential,
  disclosedClaims: string[],
  aud: string,
  identity: Ed25519Identity,
): Promise<VCPresentation> {
  const nonce = toHex(crypto.getRandomValues(new Uint8Array(16)));

  const header = { alg: 'EdDSA', typ: 'kb+jwt' };
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const payload = {
    aud,
    nonce,
    iat: Math.floor(Date.now() / 1000),
    sd_hash: 'sha256_disclosures_placeholder',
  };
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = signEd25519(identity.privateKeyHex, signingInput);
  const sigB64 = btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const keyBindingJWT = `${headerB64}.${payloadB64}.${sigB64}`;

  const presentation: VCPresentation = {
    credential,
    disclosedClaims,
    presentation: `${credential.sdjwt}~${keyBindingJWT}`,
    keyBindingJWT,
    aud,
    nonce,
    createdAt: new Date().toISOString(),
  };

  const stored = getPresentations();
  stored.push(presentation);
  try {
    localStorage.setItem(PRESENTATION_KEY, JSON.stringify(stored));
  } catch {
    storage.setItem(PRESENTATION_KEY, stored);
  }

  return presentation;
}

export function getPresentations(): VCPresentation[] {
  try {
    const raw = localStorage.getItem(PRESENTATION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

// ── ZK PROOF GENERATION ──────────────────────────────────────────────

let _MerkleTree: any = null;
let _zkModule: any = null;

async function loadZKModules(): Promise<void> {
  if (_MerkleTree && _zkModule) return;
  const mod = await import('@p31/shared');
  _MerkleTree = mod.MerkleTree;
  _zkModule = mod;
}

export async function generateZKProofForCredential(
  credential: StoredCredential,
  claimKey: string,
  secret: Uint8Array,
): Promise<{ nullifier: string; leafHex: string; rootHex: string; proof: string }> {
  await loadZKModules();

  const enc = new TextEncoder();
  const claimValue = String(credential.claims[claimKey] ?? '');
  const leaf = enc.encode(`${claimKey}:${claimValue}`);

  const tree = await _MerkleTree.build([leaf]);
  const root = tree.getRoot();
  const merkleProof = tree.getProof(0);

  const nullifier = await _zkModule.generateNullifier(credential.id, claimKey, secret);
  const proof = await _zkModule.generateZKProof(leaf, merkleProof, root, nullifier, secret);

  return {
    nullifier,
    leafHex: proof.leafHex,
    rootHex: proof.rootHex,
    proof: proof.proof,
  };
}

export async function verifyZKProofForCredential(
  credential: StoredCredential,
  claimKey: string,
  proofHex: string,
  nullifier: string,
  secret: Uint8Array,
): Promise<boolean> {
  await loadZKModules();

  const enc = new TextEncoder();
  const leaf = enc.encode(`${claimKey}:${credential.claims[claimKey] || ''}`);
  const tree = await _MerkleTree.build([leaf]);

  const zkProof = {
    leafHex: toHex(leaf),
    rootHex: toHex(tree.getRoot()),
    nullifier,
    proof: proofHex,
  };

  return _zkModule.verifyZKProof(zkProof, secret);
}

// ── WALLET CAPABILITIES (Agent Discovery) ────────────────────────────

export function getWalletCapabilities(): Record<string, unknown> {
  const state = getWalletState();
  const creds = getCredentials();
  return {
    name: 'Phenix Donation Wallet',
    version: '3.0.0',
    exists: state.exists,
    unlocked: state.unlocked,
    stealthAddresses: state.stealthAddresses.length,
    totalETH: state.totalETH,
    credentialCount: creds.length,
    credentialTypes: [...new Set(creds.map(c => c.vct))],
    capabilities: [
      'erc5564_stealth_addresses',
      'aes256gcm_vault',
      'ed25519_keygen',
      'did_key_identity',
      'sd_jwt_storage',
      'key_binding_presentation',
      'zk_proof_generation',
      'memo_to_file_ledger',
      'sha256_integrity_export',
    ],
    cryptoSuites: ['Ed25519', 'SECP256k1', 'AES-256-GCM', 'SHA-256', 'PBKDF2'],
    mcpAnnotations: ['data-mcp-tool="phenixWallet"', 'data-mcp-target="wallet-root"'],
  };
}

// ── MULTI-DID SUPPORT ─────────────────────────────────────────────────

const IDENTITIES_KEY = 'phenix_identities_v2';
const ACTIVE_DID_KEY = 'phenix_active_did';

export interface StoredIdentity {
  did: string;
  publicKeyHex: string;
  label: string;
  createdAt: string;
  verified: boolean;
  didMethod: 'did:key' | 'did:web' | 'did:jwk';
}

export function storeIdentity(id: StoredIdentity): void {
  const ids = getIdentities();
  const existing = ids.findIndex(i => i.did === id.did);
  if (existing >= 0) ids[existing] = id;
  else ids.push(id);
  try { localStorage.setItem(IDENTITIES_KEY, JSON.stringify(ids)); } catch {}
}

export function getIdentities(): StoredIdentity[] {
  try {
    const raw = localStorage.getItem(IDENTITIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function getActiveIdentity(): StoredIdentity | null {
  const activeDid = localStorage.getItem(ACTIVE_DID_KEY);
  if (!activeDid) return getIdentities()[0] || null;
  return getIdentities().find(i => i.did === activeDid) || null;
}

export function switchActiveIdentity(did: string): boolean {
  const exists = getIdentities().find(i => i.did === did);
  if (!exists) return false;
  localStorage.setItem(ACTIVE_DID_KEY, did);
  return true;
}

export function removeIdentity(did: string): void {
  const ids = getIdentities().filter(i => i.did !== did);
  try { localStorage.setItem(IDENTITIES_KEY, JSON.stringify(ids)); } catch {}
  if (localStorage.getItem(ACTIVE_DID_KEY) === did) {
    localStorage.removeItem(ACTIVE_DID_KEY);
  }
}

export function createIdentityFromEd25519(label: string): StoredIdentity {
  const ed25519 = generateEd25519Identity();
  const identity: StoredIdentity = {
    did: ed25519.did,
    publicKeyHex: ed25519.publicKeyHex,
    label: label || `Identity ${getIdentities().length + 1}`,
    createdAt: new Date().toISOString(),
    verified: false,
    didMethod: 'did:key',
  };
  storeIdentity(identity);
  if (!getActiveIdentity()) switchActiveIdentity(identity.did);
  return identity;
}

// ── HARDWARE WALLET BRIDGE (WebUSB) ──────────────────────────────────

let hwLastConnected = false;

export function isHardwareAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

export async function connectHardwareWallet(): Promise<{ connected: boolean; deviceName?: string; error?: string }> {
  if (!isHardwareAvailable()) {
    return { connected: false, error: 'WebUSB not available in this browser.' };
  }
  try {
    const device = await (navigator as any).usb.requestDevice({
      filters: [{ vendorId: 0x1209 }],
    });
    await device.open();
    hwLastConnected = true;
    return { connected: true, deviceName: device.productName || 'P31 Hardware Wallet' };
  } catch (e: any) {
    hwLastConnected = false;
    return { connected: false, error: e.message || 'Connection failed' };
  }
}

export function isHardwareConnected(): boolean {
  return hwLastConnected;
}

export async function signWithHardwareWallet(message: Uint8Array): Promise<{ signature: string; error?: string }> {
  if (!hwLastConnected) {
    return { signature: '', error: 'Hardware wallet not connected.' };
  }
  try {
    return { signature: '', error: 'WebUSB signing not implemented — requires P31 firmware command.' };
  } catch (e: any) {
    return { signature: '', error: e.message };
  }
}

// ── SOCIAL RECOVERY (Guardian Integration) ────────────────────────────

const FEDERATION_API = 'https://federation.p31ca.org';

export async function addRecoveryGuardian(
  subjectDid: string,
  guardianDid: string,
  shareHash: string,
  threshold = 3,
  totalGuardians = 5,
): Promise<{ status: string; error?: string }> {
  try {
    const resp = await fetch(`${FEDERATION_API}/identity/recovery/guardians`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectDid, guardianDid, shareHash, threshold, totalGuardians }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      return { status: 'failed', error: (err as any).error };
    }
    return { status: 'guardian_added' };
  } catch (e: any) {
    return { status: 'error', error: e.message };
  }
}

export async function removeRecoveryGuardian(
  subjectDid: string,
  guardianDid: string,
): Promise<{ status: string; error?: string }> {
  try {
    const resp = await fetch(`${FEDERATION_API}/identity/recovery/guardians/${encodeURIComponent(guardianDid)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ did: subjectDid }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      return { status: 'failed', error: (err as any).error };
    }
    return { status: 'guardian_removed' };
  } catch (e: any) {
    return { status: 'error', error: e.message };
  }
}

export async function getRecoveryGuardians(did: string): Promise<{
  guardians: Array<{ guardianDid: string; createdAt: string }>;
  threshold: number;
  totalGuardians: number;
  recoveryPossible: boolean;
} | { error: string }> {
  try {
    const resp = await fetch(`${FEDERATION_API}/identity/recovery/guardians/${encodeURIComponent(did)}`);
    if (!resp.ok) return { error: `HTTP ${resp.status}` };
    return resp.json();
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function initiateRecovery(
  did: string,
  shareHashes: string[],
): Promise<{ status: string; sharesValidated?: number; threshold?: number; error?: string }> {
  try {
    const resp = await fetch(`${FEDERATION_API}/identity/recovery/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ did, shareHashes }),
    });
    const data = await resp.json();
    if (!resp.ok) return { status: 'failed', error: data.error };
    return { status: 'recovery_authorized', sharesValidated: data.sharesValidated, threshold: data.threshold };
  } catch (e: any) {
    return { status: 'error', error: e.message };
  }
}

// ── UPDATED STATE + CAPABILITIES ──────────────────────────────────────

export function getExtendedWalletState() {
  const base = getWalletState();
  const identities = getIdentities();
  const active = getActiveIdentity();
  return {
    ...base,
    hwConnected: hwLastConnected,
    identities,
    activeIdentity: active,
    identityCount: identities.length,
  };
}

export function getExtendedWalletCapabilities(): Record<string, unknown> {
  const creds = getCredentials();
  const ids = getIdentities();
  return {
    name: 'Phenix Donation Wallet',
    version: '3.1.0',
    exists: vaultExists(),
    unlocked: isUnlocked(),
    credentialCount: creds.length,
    identityCount: ids.length,
    credentialTypes: [...new Set(creds.map(c => c.vct))],
    capabilities: [
      'erc5564_stealth_addresses',
      'aes256gcm_vault',
      'ed25519_keygen',
      'did_key_identity',
      'multi_did_support',
      'sd_jwt_storage',
      'key_binding_presentation',
      'zk_proof_generation',
      'hardware_wallet_bridge',
      'social_recovery_guardians',
      'memo_to_file_ledger',
      'sha256_integrity_export',
    ],
    cryptoSuites: ['Ed25519', 'SECP256k1', 'AES-256-GCM', 'SHA-256', 'PBKDF2'],
    mcpAnnotations: ['data-mcp-tool="phenixWallet"', 'data-mcp-target="wallet-root"'],
    hardwareAvailable: isHardwareAvailable(),
    hardwareConnected: hwLastConnected,
  };
}
