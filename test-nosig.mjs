import { webcrypto } from 'crypto';
const crypto = webcrypto;

async function main() {
  const kp = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const edPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  const did = 'did:key:z' + Buffer.from(edPubRaw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const ed25519_pub = Buffer.from(edPubRaw).toString('base64');
  const eth_address = '0x51c285Df171C76bE36252e32679F098d90768413';

  // Try without signature field
  const tests = [
    { name: 'no signature', body: { did, ed25519_pub, eth_address } },
    { name: 'empty signature', body: { did, ed25519_pub, eth_address, signature: '' } },
    { name: 'null signature', body: { did, ed25519_pub, eth_address, signature: null } },
  ];

  for (const t of tests) {
    const res = await fetch('https://love-ledger.p31ca.org/identity/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t.body),
    });
    console.log(t.name + ':', res.status, JSON.stringify(await res.json()));
  }
}
main().catch(e => console.error(e));
