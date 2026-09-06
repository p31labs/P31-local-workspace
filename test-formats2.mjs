import { webcrypto } from 'crypto';
const crypto = webcrypto;

async function main() {
  const kp = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const edPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  const edPriv = kp.privateKey;

  const did = 'did:key:z' + Buffer.from(edPubRaw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const ed25519_pub = Buffer.from(edPubRaw).toString('base64');
  const eth_address = '0x51c285Df171C76bE36252e32679F098d90768413';
  const mldsa65_pub = 'test';

  // Try with mldsa65_pub in the message
  const candidates = [
    did + '|' + ed25519_pub + '|' + mldsa65_pub + '||' + eth_address,
    did + '|' + ed25519_pub + '|' + mldsa65_pub + '|' + eth_address,
    did + '|' + mldsa65_pub + '||' + eth_address,
    did + '|' + ed25519_pub + '||' + eth_address + '|' + mldsa65_pub,
  ];

  for (let i = 0; i < candidates.length; i++) {
    const msg = candidates[i];
    const sig = new Uint8Array(await crypto.subtle.sign('Ed25519', edPriv, new TextEncoder().encode(msg)));
    const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const body = { did, ed25519_pub, mldsa65_pub, eth_address, signature: b64url(sig) };
    const res = await fetch('https://love-ledger.p31ca.org/identity/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const j = await res.json();
    if (res.ok) { console.log('SUCCESS format', i, ':', msg); return; }
    if (j.error !== 'Invalid signature — DID control not proven') {
      console.log('OTHER format', i, ':', res.status, JSON.stringify(j));
    }
  }
  console.log('All format2 tests failed');
}
main().catch(e => console.error(e));
