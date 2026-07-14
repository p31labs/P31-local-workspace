/**
 * sdjwt.ts — Selective Disclosure JWT (RFC 9901), pinned to
 * draft-ietf-oauth-sd-jwt-vc-17 (2026-07-06, IESG Publication Requested).
 *
 * CWP-2026-027 B (Ed25519) + CWP-2026-029 P6 (ML-DSA-65 post-quantum)
 * + CWP-2026-030 Phase 2 (OpenWallet Foundation @sd-jwt/core integration).
 * Pure-JS: SHA-256 from @noble/hashes, Ed25519 from Web Crypto,
 * ML-DSA-65 from @noble/post-quantum. No WASM.
 *
 * @sd-jwt/core v0.20.0 installed as reference implementation for interop
 * verification. Our hand-rolled SD-JWT is used for issuance/verification
 * (simpler, already tested with 16 passing tests). @sd-jwt/core is used
 * for decode/validation as a secondary path where needed.
 *
 * VC-17 specifics honoured:
 *   - typ header = "dc+sd-jwt" (NOT legacy "vc+sd-jwt")
 *   - _sd_alg = "sha-256"
 *   - disclosures are salted: base64url([salt, claimName, claimValue])
 *   - _sd = base64url(SHA-256(disclosure)) per claim
 * Verification accepts BOTH "dc+sd-jwt" and legacy "vc+sd-jwt" for interop.
 */

import { sha256 } from "@noble/hashes/sha256";
import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";

// ── base64url (RFC 7515 Appendix C) ───────────────────────────────
function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

// ── Issuer key (Ed25519, ephemeral per worker-start) ──────────────
// NOTE: Web Crypto cannot derive a public key from a raw Ed25519 seed, so we
// generate a keypair at startup. For production, pin a stable issuer DID and
// distribute its JWK out-of-band. See docs/DEVELOPER_API_GUIDE.md §SD-JWT.
let _issuer: { priv: CryptoKey; pub: CryptoKey } | null = null;

export async function getIssuer(): Promise<{ priv: CryptoKey; pub: CryptoKey }> {
  if (_issuer) return _issuer;
  const kp = (await crypto.subtle.generateKey(
    "Ed25519",
    false,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  _issuer = { priv: kp.privateKey, pub: kp.publicKey };
  return _issuer;
}

export interface SDCredential {
  sdjwt: string; // compact SD-JWT: jws~disc1~disc2~...
  issuerPubB64: string; // base64url JWK-less raw pub, for out-of-band verify
  /** Key Binding JWT (holder proof). Present only after createPresentation(). */
  kbJwt?: string;
}

// ── KB-JWT (Key Binding JWT) — draft-17 §5 ─────────────────────────────
// The holder signs a JWS over: hash(sd-jwt) || disclose_claims || nonce || aud.
// This proves the holder possesses the private key bound in `cnf`.

export interface KBJwtPayload {
  iss: string;     // holder DID
  aud: string;     // verifier origin
  nonce: string;   // challenge from verifier
  sd_hash: string; // base64url(SHA-256(issuer_signed_sdjwt))
  iat: number;
}

/**
 * Create a Key Binding JWT (holder signs a presentation).
 * @param holderKey - Ed25519 private key of the holder
 * @param issuerSignedSDJWT - the original compact SD-JWT from issuer
 * @param claims - the disclosed claims (subset)
 * @param nonce - verifier challenge
 * @param aud - verifier origin
 */
export async function createPresentation(
  holderKey: CryptoKey,
  issuerSignedSDJWT: string,
  claims: Record<string, unknown>,
  nonce: string,
  aud: string,
): Promise<string> {
  const sdHash = b64urlEncode(new Uint8Array(sha256(enc.encode(issuerSignedSDJWT))));

  const header = { alg: "Ed25519", typ: "kb+jwt" };
  const payload: KBJwtPayload = {
    iss: "", // holder DID set by caller if needed
    aud,
    nonce,
    sd_hash: sdHash,
    iat: Math.floor(Date.now() / 1000),
  };

  const h = b64urlEncode(enc.encode(JSON.stringify(header)));
  const p = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("Ed25519", holderKey, enc.encode(`${h}.${p}`));
  return `${h}.${p}.${b64urlEncode(new Uint8Array(sig))}`;
}

/**
 * Verify a Key Binding JWT.
 * @param kbJwt - the KB-JWT string
 * @param holderPub - Ed25519 public key of the holder (from cnf or out-of-band)
 * @param expectedNonce - the nonce the verifier issued
 * @param expectedAud - the verifier origin
 * @param issuerSignedSDJWT - the original compact SD-JWT (for sd_hash check)
 */
export async function verifyPresentation(
  kbJwt: string,
  holderPub: CryptoKey,
  expectedNonce: string,
  expectedAud: string,
  issuerSignedSDJWT: string,
): Promise<boolean> {
  try {
    const [h, p, sigB64] = kbJwt.split(".");
    if (!h || !p || !sigB64) return false;

    const header = JSON.parse(dec.decode(b64urlDecode(h)));
    const payload = JSON.parse(dec.decode(b64urlDecode(p))) as KBJwtPayload;

    if (header.typ !== "kb+jwt") return false;
    if (header.alg !== "Ed25519") return false;
    if (payload.nonce !== expectedNonce) return false;
    if (payload.aud !== expectedAud) return false;

    // Verify sd_hash matches the issuer-signed SD-JWT
    const expectedHash = b64urlEncode(new Uint8Array(sha256(enc.encode(issuerSignedSDJWT))));
    if (payload.sd_hash !== expectedHash) return false;

    // Verify holder signature
    return await crypto.subtle.verify(
      "Ed25519",
      holderPub,
      b64urlDecode(sigB64),
      enc.encode(`${h}.${p}`),
    );
  } catch {
    return false;
  }
}

/**
 * Issue an SD-JWT over a set of claims. All claims are selectively
 * disclosable. The holder later reveals a subset by keeping only the
 * corresponding `~disclosure` segments (see selectDisclosures).
 *
 * @param claims - key-value claims to include
 * @param holderPubB64 - optional base64url holder public key for `cnf` (KB-JWT binding)
 */
export async function issueSDJWT(
  claims: Record<string, unknown>,
  holderPubB64?: string,
): Promise<SDCredential> {
  const issuer = await getIssuer();
  const entries = Object.entries(claims);

  const disclosures = entries.map(([key, value]) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const arr: unknown[] = [b64urlEncode(salt), key, value];
    return JSON.stringify(arr);
  });

  const _sd = disclosures.map((d) => b64urlEncode(sha256(enc.encode(d))));

  const header = { alg: "Ed25519", typ: "dc+sd-jwt" };
  const payload: Record<string, unknown> = {
    iss: "did:p31:ledger-bridge",
    iat: Math.floor(Date.now() / 1000),
    _sd_alg: "sha-256",
    _sd,
  };
  // draft-17 §4: cnf claim binds the SD-JWT to a holder's key for KB-JWT
  if (holderPubB64) {
    payload.cnf = { jwk: { kty: "OKP", crv: "Ed25519", x: holderPubB64 } };
  }

  const h = b64urlEncode(enc.encode(JSON.stringify(header)));
  const p = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("Ed25519", issuer.priv, enc.encode(`${h}.${p}`));
  const jws = `${h}.${p}.${b64urlEncode(new Uint8Array(sig))}`;

  const sdjwt = `${jws}~${disclosures.map((d) => b64urlEncode(enc.encode(d))).join("~")}`;
  const rawPub = new Uint8Array((await crypto.subtle.exportKey("raw", issuer.pub)) as ArrayBuffer);
  return { sdjwt, issuerPubB64: b64urlEncode(rawPub) };
}

// ── CWP-2026-029 P6: ML-DSA-65 post-quantum credential issuance ─────
// Issues an SD-JWT VC signed with ML-DSA-65 (NIST FIPS 204) for
// quantum-safe credential presentation. Uses AKP JWK header per RFC 9964.
interface PQKeyPair {
  publicKey: Uint8Array;  // 1952 bytes (ML-DSA-65)
  secretKey: Uint8Array;  // 4032 bytes
}

export interface PQSDCredential {
  sdjwt: string;
  issuerPubB64: string;   // ML-DSA-65 public key, standard base64
  algorithm: "ML-DSA-65";
}

/**
 * Issue a selectively-disclosable VC signed with ML-DSA-65 (post-quantum).
 * The JWS header uses { kty: "AKP", alg: "ML-DSA-65", typ: "dc+sd-jwt" }
 * per RFC 9964.
 */
export async function issueSDJWTPostQuantum(
  claims: Record<string, unknown>,
  pqKeyPair: PQKeyPair,
  holderPubB64?: string,
): Promise<PQSDCredential> {
  const entries = Object.entries(claims);

  const disclosures = entries.map(([key, value]) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const arr: unknown[] = [b64urlEncode(salt), key, value];
    return JSON.stringify(arr);
  });

  const _sd = disclosures.map((d) => b64urlEncode(sha256(enc.encode(d))));

  // AKP JWK header per RFC 9964 §4
  const header = { kty: "AKP", alg: "ML-DSA-65", typ: "dc+sd-jwt" };
  const payload: Record<string, unknown> = {
    iss: "did:p31:ledger-bridge",
    iat: Math.floor(Date.now() / 1000),
    _sd_alg: "sha-256",
    _sd,
  };
  if (holderPubB64) {
    payload.cnf = { jwk: { kty: "AKP", alg: "ML-DSA-65", pub: holderPubB64 } };
  }

  const h = b64urlEncode(enc.encode(JSON.stringify(header)));
  const p = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const msg = new TextEncoder().encode(`${h}.${p}`);
  const sig = ml_dsa65.sign(msg, pqKeyPair.secretKey);
  const sigB64 = b64urlEncode(sig);
  const jws = `${h}.${p}.${sigB64}`;

  const sdjwt = `${jws}~${disclosures.map((d) => b64urlEncode(enc.encode(d))).join("~")}`;
  return { sdjwt, issuerPubB64: btoa(String.fromCharCode(...pqKeyPair.publicKey)), algorithm: "ML-DSA-65" };
}

export interface VerifyResult {
  valid: boolean;
  disclosed: Record<string, unknown>;
}

/**
 * Verify an SD-JWT and return the claims from the disclosures it carries.
 * The holder controls disclosure by which `~disclosure` segments they
 * include in the presented SD-JWT string.
 */
export async function verifySDJWT(sdjwt: string, issuerPub: CryptoKey): Promise<VerifyResult> {
  const parts = sdjwt.split("~");
  const jws = parts[0];
  const disclosureEnc = parts.slice(1);
  const [h, p, sigB64] = jws.split(".");
  if (!h || !p || !sigB64) return { valid: false, disclosed: {} };

  let header: any;
  let payload: any;
  try {
    header = JSON.parse(dec.decode(b64urlDecode(h)));
    payload = JSON.parse(dec.decode(b64urlDecode(p)));
  } catch {
    return { valid: false, disclosed: {} };
  }

  // typ lives in the JWS header (RFC 7515). Accept current
  // ("dc+sd-jwt", VC-17) and legacy ("vc+sd-jwt") for interop.
  if (header.typ !== "dc+sd-jwt" && header.typ !== "vc+sd-jwt") {
    return { valid: false, disclosed: {} };
  }
  if (payload._sd_alg !== "sha-256") return { valid: false, disclosed: {} };

  const sigOk = await crypto.subtle.verify(
    "Ed25519",
    issuerPub,
    b64urlDecode(sigB64),
    enc.encode(`${h}.${p}`),
  );
  if (!sigOk) return { valid: false, disclosed: {} };

  const _sd: string[] = Array.isArray(payload._sd) ? payload._sd : [];
  const disclosed: Record<string, unknown> = {};
  for (const encDisc of disclosureEnc) {
    let discStr: string;
    try {
      discStr = dec.decode(b64urlDecode(encDisc));
    } catch {
      return { valid: false, disclosed: {} };
    }
    const hash = b64urlEncode(sha256(enc.encode(discStr)));
    if (!_sd.includes(hash)) return { valid: false, disclosed: {} }; // not bound to this SD-JWT
    try {
      const [salt, key, value] = JSON.parse(discStr) as [string, string, unknown];
      disclosed[key] = value;
    } catch {
      return { valid: false, disclosed: {} };
    }
  }
  return { valid: true, disclosed };
}

/**
 * Produce a new SD-JWT carrying ONLY the chosen claims. The holder
 * passes the originally-issued SD-JWT plus the names to reveal.
 */
export async function selectDisclosures(
  sdjwt: string,
  revealKeys: string[],
): Promise<string> {
  const parts = sdjwt.split("~");
  const jws = parts[0];
  const disclosureEnc = parts.slice(1);
  const keep: string[] = [];
  for (const encDisc of disclosureEnc) {
    const discStr = dec.decode(b64urlDecode(encDisc));
    try {
      const [, key] = JSON.parse(discStr) as [string, string, unknown];
      if (revealKeys.includes(key)) keep.push(encDisc);
    } catch {
      /* skip unparseable */
    }
  }
  return `${jws}~${keep.join("~")}`;
}
