import { webcrypto } from 'crypto';
const crypto = webcrypto;

async function main() {
  const kp = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const edPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  const edPriv = kp.privateKey;

  // Standard base64 DID (not base64url)
  const didB64 = 'did:key:z' + Buffer.from(edPubRaw).toString('base64');
  const didB64url = 'did:key:z' + Buffer.from(edPubRaw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const ed25519_pub = Buffer.from(edPubRaw).toString('base64');
  const eth_address = '0x51c285Df171C76bE36252e32679F098d90768413';

  const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  // Test 1: standard base64 DID
  let msg = didB64 + '|' + ed25519_pub + '||' + eth_address;
  let sig = new Uint8Array(await crypto.subtle.sign('Ed25519', edPriv, new TextEncoder().encode(msg)));
  let res = await fetch('https://love-ledger.p31ca.org/identity/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ did: didB64, ed25519_pub, eth_address, signature: b64url(sig) }),
  });
  console.log('STD-B64 DID:', res.status, JSON.stringify(await res.json()));

  // Test 2: base64url DID with base64url ed25519_pub (both url-safe)
  msg = didB64url + '|' + b64url(edPubRaw) + '||' + eth_address;
  sig = new Uint8Array(await crypto.subtle.sign('Ed25519', edPriv, new TextEncoder().encode(msg)));
  res = await fetch('https://love-ledger.p31ca.org/identity/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ did: didB64url, ed25519_pub: b64url(edPubRaw), eth_address, signature: b64url(sig) }),
  });
  console.log('B64URL BOTH:', res.status, JSON.stringify(await res.json()));
}
main().catch(e => console.error(e));
