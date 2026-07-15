#!/usr/bin/env node
/**
 * scripts/genesis-ping.js — CWP-2026-051 M4+M5: scripted Genesis ping.
 *
 * Simulates Node Zero's PQC identity + composite care-proof + on-chain anchor.
 * Proves the quantum convergence loop without requiring ESP-IDF hardware.
 *
 * Usage:
 *   node scripts/genesis-ping.js                    # dry-run (default)
 *   node scripts/genesis-ping.js --apply             # register + care-proof + anchor
 *   node scripts/genesis-ping.js --apply --anchor    # also mint P31TransparencyAnchor
 *
 * Env vars (from .env):
 *   LEDGER_BRIDGE_URL  (default: https://ledger-bridge.trimtab-signal.workers.dev)
 *   LOVE_LEDGER_URL    (default: https://love-ledger.p31ca.org)
 *   GENESIS_ETH_ADDRESS (required for --apply)
 */

import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { readFileSync, existsSync, writeFileSync } from 'fs';

const DRY_RUN = !process.argv.includes('--apply');
const DO_ANCHOR = process.argv.includes('--anchor');
const LEDGER_BRIDGE = process.env.LEDGER_BRIDGE_URL || 'https://ledger-bridge.trimtab-signal.workers.dev';
const LOVE_LEDGER = process.env.LOVE_LEDGER_URL || 'https://love-ledger.p31ca.org';
const ETH_ADDRESS = process.env.GENESIS_ETH_ADDRESS || '0x0000000000000000000000000000000000000000';

// ── Helpers ────────────────────────────────────────────────────────────────

function bytesToB64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function bytesToB64url(bytes) {
  return bytesToB64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64ToBytes(b64) {
  let s = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// did:key from Ed25519 public key (multicodec prefix 0xed01 + 32-byte key, base58btc)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Encode(bytes) {
  let num = 0n;
  for (const b of bytes) num = (num << 8n) | BigInt(b);
  let out = '';
  while (num > 0n) {
    const rem = Number(num % 58n);
    out = BASE58_ALPHABET[rem] + out;
    num /= 58n;
  }
  for (const b of bytes) {
    if (b === 0) out = '1' + out;
    else break;
  }
  return out;
}

function ed25519PubToDidKey(pubBytes) {
  // did:key = base58btc(multicodec_ed25519_pub + raw_key)
  const multicodec = new Uint8Array([0xed, 0x01, ...pubBytes]);
  return `did:key:z${base58Encode(multicodec)}`;
}

// did:jwk per RFC 9964 (AKP: kty=AKP, alg=ML-DSA-65)
async function mldsa65PubToDidJwk(pubBytes) {
  // JWK Thumbprint (RFC 7638): SHA-256 of canonical JWK (sorted keys)
  const jwk = { alg: 'ML-DSA-65', kty: 'AKP', pub: bytesToB64(pubBytes) };
  const canonical = JSON.stringify(jwk); // already sorted since we only have 3 keys
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical)));
  const thumbprint = bytesToB64url(digest);
  return { did: `did:jwk:${thumbprint}`, jwk, thumbprint };
}

// ── Ed25519 via Web Crypto ─────────────────────────────────────────────────

async function generateEd25519() {
  const kp = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const pubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  const privPkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', kp.privateKey));
  return { publicKey: pubRaw, privateKey: kp.privateKey, pubB64: bytesToB64(pubRaw), privPkcs8 };
}

async function ed25519Sign(message, privateKey) {
  const sig = await crypto.subtle.sign('Ed25519', privateKey, new TextEncoder().encode(message));
  return new Uint8Array(sig);
}

// ── Build canonical registration message (matches love-ledger buildRegisterMessage) ──

function buildRegisterMessage(did, ed25519Pub, mldsa65Pub, ethAddress) {
  return `register|${did}|${ed25519Pub}|${mldsa65Pub}|${ethAddress}`;
}

// ── Build canonical care-proof message (matches ledger-bridge buildProofMessage) ──

function buildProofMessage(did, users, tProx, qRes, tasks, entropyRoots) {
  const j = (a) => a.map((v) => String(v)).join(',');
  return `proof|${did}|${j(users)}|${j(tProx)}|${j(qRes)}|${j(tasks)}|${j(entropyRoots)}`;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🧬 CWP-2026-051 Genesis Ping (${DRY_RUN ? 'DRY-RUN' : 'APPLY'})\n`);

  // 1) Generate Ed25519 keypair
  console.log('1. Generating Ed25519 keypair...');
  const ed = await generateEd25519();
  const didKey = ed25519PubToDidKey(ed.publicKey);
  console.log(`   did:key = ${didKey}`);

  // 2) Generate ML-DSA-65 keypair
  console.log('2. Generating ML-DSA-65 keypair...');
  const pq = ml_dsa65.keygen();
  const didJwkResult = await mldsa65PubToDidJwk(pq.publicKey);
  const didJwk = didJwkResult.did;
  console.log(`   did:jwk = ${didJwk}`);
  console.log(`   ML-DSA-65 pub key = ${pq.publicKey.length} bytes`);

  // 3) Identity registration
  console.log('\n3. Identity registration...');
  const registerMsg = buildRegisterMessage(didKey, ed.pubB64, bytesToB64(pq.publicKey), ETH_ADDRESS);
  const registerSig = await ed25519Sign(registerMsg, ed.privateKey);
  const registerBody = {
    did: didKey,
    ed25519_pub: ed.pubB64,
    mldsa65_pub: bytesToB64(pq.publicKey),
    eth_address: ETH_ADDRESS,
    signature: bytesToB64url(registerSig),
  };

  if (DRY_RUN) {
    console.log('   [dry-run] Would POST to love-ledger /identity/register');
    console.log(`   body.did = ${registerBody.did}`);
    console.log(`   body.ed25519_pub = ${registerBody.ed25519_pub.slice(0, 20)}...`);
    console.log(`   body.mldsa65_pub = ${registerBody.mldsa65_pub.slice(0, 20)}...`);
  } else {
    const res = await fetch(`${LOVE_LEDGER}/identity/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(registerBody),
    });
    const json = await res.json();
    console.log(`   POST /identity/register → ${res.status}`, json);
    if (!res.ok) {
      console.error('   Registration failed. Aborting.');
      process.exit(1);
    }
  }

  // 4) Composite care-proof
  console.log('\n4. Composite care-proof (Ed25519 + ML-DSA-65)...');
  const users = [ETH_ADDRESS];
  const tProx = [1.0];
  const qRes = [0.95];
  const tasks = ['genesis_ping'];
  const entropyRoots = ['0x' + 'ab'.repeat(32)];

  const proofMsg = buildProofMessage(didKey, users, tProx, qRes, tasks, entropyRoots);

  // Ed25519 signature
  const edSig = await ed25519Sign(proofMsg, ed.privateKey);
  // ML-DSA-65 signature (API: sign(message, secretKey))
  const pqSig = ml_dsa65.sign(new TextEncoder().encode(proofMsg), pq.secretKey);

  const careProofBody = {
    did: didKey,
    composite: {
      ed25519_sig: bytesToB64url(edSig),
      mldsa65_sig: bytesToB64url(pqSig),
    },
    users,
    tProx,
    qRes,
    tasks,
    entropyRoots,
  };

  if (DRY_RUN) {
    console.log('   [dry-run] Would POST to ledger-bridge /care-proof');
    console.log(`   proofMsg = ${proofMsg.slice(0, 80)}...`);
    console.log(`   ed25519_sig = ${careProofBody.composite.ed25519_sig.slice(0, 30)}...`);
    console.log(`   mldsa65_sig = ${careProofBody.composite.mldsa65_sig.slice(0, 30)}...`);
    console.log(`   composite = Ed25519(${edSig.length} bytes) + ML-DSA-65(${pqSig.length} bytes)`);
  } else {
    const res = await fetch(`${LEDGER_BRIDGE}/care-proof`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(careProofBody),
    });
    const json = await res.json();
    console.log(`   POST /care-proof → ${res.status}`, json);
    if (!res.ok) {
      console.error('   Care-proof failed. Aborting.');
      process.exit(1);
    }
  }

  // 5) On-chain anchor (M5)
  if (DO_ANCHOR) {
    console.log('\n5. On-chain Attestation Anchor...');
    // For the anchor, we need the entry_hash from the care-proof result.
    // In dry-run, we fabricate one.
    const entryHash = '0x' + 'ca'.repeat(32);
    const uri = `ipfs://genesis-ping-${Date.now()}`;

    if (DRY_RUN) {
      console.log('   [dry-run] Would POST to ledger-bridge /anchor');
      console.log(`   entryHash = ${entryHash}`);
      console.log(`   uri = ${uri}`);
    } else {
      // TODO: extract entryHash from care-proof response
      const res = await fetch(`${LEDGER_BRIDGE}/anchor`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ entryHash, uri }),
      });
      const json = await res.json();
      console.log(`   POST /anchor → ${res.status}`, json);
    }
  }

  // 6) Summary
  console.log('\n─'.repeat(60));
  console.log('🧬 Genesis Ping Summary');
  console.log('─'.repeat(60));
  console.log(`  Ed25519 DID:  ${didKey}`);
  console.log(`  ML-DSA-65:    ${didJwk}`);
  console.log(`  ETH:          ${ETH_ADDRESS}`);
  console.log(`  Ed25519 pub:  ${ed.pubB64.length} chars (base64)`);
  console.log(`  ML-DSA-65 pub: ${bytesToB64(pq.publicKey).length} chars (base64)`);
  console.log(`  Care-proof:   composite (Ed25519 + ML-DSA-65)`);
  console.log(`  Mode:         ${DRY_RUN ? 'DRY-RUN' : 'LIVE'}`);
  console.log('─'.repeat(60));

  // Save key material for reference
  const keyFile = {
    didKey,
    didJwk,
    ed25519_pubB64: ed.pubB64,
    mldsa65_pubB64: bytesToB64(pq.publicKey),
    ethAddress: ETH_ADDRESS,
    generatedAt: new Date().toISOString(),
  };
  writeFileSync('out/genesis-keys.json', JSON.stringify(keyFile, null, 2));
  console.log(`\n  Key material saved to out/genesis-keys.json`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
