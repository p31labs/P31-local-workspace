// CWP-2026-027 B — Node e2e test for src/sdjwt.ts (RFC 9901 / VC-17).
// CWP-2026-029 P3 — KB-JWT key binding tests (draft-17 §5).
// CWP-2026-029 P6 — ML-DSA-65 post-quantum credential issuance.
// Imported directly via Node 24 type-stripping to exercise the real module.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  issueSDJWT,
  verifySDJWT,
  selectDisclosures,
  getIssuer,
  createPresentation,
  verifyPresentation,
  issueSDJWTPostQuantum,
  verifySDJWTPostQuantum,
  verifySDJWTWithPresentation,
} from "../src/sdjwt.ts";
import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";

test("SD-JWT issues with typ: dc+sd-jwt and verifies all claims", async () => {
  const cred = await issueSDJWT({
    careScore: 85,
    careEvents: 12,
    family: "Smith",
  });
  assert.match(cred.sdjwt, /\./, "compact SD-JWT has header.payload.sig");
  assert.ok(cred.issuerPubB64.length > 0, "issuer pub returned");

  const issuer = await getIssuer();
  const res = await verifySDJWT(cred.sdjwt, issuer.pub);
  assert.equal(res.valid, true, "valid SD-JWT must verify");
  assert.equal(res.disclosed.careScore, 85);
  assert.equal(res.disclosed.careEvents, 12);
  assert.equal(res.disclosed.family, "Smith");
});

test("selective disclosure reveals only chosen claims", async () => {
  const cred = await issueSDJWT({ careScore: 85, careEvents: 12, family: "Smith" });
  const selective = await selectDisclosures(cred.sdjwt, ["careScore", "family"]);
  const issuer = await getIssuer();
  const res = await verifySDJWT(selective, issuer.pub);
  assert.equal(res.valid, true);
  assert.equal(res.disclosed.careScore, 85);
  assert.equal(res.disclosed.family, "Smith");
  assert.equal(res.disclosed.careEvents, undefined, "unrevealed claim stays hidden");
});

test("tampered SD-JWT fails verification", async () => {
  const cred = await issueSDJWT({ careScore: 85 });
  const tampered = cred.sdjwt.slice(0, -4) + "AAAA";
  const issuer = await getIssuer();
  const res = await verifySDJWT(tampered, issuer.pub);
  assert.equal(res.valid, false, "tampered SD-JWT must fail");
});

// ── CWP-2026-029 P3: KB-JWT key binding ──────────────────────────────────

test("KB-JWT: create and verify holder presentation", async () => {
  const holderKP = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
  const holderPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", holderKP.publicKey));
  let bin = "";
  for (let i = 0; i < holderPubRaw.length; i++) bin += String.fromCharCode(holderPubRaw[i]);
  const holderPubB64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const cred = await issueSDJWT({ careScore: 90, family: "Jones" }, holderPubB64);
  assert.match(cred.sdjwt, /\./, "SD-JWT issued with cnf");

  const issuer = await getIssuer();
  const res = await verifySDJWT(cred.sdjwt, issuer.pub);
  assert.equal(res.valid, true);

  const nonce = "challenge-123";
  const aud = "https://verifier.example.com";
  const kbJwt = await createPresentation(
    holderKP.privateKey,
    cred.sdjwt,
    { careScore: 90 },
    nonce,
    aud,
  );
  assert.match(kbJwt, /\./, "KB-JWT has header.payload.sig");

  const kbOk = await verifyPresentation(kbJwt, holderKP.publicKey, nonce, aud, cred.sdjwt);
  assert.equal(kbOk, true, "KB-JWT must verify");
});

test("KB-JWT: fails with wrong nonce", async () => {
  const holderKP = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
  const cred = await issueSDJWT({ careScore: 75 });

  const kbJwt = await createPresentation(
    holderKP.privateKey,
    cred.sdjwt,
    { careScore: 75 },
    "correct-nonce",
    "https://verifier.example.com",
  );

  const kbOk = await verifyPresentation(
    kbJwt, holderKP.publicKey, "wrong-nonce",
    "https://verifier.example.com", cred.sdjwt,
  );
  assert.equal(kbOk, false, "KB-JWT must fail with wrong nonce");
});

test("KB-JWT: fails with wrong holder key", async () => {
  const kp1 = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
  const kp2 = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
  const cred = await issueSDJWT({ careScore: 75 });

  const kbJwt = await createPresentation(
    kp1.privateKey, cred.sdjwt, { careScore: 75 },
    "nonce-1", "https://verifier.example.com",
  );

  const kbOk = await verifyPresentation(
    kbJwt, kp2.publicKey, "nonce-1",
    "https://verifier.example.com", cred.sdjwt,
  );
  assert.equal(kbOk, false, "KB-JWT must fail with wrong holder key");
});

test("KB-JWT: fails with tampered sd_hash", async () => {
  const holderKP = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
  const cred = await issueSDJWT({ careScore: 75 });

  const kbJwt = await createPresentation(
    holderKP.privateKey, cred.sdjwt, { careScore: 75 },
    "nonce-1", "https://verifier.example.com",
  );

  const cred2 = await issueSDJWT({ careScore: 99 });
  const kbOk = await verifyPresentation(
    kbJwt, holderKP.publicKey, "nonce-1",
    "https://verifier.example.com", cred2.sdjwt,
  );
  assert.equal(kbOk, false, "KB-JWT must fail with mismatched sd_hash");
});

// ── CWP-2026-029 P6: ML-DSA-65 post-quantum credential issuance ──────────

test("PQ SD-JWT: ML-DSA-65 issuance with correct header and claims", async () => {
  const pqKP = ml_dsa65.keygen();
  const cred = await issueSDJWTPostQuantum(
    { careScore: 92, algorithm: "ML-DSA-65" },
    pqKP,
  );

  assert.equal(cred.algorithm, "ML-DSA-65");
  assert.ok(cred.issuerPubB64.length > 0, "ML-DSA-65 pub key returned");
  assert.match(cred.sdjwt, /\./, "PQ SD-JWT has header.payload.sig");

  // Parse and verify the JWS header
  const jws = cred.sdjwt.split("~")[0];
  const [h, p, sig] = jws.split(".");
  assert.ok(h && p && sig, "JWS has 3 parts");

  const header = JSON.parse(atob(h.replace(/-/g, "+").replace(/_/g, "/")));
  assert.equal(header.kty, "AKP", "header kty must be AKP");
  assert.equal(header.alg, "ML-DSA-65", "header alg must be ML-DSA-65");
  assert.equal(header.typ, "dc+sd-jwt", "header typ must be dc+sd-jwt");

  // Verify ML-DSA-65 signature
  const payload = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  assert.ok(Array.isArray(payload._sd), "_sd array present");
  assert.equal(payload._sd_alg, "sha-256");

  const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const msg = new TextEncoder().encode(`${h}.${p}`);
  const pkBytes = Uint8Array.from(atob(cred.issuerPubB64), c => c.charCodeAt(0));
  const ok = ml_dsa65.verify(sigBytes, msg, pkBytes);
  assert.equal(ok, true, "ML-DSA-65 signature must verify");
});

test("PQ SD-JWT: selective disclosure reveals only chosen claims", async () => {
  const pqKP = ml_dsa65.keygen();
  const cred = await issueSDJWTPostQuantum(
    { careScore: 88, family: "PQ-Family", score: 42 },
    pqKP,
  );

  const selective = await selectDisclosures(cred.sdjwt, ["careScore", "family"]);
  assert.ok(typeof selective === "string", "selectDisclosures returns a string");

  // Parse the selective SD-JWT to verify only kept disclosures
  const parts = selective.split("~");
  const disc = parts.slice(1).map(d => {
    const decoded = JSON.parse(atob(d.replace(/-/g, "+").replace(/_/g, "/")));
    return { name: decoded[1], value: decoded[2] };
  });

  assert.equal(disc.length, 2, "only 2 disclosures");
  assert.equal(disc.find(d => d.name === "careScore")?.value, 88);
  assert.equal(disc.find(d => d.name === "family")?.value, "PQ-Family");
  assert.equal(disc.find(d => d.name === "score"), undefined, "score not disclosed");
});

test("PQ SD-JWT: tampered PQ SD-JWT fails ML-DSA-65 verification", async () => {
  const pqKP = ml_dsa65.keygen();
  const cred = await issueSDJWTPostQuantum({ careScore: 99 }, pqKP);

  // Parse the original to get its parts
  const jws = cred.sdjwt.split("~")[0];
  const [h, p, sig] = jws.split(".");

  // Corrupt the payload by flipping a byte
  const payloadBytes = Uint8Array.from(atob(p.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  payloadBytes[0] ^= 0xff; // flip first byte
  const corruptedPayload = btoa(String.fromCharCode(...payloadBytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const msg = new TextEncoder().encode(`${h}.${corruptedPayload}`);
  const pkBytes = Uint8Array.from(atob(cred.issuerPubB64), c => c.charCodeAt(0));

  const ok = ml_dsa65.verify(sigBytes, msg, pkBytes);
  assert.equal(ok, false, "tampered PQ SD-JWT must fail ML-DSA-65 verification");
});

// ── CWP-2026-034: Draft-17 vct, exp/nbf, cnf binding, PQ verification ──────

test("SD-JWT includes vct claim in payload", async () => {
  const cred = await issueSDJWT({ careScore: 85 });
  const jws = cred.sdjwt.split("~")[0];
  const [, p] = jws.split(".");
  const payload = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  assert.ok(payload.vct, "vct claim must be present");
  assert.match(payload.vct, /p31ca\.org/, "vct must reference p31ca.org");
});

test("SD-JWT includes exp and nbf time bounds", async () => {
  const cred = await issueSDJWT({ careScore: 85 });
  const jws = cred.sdjwt.split("~")[0];
  const [, p] = jws.split(".");
  const payload = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  assert.ok(typeof payload.nbf === "number", "nbf must be a number");
  assert.ok(typeof payload.exp === "number", "exp must be a number");
  assert.ok(payload.exp > payload.nbf, "exp must be after nbf");
});

test("SD-JWT with expired nbf/exp fails verification", async () => {
  const now = Math.floor(Date.now() / 1000);
  const cred = await issueSDJWT({ careScore: 85 }, undefined, {
    exp: now - 100,
    nbf: now - 200,
  });
  const issuer = await getIssuer();
  const res = await verifySDJWT(cred.sdjwt, issuer.pub);
  assert.equal(res.valid, false, "expired SD-JWT must fail");
  assert.equal(res.error, "expired");
});

test("PQ SD-JWT: verifySDJWTPostQuantum verifies ML-DSA-65 signature", async () => {
  const pqKP = ml_dsa65.keygen();
  const cred = await issueSDJWTPostQuantum({ careScore: 92 }, pqKP);
  const result = await verifySDJWTPostQuantum(cred.sdjwt, pqKP.publicKey);
  assert.equal(result.valid, true, "PQ SD-JWT must verify");
  assert.equal(result.disclosed.careScore, 92);
});

test("PQ SD-JWT: includes vct and time bounds", async () => {
  const pqKP = ml_dsa65.keygen();
  const cred = await issueSDJWTPostQuantum({ careScore: 88 }, pqKP);
  const jws = cred.sdjwt.split("~")[0];
  const [, p] = jws.split(".");
  const payload = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  assert.ok(payload.vct, "vct claim must be present in PQ SD-JWT");
  assert.ok(typeof payload.nbf === "number", "nbf must be a number");
  assert.ok(typeof payload.exp === "number", "exp must be a number");
});

test("SD-JWT with cnf: verifySDJWTWithPresentation validates holder binding", async () => {
  const holderKP = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
  const holderPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", holderKP.publicKey));
  let bin = "";
  for (let i = 0; i < holderPubRaw.length; i++) bin += String.fromCharCode(holderPubRaw[i]);
  const holderPubB64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const cred = await issueSDJWT({ careScore: 90 }, holderPubB64);
  const nonce = "challenge-456";
  const aud = "https://verifier.example.com";
  const kbJwt = await createPresentation(holderKP.privateKey, cred.sdjwt, { careScore: 90 }, nonce, aud);

  // Combine: sdjwt~kbJwt
  const combined = `${cred.sdjwt}~${kbJwt}`;
  const issuer = await getIssuer();
  const result = await verifySDJWTWithPresentation(combined, issuer.pub, nonce, aud);
  assert.equal(result.valid, true);
  assert.equal(result.holderBound, true, "holder must be bound to cnf key");
});

test("SD-JWT with wrong holder key: cnf verification fails", async () => {
  const holderKP = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
  const otherKP = await crypto.subtle.generateKey("Ed25519", false, ["sign", "verify"]);
  const holderPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", holderKP.publicKey));
  let bin = "";
  for (let i = 0; i < holderPubRaw.length; i++) bin += String.fromCharCode(holderPubRaw[i]);
  const holderPubB64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const cred = await issueSDJWT({ careScore: 90 }, holderPubB64);
  const nonce = "challenge-789";
  const aud = "https://verifier.example.com";

  // Sign with OTHER key (not the one in cnf)
  const kbJwt = await createPresentation(otherKP.privateKey, cred.sdjwt, { careScore: 90 }, nonce, aud);
  const combined = `${cred.sdjwt}~${kbJwt}`;
  const issuer = await getIssuer();
  const result = await verifySDJWTWithPresentation(combined, issuer.pub, nonce, aud);
  assert.equal(result.valid, true, "SD-JWT itself is valid");
  assert.equal(result.holderBound, false, "holder key does not match cnf");
});
