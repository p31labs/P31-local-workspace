/**
 * sdjwt.ts — Selective Disclosure JWT (RFC 9901), pinned to
 * draft-ietf-oauth-sd-jwt-vc-17 (2026-07-06, IESG Publication Requested).
 *
 * CWP-2026-027 B. Pure-JS: SHA-256 from @noble/hashes, Ed25519 signing
 * from Web Crypto. No WASM. Issuer is the ledger-bridge (oracle/relay).
 *
 * VC-17 specifics honoured:
 *   - typ header = "dc+sd-jwt" (NOT legacy "vc+sd-jwt")
 *   - _sd_alg = "sha-256"
 *   - disclosures are salted: base64url([salt, claimName, claimValue])
 *   - _sd = base64url(SHA-256(disclosure)) per claim
 * Verification accepts BOTH "dc+sd-jwt" and legacy "vc+sd-jwt" for interop.
 */

import { sha256 } from "@noble/hashes/sha256";

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
}

/**
 * Issue an SD-JWT over a set of claims. All claims are selectively
 * disclosable. The holder later reveals a subset by keeping only the
 * corresponding `~disclosure` segments (see selectDisclosures).
 */
export async function issueSDJWT(claims: Record<string, unknown>): Promise<SDCredential> {
  const issuer = await getIssuer();
  const entries = Object.entries(claims);

  const disclosures = entries.map(([key, value]) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const arr: unknown[] = [b64urlEncode(salt), key, value];
    return JSON.stringify(arr);
  });

  const _sd = disclosures.map((d) => b64urlEncode(sha256(enc.encode(d))));

  const header = { alg: "Ed25519", typ: "dc+sd-jwt" };
  const payload = {
    iss: "did:p31:ledger-bridge",
    iat: Math.floor(Date.now() / 1000),
    _sd_alg: "sha-256",
    _sd,
  };

  const h = b64urlEncode(enc.encode(JSON.stringify(header)));
  const p = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("Ed25519", issuer.priv, enc.encode(`${h}.${p}`));
  const jws = `${h}.${p}.${b64urlEncode(new Uint8Array(sig))}`;

  const sdjwt = `${jws}~${disclosures.map((d) => b64urlEncode(enc.encode(d))).join("~")}`;
  const rawPub = new Uint8Array((await crypto.subtle.exportKey("raw", issuer.pub)) as ArrayBuffer);
  return { sdjwt, issuerPubB64: b64urlEncode(rawPub) };
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
