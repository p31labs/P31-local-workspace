import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { webcrypto } from 'crypto';

const crypto = webcrypto;

async function main() {
  // Generate Ed25519
  const kp = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const edPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  const edPriv = kp.privateKey;

  // Generate ML-DSA-65
  const pq = ml_dsa65.keygen();

  const did = 'did:key:z' + Buffer.from(edPubRaw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const ed25519_pub = Buffer.from(edPubRaw).toString('base64');
  const mldsa65_pub = Buffer.from(pq.publicKey).toString('base64');
  const eth_address = '0x51c285Df171C76bE36252e32679F098d90768413';

  const msg = did + '|' + ed25519_pub + '||' + eth_address;
  const edSig = new Uint8Array(await crypto.subtle.sign('Ed25519', edPriv, new TextEncoder().encode(msg)));
  const pqSig = ml_dsa65.sign(new TextEncoder().encode(msg), pq.secretKey);

  const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const body = {
    did, ed25519_pub, mldsa65_pub, eth_address,
    signature: b64url(edSig),
    mldsa65_sig: b64url(pqSig),
  };

  const res = await fetch('https://love-ledger.p31ca.org/identity/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  console.log('Composite response:', res.status, JSON.stringify(await res.json()));
}

main().catch(e => console.error('Error:', e.message));
