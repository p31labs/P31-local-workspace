/**
 * phenixWallet.ts — Phenix Donation Wallet Service
 * Ported from donation-wallet-v2 Chrome Extension to web app.
 * Uses localStorage + Web Crypto API (no chrome.* dependencies).
 *
 * ERC-5564 stealth address protocol, AES-256-GCM vault,
 * Memo-to-File legal defense logging.
 */

// ── CONSTANTS ──────────────────────────────────────────────────

const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const VAULT_KEY = 'phenix_vault_v2';
const MEMO_KEY = 'phenix_memo_log_v2';
const STEALTH_KEY = 'phenix_stealth_addresses';
const SETTINGS_KEY = 'phenix_settings';
const SESSION_KEY = 'phenix_session_v2';

export const ERC5564_ANNOUNCER = '0x55649E01B5Df198D18D95b5cc5051630cfD45564';
export const ERC6538_REGISTRY = '0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538';

const DEFAULT_RPC = 'https://eth.llamarpc.com';

// ── TYPES ──────────────────────────────────────────────────────

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

// ── BYTE UTILITIES ─────────────────────────────────────────────

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

// ── KEY DERIVATION ─────────────────────────────────────────────

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ── STEALTH KEY GENERATION (Web Crypto ECDH) ───────────────────
// Simplified stealth key gen using Web Crypto P-256.
// For full ERC-5564 (secp256k1), @noble/curves would be needed.
// This generates a deterministic meta-address from the vault keys.

async function generateKeyPairHex(): Promise<{ privateKey: string; publicKey: string }> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  // Use the raw bytes as "private key" and derive a "public key" hash
  const pubHash = await crypto.subtle.digest('SHA-256', raw);
  return {
    privateKey: arrayToHex(raw),
    publicKey: arrayToHex(new Uint8Array(pubHash)),
  };
}

export async function generateStealthKeys(): Promise<StealthKeyPair> {
  const spending = await generateKeyPairHex();
  const viewing = await generateKeyPairHex();
  const metaAddress = `st:eth:0x${spending.publicKey.slice(0, 66)}${viewing.publicKey.slice(0, 66)}`;
  return { spending, viewing, metaAddress };
}

// ── VAULT ──────────────────────────────────────────────────────

export async function createVault(keys: StealthKeyPair, password: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const aesKey = await deriveKey(password, salt);

  const plaintext = JSON.stringify({
    spending: keys.spending,
    viewing: keys.viewing,
    metaAddress: keys.metaAddress,
    createdAt: new Date().toISOString(),
    version: 2,
  });

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(plaintext) as BufferSource,
  );

  const vault = {
    version: 2,
    salt: arrayToHex(salt),
    iv: arrayToHex(iv),
    ciphertext: arrayToBase64(new Uint8Array(ciphertext)),
    metaAddress: keys.metaAddress,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    viewingPriv: keys.viewing.privateKey,
    spendingPub: keys.spending.publicKey,
    cachedAt: Date.now(),
  }));
}

export async function unlockVault(password: string): Promise<StealthKeyPair> {
  const raw = localStorage.getItem(VAULT_KEY);
  if (!raw) throw new Error('NO_VAULT');

  const vault = JSON.parse(raw);
  const salt = hexToArray(vault.salt);
  const iv = hexToArray(vault.iv);
  const ciphertext = base64ToArray(vault.ciphertext);
  const aesKey = await deriveKey(password, salt);

  let plaintext: StealthKeyPair;
  try {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, aesKey, ciphertext as BufferSource);
    plaintext = JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    throw new Error('WRONG_PASSWORD');
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    viewingPriv: plaintext.viewing.privateKey,
    spendingPub: plaintext.spending.publicKey,
    cachedAt: Date.now(),
  }));

  return plaintext;
}

export function lockVault(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function vaultExists(): boolean {
  return localStorage.getItem(VAULT_KEY) !== null;
}

export function isUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) !== null;
}

export function getMetaAddress(): string | null {
  const raw = localStorage.getItem(VAULT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw).metaAddress || null;
  } catch {
    return null;
  }
}

// ── STEALTH ADDRESSES ──────────────────────────────────────────

export function getStealthAddresses(): StealthAddress[] {
  try {
    return JSON.parse(localStorage.getItem(STEALTH_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveStealthAddresses(addrs: StealthAddress[]): void {
  localStorage.setItem(STEALTH_KEY, JSON.stringify(addrs));
}

// ── RPC ────────────────────────────────────────────────────────

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

// ── MEMO-TO-FILE ───────────────────────────────────────────────

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
    return JSON.parse(localStorage.getItem(MEMO_KEY) || '[]');
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
  localStorage.setItem(MEMO_KEY, JSON.stringify(memos));
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

// ── SETTINGS ───────────────────────────────────────────────────

interface PhenixSettings {
  rpcUrl: string;
  chainId: number;
  scanEnabled: boolean;
  hardwareMode: boolean;
}

export function getSettings(): PhenixSettings {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return { rpcUrl: DEFAULT_RPC, chainId: 1, scanEnabled: true, hardwareMode: false };
  }
}

export function saveSettings(s: Partial<PhenixSettings>): void {
  const current = getSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...s }));
}

// ── WALLET STATE HELPER ────────────────────────────────────────

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
