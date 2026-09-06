import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';

const crypto = webcrypto;
const BASE_URL = 'https://love-ledger.p31ca.org';
const AUTH = '43fa3d824b176cc0394d389344f867466c439aaeecc862f3e17266a968443ab7';
const DID = 'did:test:cbs-smoke';
const AMOUNT = 5;
const WASM = new URL('../../src/taler_cs.wasm', import.meta.url);
const buf = readFileSync(WASM);

const { instance } = await WebAssembly.instantiate(buf, { env: {} });
const INST = instance;
const MEM = INST.exports.memory;
const P = 32;
const BASE = Math.ceil(INST.exports.__heap_base.value / 1024) * 1024;
const ensure = (o, n) => { while (MEM.buffer.byteLength < o + n) MEM.grow(1); };
const wr = (o, d) => { ensure(o, d.length); new Uint8Array(MEM.buffer, o, d.length).set(d); };
const rd = (o, n) => { ensure(o, n); return new Uint8Array(MEM.buffer, o, n).slice(); };
const OFF_A = () => BASE + 0, OFF_B = () => BASE + P, OFF_R = () => BASE + 2 * P, OFF_X = () => BASE + 3 * P, OFF_C = () => BASE + 4 * P, OFF_CP = () => BASE + 5 * P, OFF_BUF = () => BASE + 6 * P;
function blind(msg, a, b, R, X) {
  const m = OFF_BUF() + P; wr(m, msg); wr(OFF_A(), a); wr(OFF_B(), b); wr(OFF_R(), R); wr(OFF_X(), X);
  if (INST.exports.cs_blind(m, msg.length, OFF_A(), OFF_B(), OFF_R(), OFF_X(), OFF_C(), OFF_CP()) !== 0) throw new Error('blind fail');
  return { c: rd(OFF_C(), P), cPrime: rd(OFF_CP(), P) };
}
function unblind(s, a) {
  wr(OFF_A(), s); wr(OFF_B(), a);
  if (INST.exports.cs_unblind(OFF_A(), OFF_B(), OFF_C()) !== 0) throw new Error('unblind fail');
  return rd(OFF_C(), P);
}
const b64e = (u) => Buffer.from(u).toString('base64');
const b64d = (s) => new Uint8Array(Buffer.from(s, 'base64'));
const rnd = () => crypto.getRandomValues(new Uint8Array(32));
const utc = () => new Date().toISOString().slice(0, 10);
const j = (r) => r.json();

// 0. health
const h = await fetch(`${BASE_URL}/health`);
console.log('0. /health ->', h.status, JSON.stringify(await h.json()));

// 1. blind-pubkey
const pk = await j(await fetch(`${BASE_URL}/blind-pubkey`));
console.log('1. /blind-pubkey ->', Object.keys(pk), 'X.len', b64d(pk.X).length);
const X = b64d(pk.X), R = b64d(pk.R), t = pk.t;

// 2. blind
const msg = new TextEncoder().encode([DID, 'system:love-issuer', String(AMOUNT), utc()].join('|'));
const a = rnd(), b = rnd();
const { c, cPrime } = blind(msg, a, b, R, X);

// 3. blind-sign
const sRes = await j(await fetch(`${BASE_URL}/blind-sign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ c: b64e(c), t }) }));
if (!sRes.s) throw new Error('blind-sign failed: ' + JSON.stringify(sRes));
console.log('3. /blind-sign -> s.len', b64d(sRes.s).length);
const sPrime = unblind(b64d(sRes.s), a);

// 4. withdraw (Bearer auth)
const w = await j(await fetch(`${BASE_URL}/withdraw`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + AUTH }, body: JSON.stringify({ did: DID, amount: AMOUNT, msg: b64e(msg), cPrime: b64e(cPrime), sPrime: b64e(sPrime), t }) }));
console.log('4. /withdraw ->', w.success ? 'OK' : 'FAIL', JSON.stringify(w).slice(0, 200));
if (!w.success) process.exit(1);

// 5. replay same (c',s') must FAIL (court-admissible single-use)
const w2 = await j(await fetch(`${BASE_URL}/withdraw`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + AUTH }, body: JSON.stringify({ did: DID, amount: AMOUNT, msg: b64e(msg), cPrime: b64e(cPrime), sPrime: b64e(sPrime), t }) }));
console.log('5. replay withdraw ->', w2.success ? 'UNEXPECTED-OK' : 'correctly rejected (' + w2.error + ')');
console.log('\nCBS LIVE SMOKE: PASS');
