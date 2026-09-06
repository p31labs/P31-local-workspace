import { webcrypto } from 'crypto';
const crypto = webcrypto;

async function main() {
  const kp = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const edPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  const edPriv = kp.privateKey;

  const did = 'did:key:z' + Buffer.from(edPubRaw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const ed25519_pub = Buffer.from(edPubRaw).toString('base64');
  const eth_address = '0x51c285Df171C76bE36252e32679F098d90768413';

  const candidates = [
    did,
    eth_address,
    did + '|' + eth_address,
    eth_address + '|' + did,
    ed25519_pub,
    did + '|' + ed25519_pub,
    ed25519_pub + '|' + did,
    did + '|' + ed25519_pub + '|' + eth_address,
    ed25519_pub + '|' + did + '|' + eth_address,
    did + ed25519_pub + eth_address,
    'register|' + did,
    'register|' + did + '|' + ed25519_pub + '|' + eth_address,
  ];

  for (let i = 0; i < candidates.length; i++) {
    const msg = candidates[i];
    const sig = new Uint8Array(await crypto.subtle.sign('Ed25519', edPriv, new TextEncoder().encode(msg)));
    const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const body = { did, ed25519_pub, eth_address, signature: b64url(sig) };
    try {
      const res = await fetch('https://love-ledger.p31ca.org/identity/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const j = await res.json();
      if (res.ok) { console.log('SUCCESS format', i, ':', msg.substring(0, 50)); return; }
      if (j.error !== 'Invalid signature — DID control not proven') {
        console.log('OTHER format', i, ':', res.status, JSON.stringify(j), '| msg:', msg.substring(0, 50));
      }
    } catch (e) { console.log('ERR format', i, e.message); }
  }
  console.log('All formats failed signature check');
}
main().catch(e => console.error(e));
