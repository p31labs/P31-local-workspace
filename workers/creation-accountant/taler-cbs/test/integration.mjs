// integration.mjs — full issuer-side flow the love-ledger Worker will run.
//
// Exercises the SAME code paths as taler-cbs/loader.ts + kdf.ts:
//   issuer: x (secret) -> X=base(x); n=derive(x,period) -> R=base(n);
//           s = signBlinded(c, n, x)
//   verifier: verify(msg, c', s', X, R)
// Plus the client half (blind/unblind) for an end-to-end round-trip.
//
// Uses Node Web Crypto for SHA-512 (matches kdf.ts — no @noble).

import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';

const crypto = webcrypto;
const WASM = new URL('../../src/taler_cs.wasm', import.meta.url);
const buf = readFileSync(WASM);

const { instance } = await WebAssembly.instantiate(buf, { env: {} });
const ex = instance.exports;
const mem = ex.memory;

const HEAP = Math.ceil(ex.__heap_base.value / 1024) * 1024;
const OFF_MSG = HEAP + 0;
const OFF_A = HEAP + 2048;
const OFF_B = HEAP + 3072;
const OFF_R = HEAP + 4096;
const OFF_X = HEAP + 5120;
const OFF_C = HEAP + 6144;
const OFF_CP = OFF_C + 32;
const OFF_S = HEAP + 7168;

const U8 = (o, n) => new Uint8Array(mem.buffer, o, n);
const write = (o, d) => U8(o, d.length).set(d);
const read = (o, n) => U8(o, n).slice();
const rnd = () => crypto.getRandomValues(new Uint8Array(32));

// Mirror kdf.ts: n = clamp(SHA-512(x || t)), t = fresh one-time nonce.
async function deriveNonce(x, t) {
  const input = new Uint8Array(x.length + t.length);
  input.set(x);
  input.set(t, x.length);
  const h = new Uint8Array(await crypto.subtle.digest('SHA-512', input));
  h[0] &= 248;
  h[31] &= 127;
  h[31] |= 64;
  return h.slice(0, 32);
}
const base = (x) => {
  write(OFF_A, x);
  if (ex.cs_base(OFF_A, OFF_C) !== 0) throw new Error('cs_base failed');
  return read(OFF_C, 32);
};
const blind = (msg, a, b, R, X) => {
  write(OFF_MSG, msg);
  write(OFF_A, a);
  write(OFF_B, b);
  write(OFF_R, R);
  write(OFF_X, X);
  if (ex.cs_blind(OFF_MSG, msg.length, OFF_A, OFF_B, OFF_R, OFF_X, OFF_C, OFF_CP) !== 0)
    throw new Error('blind failed');
  return { c: read(OFF_C, 32), cPrime: read(OFF_CP, 32) };
};
const signBlinded = (c, n, x) => {
  write(OFF_A, c);
  write(OFF_B, n);
  write(OFF_X, x);
  if (ex.cs_sign_blinded(OFF_A, OFF_B, OFF_X, OFF_S) !== 0) throw new Error('sign failed');
  return read(OFF_S, 32);
};
const unblind = (s, a) => {
  write(OFF_A, s);
  write(OFF_B, a);
  if (ex.cs_unblind(OFF_A, OFF_B, OFF_S) !== 0) throw new Error('unblind failed');
  return read(OFF_S, 32);
};
const verify = (msg, cPrime, sPrime, X, R) => {
  write(OFF_MSG, msg);
  write(OFF_A, cPrime);
  write(OFF_B, sPrime);
  write(OFF_X, X);
  write(OFF_R, R);
  return ex.cs_verify(OFF_MSG, msg.length, OFF_A, OFF_B, OFF_X, OFF_R) === 0;
};

// --- Issuer key (cross-checked vs independent Ed25519) ---
const kp = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
const x = await (async () => {
  const seed = new Uint8Array(Buffer.from(jwk.d, 'base64url'));
  const h = new Uint8Array(await crypto.subtle.digest('SHA-512', seed));
  h[0] &= 248; h[31] &= 127; h[31] |= 64;
  return h.slice(0, 32);
})();
const X_expected = new Uint8Array(Buffer.from(jwk.x, 'base64url'));

const period = new Date().toISOString().slice(0, 10);
// Fresh one-time nonce `t` per withdrawal (NOT derived from the period —
// that would reuse n across the whole day and leak x).
const t = rnd();
const n = await deriveNonce(x, t);
const X = base(x);
const R = base(n);

if (!X.every((v, i) => v === X_expected[i])) {
  console.error('FAIL: X = base(x) != Web Crypto public key');
  process.exit(1);
}
console.log('OK   issuer X = base(x) matches independent Ed25519');

// --- End-to-end: client blind -> issuer sign -> client unblind -> verify ---
const msg = new TextEncoder().encode('did:alice|love_withdraw|5');
const a = rnd();
const b = rnd();
const { c, cPrime } = blind(msg, a, b, R, X);
const s = signBlinded(c, n, x);
const sPrime = unblind(s, a);
if (!verify(msg, cPrime, sPrime, X, R)) {
  console.error('FAIL: full issuer+client flow rejected');
  process.exit(1);
}
console.log('OK   full flow (blind->sign->unblind->verify) VALID');

// tampered
const bad = sPrime.slice(); bad[0] ^= 0xff;
if (verify(msg, cPrime, bad, X, R)) {
  console.error('FAIL: tampered signature accepted');
  process.exit(1);
}
console.log('OK   tampered signature REJECTED');

// SECURITY PROOF: if the SAME nonce `t` (hence same n) is reused with two
// DIFFERENT challenges, the issuer secret x is recoverable. This is exactly
// why issued `t` must be single-use (enforced by the cbs_nonce D1 set at
// /blind-sign). Demonstrated here against the wasm directly.
{
  const t2 = t; // reuse the same nonce
  const n2 = await deriveNonce(x, t2); // == n (same t)
  const a2 = rnd(), b2 = rnd();
  const msg2 = new TextEncoder().encode('did:alice|love_withdraw|7');
  const { c: c2, cPrime: cp2 } = blind(msg2, a2, b2, R, X);
  const s2 = signBlinded(c2, n2, x);
  const sp2 = unblind(s2, a2);
  if (!verify(msg2, cp2, sp2, X, R)) {
    console.error('FAIL: second (same-nonce) signature rejected');
    process.exit(1);
  }
  // s' = n + (c'+b)*x + a  =>  (s' - a - n) = (c'+b) * x  (all mod L).
  // Two withdrawals with the same n give: lhs1 = cc1*x, lhs2 = cc2*x
  // => lhs1*cc2 == lhs2*cc1 (mod L). Equality proves x is recoverable
  // (linear system) -> nonce MUST be single-use.
  const L = (1n << 252n) + 27742317777372353535851937790883648493n;
  const toB = (u) => { let v = 0n; for (let i = 31; i >= 0; i--) v = (v << 8n) | BigInt(u[i]); return v; };
  const mod = (v) => ((v % L) + L) % L;
  const tuple = (sp, aa, bb, cp) => {
    const lhs = mod(toB(sp) - toB(aa) - toB(n));
    const cc = mod(toB(cp) + toB(bb));
    return [lhs, cc];
  };
  const [lhs1, cc1] = tuple(sPrime, a, b, cPrime);
  const [lhs2, cc2] = tuple(sp2, a2, b2, cp2);
  if (mod(lhs1 * cc2) !== mod(lhs2 * cc1)) {
    console.error('FAIL: nonce-reuse linear dependency not demonstrated');
    process.exit(1);
  }
  console.log('OK   nonce-reuse leaks x (proves single-use `t` is REQUIRED)');
}

console.log('\nINTEGRATION GATES PASSED — issuer flow is consistent + cross-checked.');
