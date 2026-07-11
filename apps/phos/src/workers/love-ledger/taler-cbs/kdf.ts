// taler-cbs/kdf.ts — per-withdrawal ephemeral nonce n = clamp(SHA-512(x ‖ t)).
//
// SECURITY: a Schnorr nonce MUST be unique per signature. n is derived from
// the issuer secret x and a ONE-TIME client/issuer nonce t, so every
// withdrawal gets a fresh n (and therefore a fresh R = n·G). Reusing n
// across two blinded challenges leaks x (s1−s2 = (c1−c2)·x). This design
// recomputes n deterministically from (x, t) so the worker stays
// stateless (no stored secret), while a consumed-`t` set enforces
// one-use and blocks the nonce-reuse key leak.
//
// SHA-512 via Web Crypto (native in Workers + browsers; no @noble).
export async function deriveNonce(
  x: Uint8Array,
  t: Uint8Array,
): Promise<Uint8Array> {
  const input = new Uint8Array(x.length + t.length);
  input.set(x);
  input.set(t, x.length);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-512', input));
  // RFC-8032 clamp: clear bits 0,1,2; clear bit 255; set bit 254.
  hash[0] &= 248;
  hash[31] &= 127;
  hash[31] |= 64;
  return new Uint8Array(hash.slice(0, 32));
}

// UTC date "YYYY-MM-DD" — embedded in the signed message for court scoping.
export function utcPeriod(): string {
  return new Date().toISOString().slice(0, 10);
}
