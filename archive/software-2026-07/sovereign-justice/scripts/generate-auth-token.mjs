// Ed25519 auth token generator for K4 Sovereign Justice
// Usage: node scripts/generate-auth-token.mjs <did> [nonce]
//
// Generates a signed Bearer token for DID auth middleware testing.
// Keys are generated ephemerally -- replace with your registered
// public key in auth.ts KNOWN_KEYS to test against real workers.

import { generateKeyPair, sign } from 'crypto';
import { promisify } from 'util';

const generateKeyPairAsync = promisify(generateKeyPair);
const signAsync = promisify(sign);

function base64url(buf) {
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function main() {
  const did = process.argv[2] || 'did:example:party-a';
  const nonce = process.argv[3] || '';

  // Generate Ed25519 key pair
  const { publicKey, privateKey } = await generateKeyPairAsync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });

  // payload is just the DID and optional nonce
  const payload = JSON.stringify({ did, nonce, ts: Date.now() });
  const sig = await signAsync(null, Buffer.from(payload), {
    key: privateKey,
    format: 'der',
    type: 'pkcs8',
  });

  const token = {
    did,
    signature: sig.toString('hex'),
    payload,
    nonce: nonce || undefined,
  };

  const tokenJson = JSON.stringify(token);
  const encoded = base64url(Buffer.from(tokenJson));

  console.log('\n=== Auth Token ===');
  console.log(encoded);

  console.log('\n=== Token JSON (decoded) ===');
  console.log(tokenJson);

  console.log('\n=== Public Key (hex) ===');
  const pubKeyHex = Buffer.from(publicKey).toString('hex');
  console.log(`0x${pubKeyHex.slice(-64)}`); // last 32 bytes = raw Ed25519 public key

  console.log('\n=== Register in auth.ts ===');
  console.log(`'${did}': '0x${pubKeyHex.slice(-64)}',`);

  console.log('\n=== cURL Example ===');
  console.log(`curl -X POST https://k4-core.trimtab-signal.workers.dev/api/escrow/deposit \\`);
  console.log(`  -H 'Authorization: Bearer ${encoded}' \\`);
  console.log(`  -H 'Content-Type: application/json' \\`);
  console.log(`  -d '{"caseId":"test-123","partyDid":"${did}","partyBDid":"did:example:party-b","amount":100}'`);
}

main().catch(console.error);
